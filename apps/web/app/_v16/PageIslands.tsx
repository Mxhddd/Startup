'use client';
// The interactive parts of the inner pages (v16): on the drivers page, the hold-to-tap and
// no-signal demos, and the join form with "A van driver" already chosen. v18 adds the Pilot progress
// numbers (live counts from the public summary, shown only when safe) and the For schools form.
import { useState } from 'react';
import { AREA_IDS, AREA_SPOTS, PILOT_WHATSAPP, checkInterest, type AreaId } from '@pohnch/core';
import { t, type Lang, type MessageKey } from '@pohnch/messages';
import { HoldDemo, SignalDemo } from './Demos';
import { JoinForm, WaitingMap, useSummary } from './Panel';
import { useCountUp } from './delight';
import { meterParts } from './areaMeter';
import { sendInterest } from '../_lib/interest';
import type { Words } from './Phone';

export function DriverIslands({ lang, w, part }: { lang: Lang; w: Words; part: 'demos' | 'join' }) {
  const [role, setRole] = useState<'parent' | 'driver'>('driver');
  const [, setMine] = useState<AreaId | null>(null);
  if (part === 'demos') return <div className="demos2"><HoldDemo w={w} /><SignalDemo w={w} /></div>;
  return <DriverJoin lang={lang} w={w} role={role} setRole={setRole} setMine={setMine} />;
}
function DriverJoin({ lang, w, role, setRole, setMine }: { lang: Lang; w: Words; role: 'parent' | 'driver'; setRole: (r: 'parent' | 'driver') => void; setMine: (a: AreaId | null) => void }) {
  const summary = useSummary(true);
  const areas = AREA_IDS.map((id) => ({ id, label: t(lang, `area.${id}` as MessageKey), spot: id === 'other' ? null : AREA_SPOTS[id] }));
  return <JoinForm w={w} lang={lang} areas={areas} role={role} setRole={setRole} onJoined={setMine} wa={`https://wa.me/${PILOT_WHATSAPP.waNumber}`} meter={summary.meter} />;
}

/* ---------------- v18: Pilot progress (live counts, only when safe to show) ---------------- */

function Count({ n, label }: { n: number; label: string }) {
  const shown = useCountUp(n);
  return <div className="pcount"><b className="num">{shown.toLocaleString('en')}</b><span>{label}</span></div>;
}

export function ProgressIsland({ lang, w }: { lang: Lang; w: Words }) {
  const summary = useSummary(true);
  const areas = AREA_IDS.map((id) => ({ id, label: t(lang, `area.${id}` as MessageKey), spot: id === 'other' ? null : AREA_SPOTS[id] }));
  const families = Object.values(summary.areas).reduce((a, b) => a + b, 0), shownAreas = Object.keys(summary.areas).length;
  const any = families > 0 || summary.proof || Object.keys(summary.meter).length > 0;
  return (
    <div className="progress" data-testid="progress">
      {any ? (
        <div className="pcounts" data-testid="progress-counts">
          {families > 0 && <><Count n={families} label={w['prog.families'] ?? ''} /><Count n={shownAreas} label={w['prog.areas'] ?? ''} /></>}
          {summary.proof && <><Count n={summary.proof.vans} label={w['prog.vans'] ?? ''} /><Count n={summary.proof.trips} label={w['prog.trips'] ?? ''} /><Count n={summary.proof.alerts} label={w['prog.alerts'] ?? ''} /></>}
        </div>
      ) : (
        <div className="pstart" data-testid="progress-start"><h2>{w['prog.start']}</h2><p>{w['prog.startP']}</p></div>
      )}
      <div className="pmap"><h3>{w['prog.map']}</h3><WaitingMap w={w} areas={areas} summary={summary} mine={null} /></div>
      {Object.keys(summary.meter).length > 0 && (
        <ul className="pareas" data-testid="progress-areas">
          {areas.filter((a) => summary.meter[a.id]).map((a) => { const p = meterParts(w, summary.meter[a.id])!; return (
            <li key={a.id} className={`st-${summary.meter[a.id]!.s}`}><b>{a.label}</b><span>{p.families} · {p.driver}</span><em>{p.status}</em></li>
          ); })}
        </ul>
      )}
      <p className="pnote">{w['prog.note']}</p>
    </div>
  );
}

/* ---------------- v18: For schools (interest only) ---------------- */
export function SchoolForm({ lang, w }: { lang: Lang; w: Words }) {
  const [name, setName] = useState(''), [area, setArea] = useState(''), [wa, setWa] = useState(''), [trap, setTrap] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [field, setField] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (state === 'sending') return;
    const c = checkInterest({ role: 'school', area, school: name, whatsapp: wa });
    if (!c.ok) { setField(c.field); return; }
    setField(null); setState('sending');
    setState((await sendInterest(c.value, lang, trap)) ? 'sent' : 'error');
  }
  if (state === 'sent') return <div className="joined" role="status" data-testid="school-sent"><h3>{w['sch.sent']}</h3></div>;
  const err = field === 'school' ? w['sch.needName'] : field === 'whatsapp' ? (wa ? w['join.badPhone'] : w['sch.needWa']) : field === 'area' ? w['join.needArea'] : field ? w['join.err'] : null;
  return (
    <form className="join school" onSubmit={submit} noValidate data-testid="school-form">
      <label className="fld"><span>{w['sch.name']}</span><input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="organization" aria-invalid={field === 'school'} data-testid="school-name" /></label>
      <label className="fld"><span>{w['join.area']}</span>
        <select value={area} onChange={(e) => setArea(e.target.value)} aria-invalid={field === 'area'} data-testid="school-area">
          <option value="">{w['join.areaPick']}</option>
          {AREA_IDS.map((id) => <option key={id} value={id}>{t(lang, `area.${id}` as MessageKey)}</option>)}
        </select>
      </label>
      <label className="fld"><span>{w['sch.wa']}</span><input value={wa} onChange={(e) => setWa(e.target.value)} inputMode="tel" autoComplete="tel" dir="ltr" placeholder="03XX XXXXXXX" aria-invalid={field === 'whatsapp'} data-testid="school-wa" /></label>
      <label className="trap" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} /></label>
      <p className="msg" role="alert" aria-live="assertive">{state === 'error' ? <>{w['join.err']} <a href={`https://wa.me/${PILOT_WHATSAPP.waNumber}`} rel="noreferrer">WhatsApp</a></> : err}</p>
      <div><button className="pill btn" type="submit" disabled={state === 'sending'} data-testid="school-send">{state === 'sending' ? w['join.sending'] : w['sch.send']}</button></div>
    </form>
  );
}
