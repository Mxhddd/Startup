'use client';
// Cloudflare Turnstile, the "are you human" check (v20 security). Usually invisible: Cloudflare decides in
// the background and only shows a box when it is unsure. It hands back a short-lived token that the server
// checks with Cloudflare before saving a sign-up or sending a login code. Without a site key (local builds,
// tests) it renders nothing and the server, which then has no secret either, skips the check.
import { useEffect, useRef } from 'react';

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global { interface Window { turnstile?: TurnstileApi; __pohnchTurnstile?: Promise<void> } }

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  window.__pohnchTurnstile ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT; s.async = true; s.defer = true;
    s.onload = () => resolve(); s.onerror = () => reject(new Error('turnstile'));
    document.head.appendChild(s);
  });
  return window.__pohnchTurnstile;
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

/** Renders the check and reports its token ('' when it expires or fails). Change `round` to ask again
 *  (each token can be used once). */
export function Turnstile({ siteKey = TURNSTILE_SITE_KEY, onToken, lang, round = 0 }: { siteKey?: string; onToken: (token: string) => void; lang: 'ur' | 'en'; round?: number }) {
  const box = useRef<HTMLDivElement>(null), id = useRef<string | null>(null), cb = useRef(onToken);
  cb.current = onToken;
  useEffect(() => {
    if (!siteKey) return;
    let gone = false;
    loadTurnstile().then(() => {
      if (gone || !box.current || !window.turnstile) return;
      id.current = window.turnstile.render(box.current, {
        sitekey: siteKey, appearance: 'interaction-only', theme: 'auto', language: lang,
        callback: (t: string) => cb.current(t), 'expired-callback': () => cb.current(''), 'error-callback': () => cb.current(''),
      });
    }).catch(() => cb.current(''));
    return () => { gone = true; if (id.current && window.turnstile) window.turnstile.remove(id.current); id.current = null; };
  }, [siteKey, lang]);
  useEffect(() => { if (round > 0 && id.current && window.turnstile) { cb.current(''); window.turnstile.reset(id.current); } }, [round]);
  return siteKey ? <div ref={box} className="turnstile" /> : null;
}
