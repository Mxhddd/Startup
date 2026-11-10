'use client';
// The pohnch.pk home page, v16 ("a miniature Karachi, from 6:55 am to night"). A normal page that
// scrolls freely (smoothed by Lenis); a fixed 3D miniature of Karachi (world3d.ts) sits behind it and
// follows the scroll: scenes.ts turns the scroll position into the camera, the hour, the colour, the
// route and the van. Tall sections hold still ("pinned", CSS sticky) while their animation plays;
// each gets its progress as --p and a data-step, and the phones change with them. On slow phones
// (or Save-Data, or no WebGL) the 3D never loads ("lite"): the same page with painted skies.
// Every word comes from packages/messages (web.*), in the page's language.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AreaId } from '@pohnch/core';
import { ParentPhone, DriverPhone, type PhoneHandle, type Words } from './Phone';
import { DriverKit, JoinForm, Proof, WaitingMap, useSummary, type Area } from './Panel';
import { countDoubt } from '../_lib/interest';
import { callsAYear, clamp, hourOfClock, karachiHours, skyHex, span } from './hour';
import { SECTIONS, pinned, scrollS, worldAt, type Ctx, type SectionId } from './scenes';
import type { Quality, World } from './world3d';
import { CallsCounter, HoldDemo, OffDemo, SignalDemo, TS } from './Demos';
import './home.css';

export type HomeProps = {
  lang: 'ur' | 'en';
  w: Words;
  areas: Area[];
  qa: [string, string][];
  quotes: { name: string; text: string }[];
  links: { home: string; other: string; drivers: string; safety: string; privacy: string; terms: string; delete: string; download: string };
  wa: { href: string; display: string };
  playUrl: string | null;
  foot: { privacy: string; terms: string; delete: string; download: string; contact: string; switchLang: string };
};

const COVER: SectionId[] = ['try', 'never', 'calc', 'band', 'faq'];
const HEIGHTS: Record<SectionId, number> = { hero: 1.25, calls: 2.8, sides: 3.2, morning: 4.2, lock: 2.6, try: 0, fork: 0, promises: 3.2, never: 0, calc: 0, band: 0, join: 0, faq: 0 };
const Arrow = () => <svg className="arr" width="22" height="12" viewBox="0 0 22 12" aria-hidden="true"><path d="M1 6h19M15 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const WaIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M9 9.5c.3 1.7 2 3.7 4.5 4.5l1.2-1.2 1.8.8-.3 1.6c-3.5.4-7.8-3.5-7.6-7.2l1.6-.3.8 1.8z" fill="currentColor" /></svg>;

function isLite(): boolean {
  if (/[?&]lite\b/.test(location.search)) return true;
  const n = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string }; deviceMemory?: number };
  if (n.connection?.saveData || /(^|-)2g$/.test(n.connection?.effectiveType ?? '')) return true;
  if (typeof n.deviceMemory === 'number' && n.deviceMemory <= 2) return true;
  if ((navigator.hardwareConcurrency ?? 8) <= 2) return true;
  try { const c = document.createElement('canvas'); if (!c.getContext('webgl2')) return true; } catch { return true; }
  return false;
}

export function HomeClient({ lang, w, areas, qa, quotes, links, wa, playUrl, foot }: HomeProps) {
  const root = useRef<HTMLElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const heroPhone = useRef<PhoneHandle>(null), sidesPhone = useRef<PhoneHandle>(null), mornPhone = useRef<PhoneHandle>(null), offPhone = useRef<PhoneHandle>(null);
  const signRef = useRef<HTMLDivElement>(null), stickRef = useRef<HTMLDivElement>(null);
  const [lite, setLite] = useState(false);
  const [heroEta, setHeroEta] = useState(6);
  const [calls, setCalls] = useState({ n: 0, off: false });
  const [sides, setSides] = useState(0);
  const [morn, setMorn] = useState(0);
  const [lockP, setLockP] = useState(0);
  const [plat, setPlat] = useState<'ios' | 'android'>('ios');
  const [flips, setFlips] = useState(0);
  const [road, setRoad] = useState<'yes' | 'unsure' | 'driver' | null>(null);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [calc, setCalc] = useState(4);
  const [role, setRole] = useState<'parent' | 'driver'>('parent');
  const [mine, setMine] = useState<AreaId | null>(null);
  const [menu, setMenu] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [joinSeen, setJoinSeen] = useState(false);
  const summary = useSummary(joinSeen);
  const lenisRef = useRef<{ scrollTo: (t: number | string | HTMLElement, o?: Record<string, unknown>) => void; scroll: number; raf: (t: number) => void; destroy: () => void } | null>(null);
  const playRef = useRef(false);

  const scrollTo = useCallback((target: string | number) => {
    const l = lenisRef.current;
    const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : null;
    if (l) l.scrollTo(el ?? (target as number), { duration: 1.6, offset: 0 });
    else if (el) el.scrollIntoView({ behavior: 'smooth' }); else window.scrollTo({ top: target as number, behavior: 'smooth' });
  }, []);

  /* ---------- the scroll loop: measure, drive the 3D, drive the pinned sections ---------- */
  useEffect(() => {
    const el = root.current; if (!el) return;
    const liteMode = isLite(); setLite(liteMode);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stopped = false, raf = 0, world: World | null = null;
    let tops: number[] = [], hts: number[] = [], vh = innerHeight, cw = innerWidth, ch = innerHeight;
    const touch = matchMedia('(pointer: coarse)').matches;
    const secs = SECTIONS.map((id) => el.querySelector<HTMLElement>(`[data-sec="${id}"]`)!);
    // measure section positions only when the layout changes (never inside the frame loop)
    const measure = () => {
      vh = innerHeight; tops = secs.map((s) => s.getBoundingClientRect().top + scrollY); hts = secs.map((s) => s.offsetHeight);
      // on phones the address bar showing/hiding changes the height while scrolling: don't rebuild the 3D canvas for that
      const big = Math.abs(innerWidth - cw) > 2 || (!touch && Math.abs(innerHeight - ch) > 2) || Math.abs(innerHeight - ch) > 160;
      if (big) { cw = innerWidth; ch = innerHeight; world?.resize(); }
    };
    const ctx: Ctx = { liveHour: hourOfClock(karachiHours(new Date())), heroT: 0, uHome: 0.3, uFork: 0.55, routeAt: () => [0, 0] };
    const t0 = performance.now();
    // Lenis: calm smoothing of mouse-wheel scrolling (not on touch screens, not with reduced motion)
    if (!reduce && !touch && !/[?&]nosmooth\b/.test(location.search)) void import('lenis').then(({ default: Lenis }) => { if (stopped) return; lenisRef.current = new Lenis({ lerp: 0.13, wheelMultiplier: 1, autoRaf: false }) as unknown as typeof lenisRef.current; });
    // how much 3D this device gets: phones and small machines draw without post-processing
    const n = navigator as Navigator & { deviceMemory?: number };
    const cores = navigator.hardwareConcurrency ?? 4, mem = n.deviceMemory ?? 8;
    const quality: Quality = touch || innerWidth < 760 || cores <= 4 || mem <= 4 ? 'low' : cores >= 8 && mem >= 8 ? 'high' : 'mid';
    // the 3D world loads after the page is on screen
    if (!liteMode) void import('./world3d').then((m) => {
      if (stopped || !canvas.current) return;
      try {
        world = m.createWorld(canvas.current, { quality });
        const curve = m.routeCurve();
        ctx.routeAt = world.routeAt; ctx.uHome = m.routeU(m.HOME.x, m.HOME.z - 12, curve); ctx.uFork = m.routeU(m.FORK.x - 21, m.FORK.z, curve);
        el.classList.add('has3d');
      } catch { setLite(true); }
    });
    let last = { eta: -1, calls: -1, off: false, sides: -1, morn: -1, lock: -1, flips: -1, scrolled: false, grey: -1, night: '' };
    const lastP = SECTIONS.map(() => -1), lastVan = [-1, -1, -1];
    let tPrev = performance.now();
    const frame = (now: number) => {
      if (stopped) return;
      lenisRef.current?.raf(now);
      const dt = now - tPrev; tPrev = now;
      const y = scrollY;
      const S = scrollS(y, vh, tops, hts);
      ctx.heroT = (now - t0) / 1000 * TS;
      const st = worldAt(S, ctx);
      // skip drawing the 3D while a solid band (tools, privacy, drivers, questions) covers the whole screen
      const covered = COVER.some((id) => { const i = SECTIONS.indexOf(id); return tops[i]! <= y && tops[i]! + hts[i]! >= y + vh; });
      if (world && !covered) {
        world.setState(st); world.tune(dt);
        if (world.quality === 'low') { const g = Math.round(st.grey * 100) / 100; if (g !== last.grey) { last.grey = g; canvas.current!.style.filter = g > 0 ? `grayscale(${(g * 0.9).toFixed(2)}) brightness(${(1 + g * 0.04).toFixed(2)})` : ''; } }
      }
      el.style.setProperty('--skyc', skyHex(st.hour));
      const night = st.hour > 2.5 ? '1' : '0'; if (night !== last.night) { last.night = night; el.dataset.night = night; }
      // each section's own progress, written only for sections on screen and only when it changed
      const pp: Record<string, number> = {};
      SECTIONS.forEach((id, i) => {
        const top = tops[i]!, h = hts[i]!;
        const v = HEIGHTS[id] > 1 ? pinned(y, vh, top, h) : clamp((y + vh - top) / (h + vh));
        pp[id] = v;
        const onScreen = top < y + vh * 1.5 && top + h > y - vh * 0.5;
        if (onScreen && Math.abs(v - lastP[i]!) > 0.0005) { lastP[i] = v; secs[i]!.style.setProperty('--p', v.toFixed(4)); }
      });
      const vis = (id: SectionId) => { const i = SECTIONS.indexOf(id); return tops[i]! < y + vh && tops[i]! + hts[i]! > y; };
      const moveVan = (k: number, ref: React.RefObject<PhoneHandle | null>, v: number) => { if (Math.abs(v - lastVan[k]!) > 0.001) { lastVan[k] = v; ref.current?.setVan(v); } };
      // hero: the van drives in, the minutes count down
      const eta = Math.max(2, Math.round(6 - clamp(ctx.heroT / 9) * 4)); if (eta !== last.eta) { last.eta = eta; setHeroEta(eta); }
      if (vis('hero')) moveVan(0, heroPhone, 0.2 + clamp(ctx.heroT / 9) * 0.32);
      // calls: stack, then switch
      const nCalls = Math.min(6, Math.floor(span(pp.calls!, 0.05, 0.5) * 6.99)), off = pp.calls! > 0.58;
      if (nCalls !== last.calls || off !== last.off) { last.calls = nCalls; last.off = off; setCalls({ n: nCalls, off }); }
      // both sides: 3 steps
      const s2 = pp.sides! < 0.12 ? 0 : pp.sides! < 0.42 ? 1 : pp.sides! < 0.72 ? 2 : 3; if (s2 !== last.sides) { last.sides = s2; setSides(s2); }
      if (vis('sides')) moveVan(1, sidesPhone, 0.04 + span(pp.sides!, 0.3, 0.75) * 0.5);
      // the morning: 4 beads
      const m = pp.morning!; const s3 = m < 0.08 ? 0 : m < 0.3 ? 1 : m < 0.5 ? 2 : m < 0.86 ? 3 : 4; if (s3 !== last.morn) { last.morn = s3; setMorn(s3); }
      if (vis('morning')) moveVan(2, mornPhone, Math.min(1, 0.25 + span(m, 0.04, 0.92) * 0.75));
      // lock screen countdown
      const lp = Math.round(span(pp.lock!, 0.15, 0.8) * 50) / 50; if (lp !== last.lock) { last.lock = lp; setLockP(lp); }
      // promises: stickers turn over one by one
      const f = Math.floor(span(pp.promises!, 0.18, 0.92) * 7.99); if (f !== last.flips) { last.flips = f; setFlips(f); }
      // signposts stand on the roundabout
      if (world && signRef.current && vis('fork')) { const [px, yy] = world.project(-10, 0, 10); const x = innerWidth < 760 ? innerWidth / 2 : px; signRef.current.style.transform = `translate3d(${x.toFixed(1)}px, ${yy.toFixed(1)}px, 0)`; }
      const sc = y > 40; if (sc !== last.scrolled) { last.scrolled = sc; setScrolled(sc); }
      raf = requestAnimationFrame(frame);
    };
    measure(); raf = requestAnimationFrame(frame);
    const onR = () => measure(); addEventListener('resize', onR);
    const ro = new ResizeObserver(() => measure()); ro.observe(el);
    if (document.fonts) void document.fonts.ready.then(measure);
    // join section loads the waiting map
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); if (e.target.id === 'join') setJoinSeen(true); } }), { rootMargin: '0px 0px -12% 0px' });
    el.querySelectorAll('.rv, #join').forEach((n) => io.observe(n));
    return () => { stopped = true; cancelAnimationFrame(raf); removeEventListener('resize', onR); ro.disconnect(); io.disconnect(); world?.dispose(); lenisRef.current?.destroy(); lenisRef.current = null; };
  }, []);

  /* ---------- play the morning: the page scrolls itself through the story ---------- */
  useEffect(() => {
    if (!playing) return;
    playRef.current = true;
    const end = (document.querySelector<HTMLElement>('[data-sec="try"]')?.offsetTop ?? 0) - 40;
    const start = scrollY, dist = end - start, dur = Math.max(8000, dist * 6), t0 = performance.now();
    let raf = 0;
    const stop = () => { playRef.current = false; setPlaying(false); };
    const tick = (now: number) => {
      if (!playRef.current) return;
      const k = clamp((now - t0) / dur), y = start + dist * k;
      if (lenisRef.current) lenisRef.current.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
      if (k >= 1) { stop(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const userStop = () => stop();
    addEventListener('wheel', userStop, { passive: true }); addEventListener('touchstart', userStop, { passive: true }); addEventListener('keydown', userStop);
    return () => { playRef.current = false; cancelAnimationFrame(raf); removeEventListener('wheel', userStop); removeEventListener('touchstart', userStop); removeEventListener('keydown', userStop); };
  }, [playing]);

  const go = (sel: string) => (e: React.MouseEvent) => { e.preventDefault(); setMenu(false); scrollTo(sel); };
  const pickRoad = (r: 'yes' | 'unsure' | 'driver') => { setRoad(r); if (r === 'driver') setRole('driver'); setTimeout(() => scrollTo('#road'), 60); };
  const flipDoubt = (n: number) => setOpen((s) => { const x = new Set(s); if (x.has(n)) x.delete(n); else { x.add(n); countDoubt(n); } return x; });
  const cta = playUrl
    ? <a className="btn" href={playUrl} rel="noreferrer">{w.ctaPlay}</a>
    : <a className="btn" href="#join" onClick={go('#join')}>{w.cta}</a>;
  const share = `https://wa.me/?text=${encodeURIComponent(w['share.text'] ?? '')}`;
  const dir = lang === 'ur' ? 'rtl' : 'ltr';
  const morningAlert = [null, w['morning.1h'], w['morning.2h'], w['sides.alert'], w['morning.4h']][morn] ?? null;
  const callTimes = ['6:49', '6:51', '6:52', '6:54', '6:55', '6:57'];
  const yearly = callsAYear(calc);

  return (
    <main ref={root} className={`v16 ${lite ? 'lite' : ''} ${menu ? 'menu-open' : ''}`} lang={lang} dir={dir} data-lang={lang}>
      <canvas ref={canvas} className="world" aria-hidden="true" />
      <div className="sky" aria-hidden="true" />

      {/* ---------- top bar ---------- */}
      <header className={`bar ${scrolled ? 'scrolled' : ''}`}>
        <a className="mark" href={links.home} aria-label={w['nav.home']}><b>پہنچ</b><span>Pohnch</span></a>
        <nav className="nav" aria-label={w['nav.menu']}>
          <a href="#how" onClick={go('#how')}>{w['nav.how']}</a>
          <a href="#safety" onClick={go('#safety')}>{w['nav.safety']}</a>
          <a href={links.drivers}>{w['nav.drivers']}</a>
          <a href="#questions" onClick={go('#questions')}>{w['nav.questions']}</a>
        </nav>
        <a className="lang" href={links.other} hrefLang={lang === 'ur' ? 'en' : 'ur'} lang={lang === 'ur' ? 'en' : 'ur'}>{foot.switchLang}</a>
        <span className="barcta">{cta}</span>
        <button className="menub" type="button" aria-expanded={menu} aria-controls="menu" onClick={() => setMenu(!menu)}>{menu ? w['nav.close'] : w['nav.menu']}</button>
      </header>
      <nav className="menu" id="menu" hidden={!menu} aria-label={w['nav.menu']}>
        <a href="#how" onClick={go('#how')}>{w['nav.how']}</a>
        <a href="#safety" onClick={go('#safety')}>{w['nav.safety']}</a>
        <a href={links.drivers}>{w['nav.drivers']}</a>
        <a href="#questions" onClick={go('#questions')}>{w['nav.questions']}</a>
        <a href="#join" onClick={go('#join')}>{w.cta}</a>
        <a href={links.other}>{foot.switchLang}</a>
      </nav>

      {/* ---------- hero ---------- */}
      <section className="sec hero" data-sec="hero" style={{ height: '125vh' }} aria-labelledby="h-hero">
        <div className="stick">
          <div className="hero-copy">
            <p className="kick">{w['hero.k']}</p>
            <h1 id="h-hero"><span className="l1">{w['hero.h1']}</span> <span className="l2">{w['hero.h2']}</span></h1>
            <p className="lede">{w['hero.p']}</p>
            <div className="acts">{cta}<a className="link" href="#how" onClick={go('#how')}>{w['hero.more']}<Arrow /></a></div>
            <ul className="facts">{[1, 2, 3, 4].map((n) => <li key={n}>{w[`hero.f${n}`]}</li>)}</ul>
            <button className="play" type="button" onClick={() => setPlaying(true)}><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 2l9 5-9 5z" fill="currentColor" /></svg>{w.play}</button>
          </div>
          <ParentPhone ref={heroPhone} className="hero-phone" w={w} mode="map" eta={heroEta} step={0} title={w['morning.1h'] ?? ''} />
          <div className="cue" aria-hidden="true"><i /></div>
        </div>
      </section>

      {/* ---------- 1. the 7 am phone call ---------- */}
      <section className={`sec calls ${calls.off ? 'off' : ''}`} data-sec="calls" style={{ height: `${HEIGHTS.calls * 100}vh` }} aria-labelledby="h-calls">
        <div className="stick">
          <div className="copy">
            <p className="kick">{w['calls.k']}</p>
            <h2 id="h-calls">{w['calls.h']}</h2>
            <p>{w['calls.p']}</p>
          </div>
          <ol className="log" aria-hidden="true">
            {callTimes.map((t, k) => <li key={t} className={k < calls.n ? 'on' : ''} style={{ ['--k' as string]: k }}><svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 6l5 5 4-4M12 7h-3M12 7v3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg><b>{w['calls.who']}</b><small>{w['calls.missed']}</small><span className="num">{t}</span></li>)}
            <li className={`tally ${calls.n >= 6 ? 'on' : ''}`}><b className="num">×{calls.n}</b></li>
          </ol>
          <div className="look" aria-live="polite"><span>{w['calls.end1']}</span> <em>{w['calls.end2']}</em></div>
        </div>
      </section>

      {/* ---------- 2. one van, both sides ---------- */}
      <section id="how" className="sec sides" data-sec="sides" data-step={sides} style={{ height: `${HEIGHTS.sides * 100}vh` }} aria-labelledby="h-sides">
        <div className="stick">
          <div className="copy center">
            <p className="kick">{w['sides.k']}</p>
            <h2 id="h-sides">{w['sides.h']}</h2>
          </div>
          <div className="pair">
            <DriverPhone w={w} started={sides >= 1} tapped={sides >= 3} className="dp" />
            <div className="link-beam" aria-hidden="true"><i /></div>
            <ParentPhone ref={sidesPhone} className="pp" w={w} mode="map" eta={sides >= 3 ? null : 6 - sides} step={sides >= 3 ? 2 : 0} title={sides >= 3 ? w['sides.alert'] ?? '' : w['morning.1h'] ?? ''} alert={sides >= 3 ? w['sides.alert'] : sides >= 1 ? w['morning.1h'] : null} />
          </div>
          <ol className="steps">
            {[1, 2, 3].map((n) => <li key={n} className={sides === n ? 'on' : sides > n ? 'past' : ''}><span className="num">{n}</span><div><b>{w[`sides.${n}t`]}</b><p>{w[`sides.${n}p`]}</p></div></li>)}
          </ol>
        </div>
      </section>

      {/* ---------- 3. the morning, minute by minute ---------- */}
      <section className="sec morning" data-sec="morning" data-step={morn} style={{ height: `${HEIGHTS.morning * 100}vh` }} aria-labelledby="h-morning">
        <div className="stick">
          <div className="copy">
            <p className="kick">{w['morning.k']}</p>
            <h2 id="h-morning">{w['morning.h']}</h2>
            <ol className="tl">
              {[1, 2, 3, 4].map((n) => <li key={n} className={morn >= n ? 'on' : ''}><span className="t num">{w[`morning.${n}t`]}</span><i className={`b b${n}`} /><div><b>{w[`morning.${n}h`]}</b><p>{w[`morning.${n}p`]}</p></div></li>)}
            </ol>
            <p className={`fin ${morn >= 4 ? 'on' : ''}`}>{w['morning.end']}</p>
          </div>
          <ParentPhone ref={mornPhone} className="mp" w={w} mode="map" eta={morn <= 1 ? 6 - morn * 3 : null} step={Math.max(0, morn - 1)} title={morningAlert ?? w['morning.1h'] ?? ''} alert={morningAlert} />
        </div>
      </section>

      {/* ---------- 4. the lock screen ---------- */}
      <section className="sec lock" data-sec="lock" style={{ height: `${HEIGHTS.lock * 100}vh` }} aria-labelledby="h-lock">
        <div className="stick">
          <div className="copy">
            <p className="kick">{w['lock.k']}</p>
            <h2 id="h-lock">{w['lock.h']}</h2>
            <p>{w['lock.p']}</p>
            <div className="seg" role="group" aria-label={w['lock.k']}>
              {(['ios', 'android'] as const).map((p) => <button key={p} type="button" aria-pressed={plat === p} onClick={() => setPlat(p)}>{w[`lock.${p}`]}</button>)}
            </div>
          </div>
          <ParentPhone className="lp" w={w} mode="lock" plat={plat} eta={null} step={1} title="" lockP={lockP} />
        </div>
      </section>

      {/* ---------- 5. try it ---------- */}
      <section className="sec try paper" data-sec="try" aria-labelledby="h-try">
        <div className="wrap">
          <p className="kick rv">{w['try.k']}</p>
          <h2 id="h-try" className="rv">{w['try.h']}</h2>
          <div className="demos">
            <OffDemo w={w} phone={offPhone} />
            <HoldDemo w={w} />
            <SignalDemo w={w} />
          </div>
        </div>
      </section>

      {/* ---------- 6. the fork ---------- */}
      <section className="sec fork" data-sec="fork" aria-labelledby="h-fork">
        <div className="fork-stage">
          <div className="copy">
            <p className="kick">{w['fork.k']}</p>
            <h2 id="h-fork">{w['fork.h']}</h2>
            <p>{w['fork.p']}</p>
          </div>
          <div className="sign" ref={signRef}>
            <span className="pole" aria-hidden="true" />
            {(['yes', 'unsure', 'driver'] as const).map((r, k) => (
              <button key={r} type="button" className={`arm a${k + 1} ${road === r ? 'chosen' : ''}`} aria-pressed={road === r} aria-controls="road" onClick={() => pickRoad(r)}><b>{w[`fork.${r}`]}</b><small>{w[`fork.${r}.s`]}</small></button>
            ))}
          </div>
        </div>
        <div id="road" className={`road ${road ?? 'none'}`} aria-live="polite">
          {road === 'yes' && (
            <div className="wrap">
              <h3>{w['yes.h']}</h3>
              <ol className="miles">{[1, 2, 3].map((n) => <li key={n} style={{ ['--k' as string]: n }}><span className="stone num" aria-hidden="true">{n}</span><b>{w[`yes.${n}t`]}</b><p>{w[`yes.${n}p`]}</p></li>)}</ol>
              <p className="need">{w['yes.need']}</p>
              <div className="acts">{cta}</div>
            </div>
          )}
          {road === 'unsure' && (
            <div className="wrap">
              <h3>{w['unsure.h']}</h3>
              <div className="doubts">{[1, 2, 3, 4, 5, 6].map((n) => (
                <button key={n} type="button" className={`doubt ${open.has(n) ? 'open' : ''}`} aria-expanded={open.has(n)} onClick={() => flipDoubt(n)} style={{ ['--k' as string]: n }}>
                  <span className="q">{w[`d.${n}`]}</span><span className="a">{w[`d.${n}.b`]}</span>
                </button>))}
              </div>
              <div className="acts"><b className="ask">{w['unsure.ask']}</b>{cta}<a className="link" href={`${wa.href}?text=${encodeURIComponent(w['unsure.waText'] ?? '')}`} rel="noreferrer">{w['unsure.no']}<Arrow /></a></div>
            </div>
          )}
          {road === 'driver' && (
            <div className="wrap">
              <h3>{w['drv.h']}</h3>
              <CallsCounter label={w['drv.c'] ?? ''} />
              <ol className="miles">{[1, 2, 3].map((n) => <li key={n} style={{ ['--k' as string]: n }}><span className="stone num" aria-hidden="true">{n}</span><p>{w[`drv.${n}`]}</p></li>)}</ol>
              <div className="acts"><a className="btn" href="#join" onClick={(e) => { setRole('driver'); go('#join')(e); }}>{w['drv.go']}</a><a className="link" href={links.drivers}>{w['drv.more']}<Arrow /></a></div>
            </div>
          )}
        </div>
      </section>

      {/* ---------- 7. promises ---------- */}
      <section id="safety" className="sec promises" data-sec="promises" style={{ height: `${HEIGHTS.promises * 100}vh` }} aria-labelledby="h-prom">
        <div className="stick">
          <div className="copy">
            <p className="kick">{w['prom.k']}</p>
            <h2 id="h-prom">{w['prom.h']}</h2>
            <p>{w['prom.p']}</p>
            <a className="link" href={links.safety}>{w['prom.all']}<Arrow /></a>
          </div>
          <div className="stickers" ref={stickRef}>
            {[1, 2, 3, 4, 5, 6, 7].map((n, k) => (
              <div key={n} className={`stk ${k < flips ? 'flip' : ''}`} style={{ ['--k' as string]: k }}>
                <div className="in"><div className="f"><span className="mk">پہنچ</span><b>{w[`p${n}`] ?? ''}</b></div><div className="b"><b>{w[`p${n}`]}</b><p>{w[`p${n}.b`]}</p></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- 8. what we never collect ---------- */}
      <section className="sec never paper" data-sec="never" aria-labelledby="h-never">
        <div className="wrap">
          <p className="kick rv">{w['never.k']}</p>
          <h2 id="h-never" className="rv">{w['never.h']}</h2>
          <ul className="nolist">{[1, 2, 3, 4].map((n) => <li key={n} className="rv" style={{ ['--k' as string]: n }}><span>{w[`never.${n}`]}</span></li>)}</ul>
          <p className="rv note">{w['never.p']}</p>
          <a className="link rv" href={links.privacy}>{w['never.more']}<Arrow /></a>
        </div>
      </section>

      {/* ---------- 9. calls calculator ---------- */}
      <section className="sec calc paper" data-sec="calc" aria-labelledby="h-calc">
        <div className="wrap">
          <p className="kick rv">{w['calc.k']}</p>
          <h2 id="h-calc" className="rv">{w['calc.h']}</h2>
          <div className="calcbox rv">
            <label className="slider"><span className="sr">{w['calc.label']}</span><input type="range" min={0} max={10} step={1} value={calc} onChange={(e) => setCalc(Number(e.target.value))} aria-valuetext={String(calc)} /><b className="num">{calc}</b></label>
            {calc > 0 ? (
              <p className="out"><b className="big num" key={yearly}>{yearly.toLocaleString('en')}</b><span>{w['calc.out']}</span><small>{(w['calc.how'] ?? '').replace('{c}', String(calc))}</small></p>
            ) : <p className="out"><span>{w['calc.zero']}</span></p>}
          </div>
        </div>
      </section>

      {/* ---------- 10. drivers band ---------- */}
      <section className="sec band" data-sec="band" aria-labelledby="h-band">
        <div className="wrap">
          <p className="kick rv">{w['band.k']}</p>
          <h2 id="h-band" className="rv">{w['band.h']}</h2>
          <p className="rv">{w['band.p']}</p>
          <div className="acts rv"><a className="btn light" href="#join" onClick={(e) => { setRole('driver'); go('#join')(e); }}>{w['drv.go']}</a><a className="link" href={links.drivers}>{w['drv.more']}<Arrow /></a></div>
        </div>
      </section>

      {/* ---------- 11. quotes (only real ones) ---------- */}
      {quotes.length > 0 && (
        <section className="sec quotes paper"><div className="wrap"><p className="kick">{w['quotes.k']}</p>{quotes.map((q) => <figure key={q.name}><blockquote>{q.text}</blockquote><figcaption>{q.name}</figcaption></figure>)}</div></section>
      )}

      {/* ---------- 12. join ---------- */}
      <section id="join" className="sec join night" data-sec="join" aria-labelledby="h-join">
        <div className="wrap">
          <div className="joingrid">
            <div className="jl">
              <p className="kick">{w['join.k']}</p>
              <h2 id="h-join">{role === 'driver' ? w['join.titleDriver'] : w['join.title']}</h2>
              <p>{w['join.lead']}</p>
              <a className="link" href={share} target="_blank" rel="noreferrer"><WaIcon />{w['share.btn']}<Arrow /></a>
            </div>
            <JoinForm w={w} lang={lang} areas={areas} role={role} setRole={setRole} onJoined={setMine} wa={wa.href} />
          </div>
          <div className="waitwrap"><h3>{w['wait.title']}</h3><WaitingMap w={w} areas={areas} summary={summary} mine={mine} /></div>
          <div className="two">
            <div><h3>{w['kit.title']}</h3><p>{w['kit.lead']}</p><DriverKit w={w} lang={lang} /></div>
            <div className="why"><h3>{w['why.title']}</h3><blockquote>{w['why.body']}</blockquote><cite>{w['why.sign']}</cite><Proof w={w} proof={summary.proof} /></div>
          </div>
        </div>
      </section>

      {/* ---------- 13. questions and footer ---------- */}
      <section id="questions" className="sec faq night" data-sec="faq" aria-labelledby="h-faq">
        <div className="wrap">
          <h2 id="h-faq">{w['faq.title']}</h2>
          <div className="qa">{qa.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
          <footer>
            <div className="fl"><span className="mark"><b>پہنچ</b><span>Pohnch</span></span><small>{w['foot.made']}</small><button className="link" type="button" onClick={() => scrollTo(0)}>{w['foot.again']}<Arrow /></button></div>
            <nav aria-label={w['nav.menu']}>
              <a href={links.safety}>{w['nav.safety']}</a><a href={links.drivers}>{w['nav.drivers']}</a><a href={links.download}>{foot.download}</a><a href={links.privacy}>{foot.privacy}</a><a href={links.terms}>{foot.terms}</a><a href={links.delete}>{foot.delete}</a>
              <a href={wa.href} rel="noreferrer">{foot.contact} <bdi dir="ltr" className="num">{wa.display}</bdi></a><a href={links.other}>{foot.switchLang}</a>
            </nav>
          </footer>
        </div>
      </section>

      <div className={`playbar ${playing ? 'on' : ''}`} aria-hidden={!playing}><i /><span>{w.play}</span><button type="button" onClick={() => { playRef.current = false; setPlaying(false); }}>{w.pause}</button></div>
    </main>
  );
}

