'use client';
// The join tools (v16, first built for v15): the "Join the pilot" form, the waiting map of Karachi, the
// "Invite your driver" kit (a ready WhatsApp message and a printable card with a QR code), the share
// link for the family group, the pilot numbers and the "Why we built this" note. Words arrive as props
// (w = every web.* word in one language); data goes through _lib/interest.ts.
import { useEffect, useId, useRef, useState } from 'react';
import qrcode from 'qrcode-generator';
import { checkInterest, type AreaId } from '@pohnch/core';
import { fetchSummary, sendInterest, type Summary } from '../_lib/interest';

export type Words = Record<string, string>;
export type Area = { id: AreaId; label: string; spot: [number, number] | null };

const fill = (s: string | undefined, vars: Record<string, string | number>) => (s ?? '').replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

/* ---------------- Join the pilot ---------------- */
export function JoinForm({ w, lang, areas, role, setRole, onJoined, wa, initialArea }: {
  w: Words; lang: 'ur' | 'en'; areas: Area[]; role: 'parent' | 'driver'; setRole: (r: 'parent' | 'driver') => void; onJoined: (area: AreaId) => void; wa: string;
  /** The area picked at the front door ("Where do you live?"), already chosen in the form. */
  initialArea?: AreaId | null;
}) {
  const id = useId();
  const [area, setArea] = useState('');
  useEffect(() => { if (initialArea) setArea((cur) => cur || initialArea); }, [initialArea]);
  const [school, setSchool] = useState('');
  const [kids, setKids] = useState(1);
  const [driverPhone, setDriverPhone] = useState<'yes' | 'no' | 'unknown'>('unknown');
  const [whatsapp, setWhatsapp] = useState('');
  const [trap, setTrap] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [field, setField] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'sending') return;
    const checked = checkInterest({ role, area, school, kids, driverPhone, whatsapp });
    if (!checked.ok) { setField(checked.field); return; }
    setField(null); setState('sending');
    const ok = await sendInterest(checked.value, lang, trap);
    setState(ok ? 'sent' : 'error');
    if (ok) onJoined(checked.value.area);
  }

  if (state === 'sent') {
    return (
      <div className="joined" role="status" data-testid="join-sent">
        <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="26" fill="none" stroke="#E8A33D" strokeWidth="2" /><path d="M17 29l7 7 15-16" fill="none" stroke="#E8A33D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <h3>{w['join.sent']}</h3>
        <p>{w['join.sentB']} <a href={wa} rel="noreferrer">WhatsApp</a></p>
      </div>
    );
  }
  const err = field === 'area' ? w['join.needArea'] : field === 'whatsapp' ? w['join.badPhone'] : field ? w['join.err'] : null;
  return (
    <form className="join" onSubmit={submit} noValidate data-testid="join-form">
      <fieldset className="seg">
        <legend>{w['join.role']}</legend>
        {(['parent', 'driver'] as const).map((r) => (
          <label key={r}><input type="radio" name={`${id}-role`} value={r} checked={role === r} onChange={() => setRole(r)} /><span>{w[`join.${r}`]}</span></label>
        ))}
      </fieldset>
      <label className="fld">
        <span>{w['join.area']}</span>
        <select value={area} onChange={(e) => setArea(e.target.value)} aria-invalid={field === 'area'} data-testid="join-area">
          <option value="" disabled>{w['join.areaPick']}</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
      </label>
      <label className="fld">
        <span>{w['join.school']}</span>
        <input value={school} onChange={(e) => setSchool(e.target.value)} maxLength={80} placeholder={w['join.schoolHint']} autoComplete="off" />
      </label>
      {role === 'parent' && (
        <>
          <div className="fld">
            <span id={`${id}-kids`}>{w['join.kids']}</span>
            <div className="stepper" role="group" aria-labelledby={`${id}-kids`}>
              <button type="button" onClick={() => setKids((k) => Math.max(1, k - 1))} aria-label="−">−</button>
              <b className="num" aria-live="polite">{kids}</b>
              <button type="button" onClick={() => setKids((k) => Math.min(6, k + 1))} aria-label="+">+</button>
            </div>
          </div>
          <fieldset className="seg small">
            <legend>{w['join.phone']}</legend>
            {(['yes', 'no', 'unknown'] as const).map((v) => (
              <label key={v}><input type="radio" name={`${id}-dp`} value={v} checked={driverPhone === v} onChange={() => setDriverPhone(v)} /><span>{w[`join.${v}`]}</span></label>
            ))}
          </fieldset>
        </>
      )}
      <label className="fld">
        <span>{w['join.wa']}</span>
        <input type="tel" inputMode="tel" dir="ltr" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="03XX XXXXXXX" autoComplete="tel" aria-invalid={field === 'whatsapp'} className="num" />
        <small>{w['join.waNote']}</small>
      </label>
      <label className="trap" aria-hidden="true">website<input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} /></label>
      <div className="send">
        <button className="pill" type="submit" disabled={state === 'sending'} data-testid="join-send">{state === 'sending' ? w['join.sending'] : w['join.send']}</button>
        <p className="msg" role="alert" aria-live="assertive">{state === 'error' ? w['join.err'] : err}</p>
      </div>
    </form>
  );
}

/* ---------------- Families waiting near you ---------------- */
export function WaitingMap({ w, areas, summary, mine }: { w: Words; areas: Area[]; summary: Summary; mine: AreaId | null }) {
  const shown = areas.filter((a) => a.spot);
  const any = Object.keys(summary.areas).length > 0;
  return (
    <div className="waitmap">
      <div className="mb">
      <svg viewBox="0 0 600 420" role="img" aria-label={w['wait.title']}>
        <defs>
          <radialGradient id="glow"><stop offset="0" stopColor="#F6C46E" stopOpacity=".9" /><stop offset="1" stopColor="#E8A33D" stopOpacity="0" /></radialGradient>
        </defs>
        <path d="M0 300 C 80 290 120 320 170 340 S 260 360 300 380 S 420 400 600 395 L600 420 L0 420 Z" fill="#0B1029" />
        <path d="M0 300 C 80 290 120 320 170 340 S 260 360 300 380 S 420 400 600 395" fill="none" stroke="rgba(232,163,61,.35)" strokeWidth="1.5" strokeDasharray="2 6" />
        <g stroke="rgba(245,238,225,.08)" strokeWidth="1">{[80, 160, 240, 320].map((y) => <line key={y} x1="0" x2="600" y1={y} y2={y} />)}{[100, 200, 300, 400, 500].map((x) => <line key={x} y1="0" y2="380" x1={x} x2={x} />)}</g>
        <path d="M40 330 L560 60" stroke="rgba(245,238,225,.12)" strokeWidth="3" />
        {shown.map((a) => {
          const [fx, fy] = a.spot!; const x = fx * 600, y = fy * 380; const n = summary.areas[a.id] ?? 0; const me = mine === a.id;
          const r = n ? 10 + Math.sqrt(n) * 4 : 0;
          return (
            <g key={a.id} className={me ? 'me' : undefined}>
              {n > 0 && <circle cx={x} cy={y} r={r * 2.2} fill="url(#glow)" />}
              <circle cx={x} cy={y} r={n ? 5 : 3} fill={n || me ? '#F6C46E' : 'rgba(245,238,225,.35)'} />
              {me && <circle className="ring" cx={x} cy={y} r="10" fill="none" stroke="#F6C46E" strokeWidth="2" />}
            </g>
          );
        })}
      </svg>
      {/* labels are HTML so they stay readable (15 px+) at every width */}
      {shown.filter((a) => (summary.areas[a.id] ?? 0) > 0 || mine === a.id).map((a) => {
        const n = summary.areas[a.id] ?? 0;
        return <span key={a.id} className="lbl" style={{ left: `${a.spot![0] * 100}%`, top: `${(a.spot![1] * 380 / 420) * 100}%` }}>{a.label}{n > 0 ? ` · ${fill(w['wait.n'], { n })}` : ''}</span>;
      })}
      </div>
      <p className="cap">{mine ? w['wait.you'] : any ? w['wait.lead'] : w['wait.empty']}</p>
    </div>
  );
}

/* ---------------- Invite your driver ---------------- */
function cleanName(s: string): string { return s.replace(/[^\p{L}\s'.-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 24); }
function cardHTML(w: Words, lang: 'ur' | 'en', name: string): string {
  const qr = qrcode(0, 'M'); qr.addData('https://pohnch.pk/drivers'); qr.make();
  const svg = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  const dir = lang === 'ur' ? 'rtl' : 'ltr';
  const esc = (s: string | undefined) => (s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  return `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><title>Pohnch</title><style>
  @page{size:A6;margin:0}body{margin:0;font-family:'Noto Sans Arabic','Manrope',system-ui,sans-serif;background:#F5EEE1;color:#10162F}
  .c{box-sizing:border-box;width:105mm;height:148mm;padding:10mm;display:flex;flex-direction:column;gap:5mm;border:2mm solid #1F2A5C;outline:.4mm solid #E8A33D;outline-offset:-3.4mm}
  .m{font-size:13mm;line-height:1.2;margin:0}.m span{font:800 6mm Manrope,sans-serif;margin-inline-start:3mm}.q{width:55mm;height:55mm;align-self:center}
  p{margin:0;font-size:4.4mm;line-height:1.6}.u{font:800 5mm Manrope,sans-serif;direction:ltr;text-align:center}.n{font-weight:700;color:#B8862F}</style></head>
  <body><div class="c"><p class="m">پہنچ<span>Pohnch</span></p>${name ? `<p class="n">${esc(name)}</p>` : ''}<p>${esc(w['kit.card'])}</p><div class="q">${svg}</div><p class="u">pohnch.pk/drivers</p></div>
  <script>setTimeout(function(){print()},300)</script></body></html>`;
}
export function DriverKit({ w, lang }: { w: Words; lang: 'ur' | 'en' }) {
  const [name, setName] = useState('');
  const clean = cleanName(name);
  const msg = fill(w['kit.msg'], { name: clean || '…' });
  const send = `https://wa.me/?text=${encodeURIComponent(fill(w['kit.msg'], { name: clean }).replace(/\s+\./, '.'))}`;
  function print() {
    const url = URL.createObjectURL(new Blob([cardHTML(w, lang, clean)], { type: 'text/html' }));
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  return (
    <div className="kit">
      <label className="fld"><span>{w['kit.name']}</span><input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder={lang === 'ur' ? 'رفیق' : 'Rafiq'} autoComplete="off" data-testid="kit-name" /></label>
      <blockquote className="msgq" data-testid="kit-msg">{msg}</blockquote>
      <div className="send">
        <a className="pill" href={send} target="_blank" rel="noreferrer" aria-disabled={!clean} onClick={(e) => { if (!clean) e.preventDefault(); }}>{w['kit.send']}</a>
        <button className="go" type="button" onClick={print}>{w['kit.print']}</button>
      </div>
    </div>
  );
}

/* ---------------- Pilot numbers (only once they mean something) ---------------- */
export function Proof({ w, proof }: { w: Words; proof: Summary['proof'] }) {
  if (!proof) return null;
  const items: [number, string][] = [[proof.vans, w['proof.vans'] ?? ''], [proof.trips, w['proof.trips'] ?? ''], [proof.alerts, w['proof.alerts'] ?? '']];
  return <div className="proof">{items.map(([n, l]) => <div key={l}><b className="num">{n.toLocaleString('en')}</b><span>{l}</span></div>)}</div>;
}

/** Loads the waiting-map counts and pilot numbers once the panel is on screen. */
export function useSummary(open: boolean): Summary {
  const [s, setS] = useState<Summary>({ areas: {}, proof: null });
  const asked = useRef(false);
  useEffect(() => {
    if (!open || asked.current) return;
    asked.current = true;
    void fetchSummary().then(setS);
  }, [open]);
  return s;
}
