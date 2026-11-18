'use client';
// /van-uncle (v24): "Which Van Uncle do you have?", a 5-question quiz made to be shared. The result
// is a sketchbook card with a drawn van uncle; Share sends a link with only the result id (?r=dj), and a
// friend who opens it sees that result first, then "Find yours". Nothing about the person is stored.
import { dirOf, t, type Lang, type MessageKey } from '@pohnch/messages';
import { useEffect, useState } from 'react';
import { asType, QUESTIONS, resultOf, type UncleType } from '../_lib/vanUncle';
import { SOCIAL } from '../_lib/social';
import './tokens.css';
import './vanuncle.css';

const w = (lang: Lang, key: string, v?: Record<string, string | number>) => t(lang, `web.vu.${key}` as MessageKey, v);

/** The pencil van with one prop that says which uncle it is. */
function Uncle({ type }: { type: UncleType }) {
  return (
    <svg className={`vu-art vu-${type}`} viewBox="0 0 320 200" aria-hidden="true">
      <defs><filter id="vuPen" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="4" /><feDisplacementMap in="SourceGraphic" scale="2.4" /></filter></defs>
      <ellipse cx="160" cy="176" rx="120" ry="8" fill="#0E1022" opacity=".18" />
      <g className="vu-body" filter="url(#vuPen)">
        <path d="M44 162V82a14 14 0 0 1 14-14h150c10 0 17 4 22 11l40 52a12 12 0 0 1 4 9v22Z" fill="#E8A33D" stroke="#0E1022" strokeWidth="4" strokeLinejoin="round" />
        <path d="M60 80h40v30H60ZM108 80h40v30h-40ZM156 80h40v30h-40ZM204 80h12c5 0 9 2 12 6l18 24h-42Z" fill="#DDE6F2" stroke="#0E1022" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="226" cy="96" r="9" fill="#F3D2B0" stroke="#0E1022" strokeWidth="2.5" />
        <path d="M218 92c2-6 14-6 16 0" fill="#141A33" />
        <rect x="46" y="124" width="226" height="10" fill="#C2185B" />
        <circle cx="96" cy="164" r="17" fill="#0E1022" /><circle cx="96" cy="164" r="6" fill="#E8A33D" />
        <circle cx="230" cy="164" r="17" fill="#0E1022" /><circle cx="230" cy="164" r="6" fill="#E8A33D" />
      </g>
      {type === 'toofan' ? <g className="vu-prop" stroke="#FBF7EF" strokeWidth="5" strokeLinecap="round"><path d="M8 90h28M0 116h34M12 142h24" /></g> : null}
      {type === 'paanch' ? <g className="vu-prop"><rect x="236" y="14" width="76" height="44" rx="14" fill="#FFFDF8" stroke="#0E1022" strokeWidth="3" /><path d="M250 58l-6 12 16-12" fill="#FFFDF8" stroke="#0E1022" strokeWidth="3" strokeLinejoin="round" /><text x="274" y="44" textAnchor="middle" fontSize="20" fontWeight="800" fill="#141A33">5:00</text></g> : null}
      {type === 'dj' ? <g className="vu-prop" fill="#FBF7EF"><text x="250" y="40" fontSize="34">♪</text><text x="282" y="62" fontSize="26">♫</text><text x="230" y="70" fontSize="22">♪</text></g> : null}
      {type === 'gayab' ? <g className="vu-prop"><rect x="262" y="10" width="34" height="56" rx="8" fill="#FFFDF8" stroke="#0E1022" strokeWidth="3" /><text x="279" y="48" textAnchor="middle" fontSize="28" fontWeight="800" fill="#C2185B">?</text></g> : null}
      {type === 'farishta' ? <g className="vu-prop"><ellipse cx="226" cy="74" rx="16" ry="5" fill="none" stroke="#F6C46E" strokeWidth="4" /><path d="M290 30l4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" fill="#F6C46E" /></g> : null}
    </svg>
  );
}

function Result({ lang, type, friend, onAgain }: { lang: Lang; type: UncleType; friend: boolean; onAgain: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = `https://pohnch.pk${lang === 'ur' ? '/ur' : ''}/van-uncle?r=${type}`;
  const text = w(lang, 'shareText', { name: w(lang, type), url });
  return (
    <section className="vu-result" data-testid="vu-result" data-type={type}>
      <p className="vu-kick">{w(lang, friend ? 'friendKick' : 'kick')}</p>
      <div className="vu-card">
        <Uncle type={type} />
        <h2>{w(lang, type)}</h2>
        <p className="vu-line">{w(lang, `${type}Line`)}</p>
        <p className="vu-fix">{w(lang, `${type}Fix`)}</p>
        <span className="vu-brand" lang="en" dir="ltr">pohnch.pk/van-uncle</span>
      </div>
      {friend ? (
        <button type="button" className="vu-btn main" onClick={onAgain} data-testid="vu-take">{w(lang, 'take')}</button>
      ) : (
        <>
          <a className="vu-btn main" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" data-testid="vu-share">{w(lang, 'share')}</a>
          <button type="button" className="vu-btn" onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); } catch { /* no clipboard */ } }}>{copied ? w(lang, 'copied') : w(lang, 'copy')}</button>
        </>
      )}
      <a className="vu-btn ghost" href={SOCIAL.instagram} target="_blank" rel="noreferrer">{w(lang, 'follow')}</a>
      <a className="vu-btn ghost" href={lang === 'ur' ? '/ur/links' : '/links'}>{w(lang, 'getApp')}</a>
      {!friend ? <button type="button" className="vu-link" onClick={onAgain}>{w(lang, 'again')}</button> : null}
    </section>
  );
}

export function VanUncleQuiz({ lang, shared }: { lang: Lang; shared?: string | null }) {
  const friendType = asType(shared);
  const [step, setStep] = useState<number>(friendType ? -2 : -1); // -2 friend's result, -1 intro, 0..4 questions, 5 result
  const [answers, setAnswers] = useState<number[]>([]);
  useEffect(() => { if (step >= 0) window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);
  const restart = () => { setAnswers([]); setStep(-1); };
  return (
    <div className="v16 vu" lang={lang} dir={dirOf(lang)} data-lang={lang}>
      <span className="vu-band" aria-hidden="true" />
      <main className="vu-main">
        {step === -2 && friendType ? <Result lang={lang} type={friendType} friend onAgain={restart} /> : null}
        {step === -1 ? (
          <section className="vu-intro">
            <Uncle type="paanch" />
            <h1>{w(lang, 'title')}</h1>
            <p>{w(lang, 'lead')}</p>
            <button type="button" className="vu-btn main" onClick={() => setStep(0)} data-testid="vu-start">{w(lang, 'start')}</button>
          </section>
        ) : null}
        {step >= 0 && step < QUESTIONS.length ? (
          <section className="vu-q" key={step}>
            <p className="vu-progress">{w(lang, 'progress', { n: step + 1 })}<span style={{ ['--p' as string]: `${((step + 1) / QUESTIONS.length) * 100}%` }} /></p>
            <h2>{w(lang, `q${step + 1}`)}</h2>
            <ul>
              {QUESTIONS[step]!.map((_, i) => (
                <li key={i} style={{ ['--i' as string]: i }}>
                  <button type="button" className="vu-ans" data-testid={`vu-a${i}`} onClick={() => { const next = [...answers, i]; setAnswers(next); setStep(step + 1); }}>
                    {w(lang, `q${step + 1}a${i}`)}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {step === QUESTIONS.length ? <Result lang={lang} type={resultOf(answers)} friend={false} onAgain={restart} /> : null}
      </main>
    </div>
  );
}
