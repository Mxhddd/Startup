'use client';
// pohnch.pk/app (v21): where the poster's QR code lands. Android only. "Who are you?" (parent or driver),
// then three taps: join the testers' Google Group, become a tester on Play, install. Each tap opens the
// right Google page in a new tab, and the step ticks itself off. Once Google approves production
// (JOIN.public), it is one button straight to the Play listing. The QR on the posters never changes.
// The choice is remembered in the address (#parent / #driver) so a shared link opens on the right one.
import { JOIN, PILOT_WHATSAPP, playListing, playTesting } from '@pohnch/core';
import { t, type Lang, type MessageKey } from '@pohnch/messages';
import { useEffect, useState } from 'react';

type Role = 'parent' | 'driver';
const w = (lang: Lang, key: string) => t(lang, `web.getapp.${key}` as MessageKey);

export function AppJoin({ lang, waitlist }: { lang: Lang; waitlist: string }) {
  const [role, setRole] = useState<Role | null>(null);
  const [done, setDone] = useState<number[]>([]);
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (h === 'parent' || h === 'driver') setRole(h);
  }, []);
  const pick = (r: Role) => {
    setRole(r);
    setDone([]);
    history.replaceState(null, '', `#${r}`);
  };
  const pkg = role ? JOIN.apps[role].pkg : '';
  const steps = role
    ? [
        { n: 1, href: JOIN.testersGroup, title: w(lang, 's1'), body: w(lang, 's1.b') },
        { n: 2, href: playTesting(pkg), title: w(lang, 's2'), body: w(lang, 's2.b') },
        { n: 3, href: playListing(pkg), title: w(lang, 's3'), body: w(lang, 's3.b') },
      ]
    : [];
  const next = steps.find((s) => !done.includes(s.n))?.n ?? 0;
  const apk = role ? JOIN.apk[role] : null;
  return (
    <div className="joinapp">
      <div className="who" role="radiogroup" aria-label={w(lang, 'title')}>
        {(['parent', 'driver'] as const).map((r) => (
          <button key={r} type="button" role="radio" aria-checked={role === r} className={`whobtn ${r}${role === r ? ' on' : ''}`} onClick={() => pick(r)} data-testid={`join-${r}`}>
            <span className={`appicon ${r}`} aria-hidden="true"><b>پہنچ</b></span>
            <span className="whotext"><b>{w(lang, r)}</b><small>{w(lang, `${r}Line`)}</small></span>
          </button>
        ))}
      </div>

      {role ? (
        JOIN.public ? (
          <div className="joinsteps">
            <a className="btn big" href={playListing(pkg)} rel="noreferrer" data-testid="join-play">{w(lang, 'public')}</a>
          </div>
        ) : (
          <div className="joinsteps" aria-live="polite">
            <ol className="miles route joinroute">
              {steps.map((s) => (
                <li key={s.n} className={done.includes(s.n) ? 'done' : s.n === next ? 'now' : ''}>
                  <span className="stone num" aria-hidden="true">{done.includes(s.n) ? '✓' : s.n}</span>
                  <div>
                    <a className={s.n === next ? 'btn' : 'btn ghost'} href={s.href} target="_blank" rel="noreferrer"
                      onClick={() => setDone((d) => (d.includes(s.n) ? d : [...d, s.n]))} data-testid={`join-step-${s.n}`}>{s.title}</a>
                    <p>{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="why">{w(lang, 'why')}</p>
          </div>
        )
      ) : null}

      <div className="joinfoot">
        {role && apk ? (
          <details className="stuck">
            <summary>{w(lang, 'stuck')}</summary>
            <a className="link" href={apk} rel="noreferrer" data-testid="join-apk">{w(lang, 'apk')}</a>
            <p>{w(lang, 'apkNote')}</p>
          </details>
        ) : null}
        <a className="link" href={`https://wa.me/${PILOT_WHATSAPP.waNumber}`} rel="noreferrer">{w(lang, 'help')} · <span className="num" dir="ltr">{PILOT_WHATSAPP.display}</span></a>
        <a className="link quiet" href={waitlist}>{w(lang, 'iphone')}</a>
      </div>
    </div>
  );
}
