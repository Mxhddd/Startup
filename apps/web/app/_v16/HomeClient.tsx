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
import { callsAYear, clamp, hourOfClock, karachiClock, karachiHours, skyHex, span } from './hour';
import { FLY_SECS, SECTIONS, dialStart, pinned, scrollS, worldAt, type Ctx, type SectionId } from './scenes';
import { Hub, HUB_HASH, type HubTopic } from './Hub';
import type { Quality, World, WorldWords } from './world3d';
import { HoldDemo, OffDemo, SignalDemo, TS } from './Demos';
import { FrontDoor } from './FrontDoor';
import { Intro } from './Intro';
import { initDelight, useCountUp } from './delight';
import { SiteFooter } from './Footer';
import { Glints, Roundel, truckVars } from './truckart';
import { panelSvg, svgUri, TC } from './truckartSvg';
import './home.css';

export type HomeProps = {
  lang: 'ur' | 'en';
  w: Words;
  areas: Area[];
  qa: [string, string][];
  quotes: { name: string; text: string }[];
  doorQuotes: { parent: { name: string; text: string } | null; driver: { name: string; text: string } | null };
  links: { home: string; other: string; drivers: string; safety: string; privacy: string; terms: string; delete: string; download: string; story: string; progress: string; schools: string };
  wa: { href: string; display: string };
  playUrl: string | null;
  foot: { privacy: string; terms: string; delete: string; download: string; contact: string; switchLang: string };
  /** Words the 3D city paints on its boards, the van and the shop signs. */
  worldWords: WorldWords;
};

// v19: about 30% tighter than v18 (calls 2.8, sides 3.2, morning 4.2, lock 2.6 screens)
const COVER: SectionId[] = ['hub'];
const HEIGHTS: Record<SectionId, number> = { hero: 1.25, calls: 2.0, sides: 2.4, morning: 3.0, lock: 1.8, hub: 0, join: 0 };
const fill = (t: string | undefined, v: Record<string, string | number>) => Object.entries(v).reduce((a, [k, x]) => a.replace(`{${k}}`, String(x)), t ?? '');
const Arrow = () => <svg className="arr" width="22" height="12" viewBox="0 0 22 12" aria-hidden="true"><path d="M1 6h19M15 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const WaIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M9 9.5c.3 1.7 2 3.7 4.5 4.5l1.2-1.2 1.8.8-.3 1.6c-3.5.4-7.8-3.5-7.6-7.2l1.6-.3.8 1.8z" fill="currentColor" /></svg>;

const LITE_KEY = 'pohnch-lite';
function isLite(): boolean {
  if (/[?&]lite\b/.test(location.search)) return true;
  // this phone already struggled with the 3D earlier in this visit (v20): go straight to the pictures
  try { if (sessionStorage.getItem(LITE_KEY) === '1' && !/[?&]keep3d\b/.test(location.search)) return true; } catch { /* storage blocked: decide afresh */ }
  const n = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string }; deviceMemory?: number };
  if (n.connection?.saveData || /(^|-)2g$/.test(n.connection?.effectiveType ?? '')) return true;
  if (typeof n.deviceMemory === 'number' && n.deviceMemory <= 2) return true;
  if ((navigator.hardwareConcurrency ?? 8) <= 2) return true;
  try { const c = document.createElement('canvas'); if (!c.getContext('webgl2')) return true; } catch { return true; }
  return false;
}

export function HomeClient({ lang, w, areas, qa, quotes, doorQuotes, links, wa, playUrl, foot, worldWords }: HomeProps) {
  const root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const sidesPhone = useRef<PhoneHandle>(null), mornPhone = useRef<PhoneHandle>(null), offPhone = useRef<PhoneHandle>(null);
  const [lite, setLite] = useState(false);
  // the 3D state is React state (not a class added by hand), so re-renders (the menu, the language) never drop it
  const [has3d, setHas3d] = useState(false), [fallback, setFallback] = useState(false);
  const [area, setArea] = useState<AreaId | null>(null);
  const [calls, setCalls] = useState({ n: 0, off: false });
  const [sides, setSides] = useState(0);
  const [morn, setMorn] = useState(0);
  const [lockP, setLockP] = useState(0);
  const [plat, setPlat] = useState<'ios' | 'android'>('ios');
  // v19 "you play the driver": the parent's phone lights only once Got in is held (or the reader scrolls on)
  const [driverTapped, setDriverTapped] = useState(false);
  const tappedRef = useRef(false);
  const tapNow = useCallback(() => { tappedRef.current = true; setDriverTapped(true); }, []);
  const [hubOpen, setHubOpen] = useState<string | null>('how');
  const [calc, setCalc] = useState(4);
  const [role, setRole] = useState<'parent' | 'driver'>('parent');
  const [mine, setMine] = useState<AreaId | null>(null);
  const [menu, setMenu] = useState(false);
  // v20: which story chapter is on screen (-1 before the story, 0-3 calls/sides/morning/lock, 4 after)
  const [chap, setChap] = useState(-1);
  useEffect(() => { if (!menu) return; const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); }; addEventListener('keydown', esc); return () => removeEventListener('keydown', esc); }, [menu]);
  const [scrolled, setScrolled] = useState(false);
  const [, setJoinSeen] = useState(false);
  // v19 "A school day": the minute the dial shows (null until the page knows Karachi's time)
  const [dayMin, setDayMin] = useState<number | null>(null);
  const [dayNight, setDayNight] = useState(false);
  const [nowMin, setNowMin] = useState<number | null>(null);
  const dayRef = useRef<number | null>(null), dialTouched = useRef(false);
  useEffect(() => {
    const tick = () => {
      const k = karachiClock(new Date()), n = k.h * 60 + k.m; setNowMin(n);
      if (dialTouched.current) return;
      const st = dialStart(n, k.day); setDayNight(st.night); setDayMin(st.min); dayRef.current = st.min;
    };
    tick(); const t = setInterval(tick, 60000); return () => clearInterval(t);
  }, []);
  const onDay = (m: number) => { dialTouched.current = true; setDayMin(m); dayRef.current = m; };
  const summary = useSummary(true);
  const lenisRef = useRef<{ scrollTo: (t: number | string | HTMLElement, o?: Record<string, unknown>) => void; scroll: number; raf: (t: number) => void; destroy: () => void } | null>(null);

  const scrollTo = useCallback((target: string | number) => {
    const l = lenisRef.current;
    const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : null;
    if (l) l.scrollTo(el ?? (target as number), { duration: 1.6, offset: 0 });
    const behavior: ScrollBehavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    if (!l && el) el.scrollIntoView({ behavior }); else if (!l && typeof target === 'number') window.scrollTo({ top: target, behavior });
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
    const ctx: Ctx = { liveHour: hourOfClock(karachiHours(new Date())), heroT: 0, uHome: 0.3, uFork: 0.55, routeAt: () => [0, 0], flyT: -1 };
    const t0 = performance.now();
    // v19: the fly-in starts when the intro opens (never with reduced motion)
    let flyStart = 0;
    const onOpen = () => { flyStart = performance.now(); };
    addEventListener('pohnch:intro-open', onOpen);
    // Lenis: calm smoothing of mouse-wheel scrolling (not on touch screens, not with reduced motion)
    if (!reduce && !touch && !/[?&]nosmooth\b/.test(location.search)) void import('lenis').then(({ default: Lenis }) => { if (stopped) return; lenisRef.current = new Lenis({ lerp: 0.13, wheelMultiplier: 1, autoRaf: false }) as unknown as typeof lenisRef.current; });
    // how much 3D this device gets: phones and small machines draw without post-processing
    const n = navigator as Navigator & { deviceMemory?: number };
    const cores = navigator.hardwareConcurrency ?? 4, mem = n.deviceMemory ?? 8;
    const quality: Quality = touch || innerWidth < 760 || cores <= 4 || mem <= 4 ? 'low' : cores >= 8 && mem >= 8 ? 'high' : 'mid';
    // the 3D world builds while the intro plays (its cost hides behind the sunrise); if the code can't load
    // (offline, a failed download) or the device can't draw it, the page uses the painted pictures instead
    const toPictures = (remember: boolean) => {
      if (stopped) return;
      world?.dispose(); world = null; worldRef.current = null;
      setHas3d(false); setFallback(true); setLite(true);
      if (remember) { try { sessionStorage.setItem(LITE_KEY, '1'); } catch { /* fine: decide again next time */ } }
    };
    if (!liteMode) import('./world3d').then((m) => {
      if (stopped || !canvas.current) return;
      try {
        world = m.createWorld(canvas.current, { quality, words: worldWords });
        const curve = m.routeCurve();
        ctx.routeAt = world.routeAt; ctx.uHome = m.routeU(m.HOME.x, m.HOME.z - 12, curve); ctx.uFork = m.routeU(m.FORK.x - 21, m.FORK.z, curve);
        worldRef.current = world;
        setHas3d(true);
      } catch { toPictures(false); }
    }).catch(() => toPictures(false));
    // the stutter test (v20): once the fly-in is over, time about 90 drawn frames; if the median frame takes
    // longer than the device can afford (45 ms on phones, 70 ms elsewhere), switch to the pictures for this visit
    const probe = TS === 1 && !/[?&]keep3d\b/.test(location.search);
    const samples: number[] = [];
    let last = { eta: -1, calls: -1, off: false, sides: -1, morn: -1, lock: -1, scrolled: false, grey: -1, night: '', story: -1, chap: -2 };
    const lastP = SECTIONS.map(() => -1), lastVan = [-1, -1, -1];
    let tPrev = performance.now();
    const frame = (now: number) => {
      if (stopped) return;
      lenisRef.current?.raf(now);
      const dt = now - tPrev; tPrev = now;
      const y = scrollY;
      const S = scrollS(y, vh, tops, hts);
      if (!flyStart && now - t0 > 6000 / TS) flyStart = now; // the intro's signal never came: fly in anyway
      ctx.flyT = reduce ? Infinity : flyStart ? (now - flyStart) / 1000 * TS : -1;
      ctx.heroT = flyStart ? Math.max(0, ctx.flyT) : (now - t0) / 1000 * TS;
      ctx.dayMin = dayRef.current;
      const st = worldAt(S, ctx);
      // skip drawing the 3D while a solid band (tools, privacy, drivers, questions) covers the whole screen
      const covered = COVER.some((id) => { const i = SECTIONS.indexOf(id); return tops[i]! <= y && tops[i]! + hts[i]! >= y + vh; });
      if (world && !covered) {
        world.setState(st); world.tune(dt);
        if (probe && samples.length < 90 && ctx.flyT > FLY_SECS + 0.6 && !document.hidden && dt < 400) {
          samples.push(dt);
          if (samples.length === 90) { const med = [...samples].sort((a, b) => a - b)[45]!; if (med > (world.quality === 'low' ? 45 : 70)) toPictures(true); }
        }
        if (world && world.quality === 'low') { const g = Math.round(st.grey * 100) / 100; if (g !== last.grey) { last.grey = g; canvas.current!.style.filter = g > 0 ? `grayscale(${(g * 0.9).toFixed(2)}) brightness(${(1 + g * 0.04).toFixed(2)})` : ''; } }
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
      // calls: stack, then switch
      const nCalls = Math.min(6, Math.floor(span(pp.calls!, 0.05, 0.5) * 6.99)), off = pp.calls! > 0.58;
      if (nCalls !== last.calls || off !== last.off) { last.calls = nCalls; last.off = off; setCalls({ n: nCalls, off }); }
      // both sides: 3 steps. Step 3 waits for the reader to hold Got in; scrolling on taps it for them
      const s2 = pp.sides! < 0.1 ? 0 : pp.sides! < 0.35 ? 1 : pp.sides! < 0.6 ? 2 : 3; if (s2 !== last.sides) { last.sides = s2; setSides(s2); }
      if (s2 < 3 && tappedRef.current) { tappedRef.current = false; setDriverTapped(false); }
      if (pp.sides! > 0.92 && !tappedRef.current) { tappedRef.current = true; setDriverTapped(true); }
      if (vis('sides')) moveVan(1, sidesPhone, 0.04 + span(pp.sides!, 0.25, 0.6) * 0.5);
      // the morning: 4 beads
      const m = pp.morning!; const s3 = m < 0.08 ? 0 : m < 0.3 ? 1 : m < 0.5 ? 2 : m < 0.86 ? 3 : 4; if (s3 !== last.morn) { last.morn = s3; setMorn(s3); }
      if (vis('morning')) moveVan(2, mornPhone, Math.min(1, 0.25 + span(m, 0.04, 0.92) * 0.75));
      // lock screen countdown
      const lp = Math.round(span(pp.lock!, 0.15, 0.8) * 50) / 50; if (lp !== last.lock) { last.lock = lp; setLockP(lp); }
      const sc = y > 40; if (sc !== last.scrolled) { last.scrolled = sc; setScrolled(sc); }
      const ci = Math.floor(S) - 1, ch = ci < 0 ? -1 : ci > 3 ? 4 : ci; if (ch !== last.chap) { last.chap = ch; setChap(ch); }
      // the star in the top bar fills as you read the story (up to the hub)
      const iHub = SECTIONS.indexOf('hub'), story = Math.round(clamp(y / Math.max(1, tops[iHub]! - vh * 0.5)) * 200) / 200;
      if (story !== last.story) { last.story = story; el.style.setProperty('--story', String(story)); }
      raf = requestAnimationFrame(frame);
    };
    measure(); raf = requestAnimationFrame(frame);
    const onR = () => measure(); addEventListener('resize', onR);
    const ro = new ResizeObserver(() => measure()); ro.observe(el);
    if (document.fonts) void document.fonts.ready.then(measure);
    // join section loads the waiting map
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); if (e.target.id === 'join') setJoinSeen(true); } }), { rootMargin: '0px 0px -12% 0px' });
    el.querySelectorAll('.rv, #join').forEach((n) => io.observe(n));
    const undoDelight = initDelight(el);
    return () => { stopped = true; cancelAnimationFrame(raf); removeEventListener('pohnch:intro-open', onOpen); removeEventListener('resize', onR); ro.disconnect(); io.disconnect(); undoDelight(); world?.dispose(); lenisRef.current?.destroy(); lenisRef.current = null; };
  }, []);


  // a link to a hub topic (#safety, #questions...) opens that topic and scrolls to the hub
  const go = (sel: string) => (e: React.MouseEvent) => { e.preventDefault(); setMenu(false); const t = HUB_HASH[sel]; if (t) { setHubOpen(t); setTimeout(() => scrollTo('#hub'), 40); } else scrollTo(sel); };
  useEffect(() => {
    const open = () => { const t = HUB_HASH[location.hash]; if (t) { setHubOpen(t); setTimeout(() => document.getElementById('hub')?.scrollIntoView(), 120); } };
    open(); addEventListener('hashchange', open); return () => removeEventListener('hashchange', open);
  }, []);
  // "For parents": remember the area for this visit only, put it on a street sign in the city, start the story
  const startParents = (a: AreaId | null) => {
    setArea(a);
    try { history.replaceState(null, '', '#parents'); } catch { /* not important */ }
    setTimeout(() => scrollTo('[data-sec="calls"]'), 80);
  };
  useEffect(() => {
    const label = area ? areas.find((x) => x.id === area)?.label ?? null : null;
    const font = getComputedStyle(document.documentElement).getPropertyValue(lang === 'ur' ? '--font-urdu' : '--font-latin').trim() || 'sans-serif';
    let tries = 0; let t: ReturnType<typeof setTimeout>;
    const apply = () => { if (worldRef.current) worldRef.current.setAreaLabel(label, font, lang === 'ur'); else if (tries++ < 40) t = setTimeout(apply, 250); };
    apply(); return () => clearTimeout(t);
  }, [area, areas, lang]);
  const cta = playUrl
    ? <a className="btn" href={playUrl} rel="noreferrer">{w.ctaPlay}</a>
    : <a className="btn" href="#join" onClick={go('#join')}>{w.cta}</a>;
  const share = `https://wa.me/?text=${encodeURIComponent(w['share.text'] ?? '')}`;
  const dir = lang === 'ur' ? 'rtl' : 'ltr';
  // v19: with an area picked, the story names it ("6 min to your door in Gulshan-e-Iqbal")
  const areaLabel = area ? areas.find((x) => x.id === area)?.label ?? null : null;
  const leftWord = areaLabel ? fill(w['area.left'], { area: areaLabel }) : w['morning.1h'];
  const etaWord = (m: number) => areaLabel ? fill(w['area.eta'], { m, area: areaLabel }) : null;
  const morningAlert = [null, leftWord, w['morning.2h'], w['sides.alert'], w['morning.4h']][morn] ?? null;
  const sidesOn = driverTapped && sides >= 3;
  const callTimes = ['6:49', '6:51', '6:52', '6:54', '6:55', '6:57'];
  const yearly = useCountUp(callsAYear(calc));
  const arrivalArt = svgUri(panelSvg(760, 300, { ground: TC.neel, seed: 4 }));
  // the questions: the FAQ plus the honest answers that aren't already in it (safe? won't use an app? who are you?)
  const doubt = (n: number) => <details key={`d${n}`} onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) countDoubt(n); }}><summary>{w[`d.${n}`]}</summary><p>{w[`d.${n}.b`]}</p></details>;
  const topics: HubTopic[] = [
    { id: 'how', label: w['hub.t.how'] ?? '', content: <>
      <h3>{w['yes.h']}</h3>
      <ol className="miles">{[1, 2, 3].map((n) => <li key={n} style={{ ['--k' as string]: n }}><span className="stone num" aria-hidden="true">{n}</span><b>{w[`yes.${n}t`]}</b><p>{w[`yes.${n}p`]}</p></li>)}</ol>
      <p className="need">{w['yes.need']}</p>
      <div className="acts">{cta}</div>
    </> },
    { id: 'try', label: w['hub.t.try'] ?? '', content: <>
      <h3>{w['try.h']}</h3>
      <div className="demos"><OffDemo w={w} phone={offPhone} /><HoldDemo w={w} /><SignalDemo w={w} /></div>
    </> },
    { id: 'safety', label: w['hub.t.safety'] ?? '', content: <>
      <h3>{w['prom.h']}</h3>
      <ul className="promlist">{[1, 2, 3, 4, 5, 6, 7].map((n) => <li key={n} style={{ ['--k' as string]: n }}><Roundel size={34} /><div><b>{w[`p${n}`]}</b><p>{w[`p${n}.b`]}</p></div></li>)}</ul>
      <p className="hubhelp"><b>{w['sf.help.t']}</b> {w['sf.help.p']}</p>
      <a className="link" href={links.safety}>{w['prom.all']}<Arrow /></a>
    </> },
    { id: 'privacy', label: w['hub.t.privacy'] ?? '', content: <>
      <h3>{w['never.h']}</h3>
      <ul className="nolist">{[1, 2, 3, 4].map((n) => <li key={n} className="in" style={{ ['--k' as string]: n }}><span>{w[`never.${n}`]}</span></li>)}</ul>
      <p className="note">{w['never.p']}</p>
      <a className="link" href={links.privacy}>{w['never.more']}<Arrow /></a>
    </> },
    { id: 'cost', label: w['hub.t.cost'] ?? '', content: <>
      <p className="hubfree">{w['hub.free']}</p>
      <h3>{w['calc.h']}</h3>
      <div className="calcbox">
        <label className="slider"><span className="sr">{w['calc.label']}</span><input className="range" type="range" min={0} max={10} step={1} value={calc} onChange={(e) => setCalc(Number(e.target.value))} aria-valuetext={String(calc)} /><b className="num">{calc}</b></label>
        {calc > 0 ? (
          <p className="out"><b className="big num">{yearly.toLocaleString('en')}</b><span>{w['calc.out']}</span><small>{(w['calc.how'] ?? '').replace('{c}', String(calc))}</small></p>
        ) : <p className="out"><span>{w['calc.zero']}</span></p>}
      </div>
    </> },
    { id: 'drivers', label: w['hub.t.drivers'] ?? '', content: <>
      <h3>{w['band.h']}</h3>
      <p>{w['band.p']}</p>
      <ol className="miles">{[1, 2, 3].map((n) => <li key={n}><span className="stone num" aria-hidden="true">{n}</span><p>{w[`drv.${n}`]}</p></li>)}</ol>
      <div className="acts"><a className="btn" href="#join" onClick={(e) => { setRole('driver'); go('#join')(e); }}>{w['drv.go']}</a><a className="link" href={links.drivers}>{w['drv.more']}<Arrow /></a></div>
    </> },
    { id: 'questions', label: w['hub.t.questions'] ?? '', content: <>
      <h3>{w['faq.title']}</h3>
      <div className="qa">{doubt(1)}{qa.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}{doubt(3)}{doubt(6)}</div>
      <div className="acts"><a className="link" href={`${wa.href}?text=${encodeURIComponent(w['unsure.waText'] ?? '')}`} rel="noreferrer">{w['unsure.no']}<Arrow /></a></div>
    </> },
  ];

  return (
    <div ref={root} className={`v16 ${lite ? 'lite' : ''} ${has3d ? 'has3d' : ''} ${fallback ? 'fallback' : ''} ${menu ? 'menu-open' : ''}`} lang={lang} dir={dir} data-lang={lang} style={truckVars()}>
      <Intro skipLabel={w['intro.skip'] ?? ''} />
      <canvas ref={canvas} className="world" aria-hidden="true" />
      <div className="sky" aria-hidden="true" />

      {/* ---------- top bar ---------- */}
      <header className={`bar ${scrolled ? 'scrolled' : ''}`}>
        <a className="mark" href={links.home} aria-label={w['nav.home']}><b>پہنچ</b><span>Pohnch</span><span className="pstar" aria-hidden="true"><svg viewBox="0 0 20 20" width="18" height="18"><path className="po" d="M10 0.8l1.9 4.6 4.6-1.9-1.9 4.6L19.2 10l-4.6 1.9 1.9 4.6-4.6-1.9L10 19.2l-1.9-4.6-4.6 1.9 1.9-4.6L0.8 10l4.6-1.9-1.9-4.6 4.6 1.9z" /></svg><svg viewBox="0 0 20 20" width="18" height="18" className="pfw"><path className="pf" d="M10 0.8l1.9 4.6 4.6-1.9-1.9 4.6L19.2 10l-4.6 1.9 1.9 4.6-4.6-1.9L10 19.2l-1.9-4.6-4.6 1.9 1.9-4.6L0.8 10l4.6-1.9-1.9-4.6 4.6 1.9z" /></svg></span></a>
        <nav className="nav" aria-label={w['nav.main']}>
          <a href="#how" onClick={go('#how')}>{w['nav.how']}</a>
          <a href="#safety" onClick={go('#safety')}>{w['nav.safety']}</a>
          <a href={links.drivers}>{w['nav.drivers']}</a>
          <a href={links.story}>{w['nav.story']}</a>
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
        <a href={links.story}>{w['nav.story']}</a>
        <a href="#questions" onClick={go('#questions')}>{w['nav.questions']}</a>
        <a href="#join" onClick={go('#join')}>{w.cta}</a>
        <a href={links.other}>{foot.switchLang}</a>
      </nav>
      <nav className={`chapters ${chap >= 0 && chap <= 3 ? 'on' : ''}`} aria-label={w['chap.label']}>
        <ol>{(['calls', 'how', 'morning', 'lock'] as const).map((id, k) => (
          <li key={id} className={chap === k ? 'on' : chap > k ? 'past' : ''}><a href={`#${id}`} onClick={go(`#${id}`)} aria-label={w[`${id === 'how' ? 'sides' : id}.k`]} aria-current={chap === k ? 'step' : undefined}><i /></a></li>
        ))}</ol>
        <a className="skip" href="#hub" onClick={go('#hub')}>{w['chap.skip']}</a>
      </nav>

      <main id="main">

      {/* ---------- the front door: for parents / for drivers ---------- */}
      <section className="sec hero" data-sec="hero" style={{ height: '125vh' }} aria-labelledby="h-hero">
        <div className="stick">
          <FrontDoor w={w} areas={areas} driversHref={links.drivers} quotes={doorQuotes} onParents={startParents} onArea={setArea}
            day={{ min: dayMin, night: dayNight, nowMin, onDay }} area={area} meter={area ? summary.meter[area] : undefined} meterStatus={summary.status} />
        </div>
      </section>

      {/* ---------- 1. the 7 am phone call ---------- */}
      <section id="calls" className={`sec calls ${calls.off ? 'off' : ''}`} data-sec="calls" style={{ height: `${HEIGHTS.calls * 100}vh` }} aria-labelledby="h-calls">
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
            <DriverPhone w={w} started={sides >= 1} tapped={sidesOn} className="dp" onHold={sides >= 3 && !driverTapped ? tapNow : undefined} />
            <div className="link-beam" aria-hidden="true"><i /></div>
            <ParentPhone ref={sidesPhone} className="pp" w={w} mode="map" eta={sidesOn ? null : Math.max(1, 6 - sides)} step={sidesOn ? 2 : 0} title={sidesOn ? w['sides.alert'] ?? '' : leftWord ?? ''} alert={sidesOn ? w['sides.alert'] : sides >= 1 ? leftWord : null} />
          </div>
          <p className={`youdrive ${sides >= 3 ? 'on' : ''} ${sidesOn ? 'done' : ''}`} aria-live="polite" data-testid="youdrive">{sides >= 3 ? (sidesOn ? w['sides.youDone'] : w['sides.you']) : ''}</p>
          <ol className="steps">
            {[1, 2, 3].map((n) => <li key={n} className={sides === n ? 'on' : sides > n ? 'past' : ''}><span className="num">{n}</span><div><b>{w[`sides.${n}t`]}</b><p>{n === 2 ? etaWord(6) ?? w['sides.2p'] : w[`sides.${n}p`]}</p></div></li>)}
          </ol>
        </div>
      </section>

      {/* ---------- 3. the morning, minute by minute ---------- */}
      <section id="morning" className="sec morning" data-sec="morning" data-step={morn} style={{ height: `${HEIGHTS.morning * 100}vh` }} aria-labelledby="h-morning">
        <div className="stick">
          <div className="copy">
            <p className="kick">{w['morning.k']}</p>
            <h2 id="h-morning">{w['morning.h']}</h2>
            <ol className="tl">
              {[1, 2, 3, 4].map((n) => <li key={n} className={morn >= n ? 'on' : ''}><span className="t num">{w[`morning.${n}t`]}</span><i className={`b b${n}`} /><div><b>{n === 1 ? leftWord : w[`morning.${n}h`]}</b><p>{n === 1 ? etaWord(6) ?? w['morning.1p'] : w[`morning.${n}p`]}</p></div></li>)}
            </ol>
          </div>
          <ParentPhone ref={mornPhone} className="mp" w={w} mode="map" eta={morn <= 1 ? 6 - morn * 3 : null} step={Math.max(0, morn - 1)} title={morningAlert ?? w['morning.1h'] ?? ''} alert={morningAlert} />
          {/* v19 the arrival: the city dims, a painted panel rises and پہنچ گئے is written stroke by stroke */}
          <div className="arrive" aria-hidden="true" data-testid="arrive">
            <div className="arrpanel">
              <span className="arrart" style={{ backgroundImage: arrivalArt }} />
              <svg className="arrword" viewBox="0 0 760 300" overflow="visible"><text x="380" y="210" textAnchor="middle" lang="ur">{w.reached}</text></svg>
              <Glints n={6} />
            </div>
            <p className="arrsub"><small>{w['reached.sub']}</small><b>{w['morning.end']}</b></p>
          </div>
        </div>
      </section>

      {/* ---------- 4. the lock screen ---------- */}
      <section id="lock" className="sec lock" data-sec="lock" style={{ height: `${HEIGHTS.lock * 100}vh` }} aria-labelledby="h-lock">
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

      {/* ---------- 5. everything you'd ask (v19): one hub instead of a long trail of sections ---------- */}
      <Hub kick={w['hub.k'] ?? ''} title={w['hub.h'] ?? ''} lead={w['hub.lead'] ?? ''} topics={topics} open={hubOpen} onOpen={setHubOpen} />
      {/* ---------- 6. quotes (only real ones) ---------- */}
      {quotes.length > 0 && (
        <section className="sec quotes paper" aria-labelledby="h-quotes"><div className="wrap"><h2 id="h-quotes" className="kick">{w['quotes.k']}</h2>{quotes.map((q) => <figure key={q.name}><blockquote>{q.text}</blockquote><figcaption>{q.name}</figcaption></figure>)}</div></section>
      )}

      {/* ---------- 7. join ---------- */}
      <section id="join" className="sec join night" data-sec="join" aria-labelledby="h-join">
        <div className="wrap">
          <div className="joingrid">
            <div className="jl">
              <p className="kick">{w['join.k']}</p>
              <h2 id="h-join">{role === 'driver' ? w['join.titleDriver'] : w['join.title']}</h2>
              <p>{w['join.lead']}</p>
              <a className="link" href={share} target="_blank" rel="noreferrer"><WaIcon />{w['share.btn']}<Arrow /></a>
            </div>
            <JoinForm w={w} lang={lang} areas={areas} role={role} setRole={setRole} onJoined={setMine} wa={wa.href} initialArea={area} meter={summary.meter} meterStatus={summary.status} />
          </div>
          <div className="waitwrap"><h3>{w['wait.title']}</h3><WaitingMap w={w} areas={areas} summary={summary} mine={mine ?? area} /></div>
          <div className="two">
            <div><h3>{w['kit.title']}</h3><p>{w['kit.lead']}</p><DriverKit w={w} lang={lang} /></div>
            <div className="why"><h3>{w['why.title']}</h3><blockquote>{w['why.body']}</blockquote><cite>{w['why.sign']}</cite><Proof w={w} proof={summary.proof} /></div>
          </div>
        </div>
      </section>
      </main>

      <SiteFooter w={w} wa={wa} onAgain={() => scrollTo(0)}
        line={{ ur: worldWords.lines[2]?.ur ?? '', en: worldWords.lines[2]?.en ?? '' }}
        links={{ home: links.home, how: '#how', safety: links.safety, drivers: links.drivers, download: links.download, story: links.story, progress: links.progress, schools: links.schools, privacy: links.privacy, terms: links.terms, delete: links.delete, other: links.other }}
        labels={{ privacy: foot.privacy, terms: foot.terms, delete: foot.delete, download: foot.download, contact: foot.contact, switchLang: foot.switchLang, otherLang: lang === 'ur' ? 'en' : 'ur' }} />
    </div>
  );
}

