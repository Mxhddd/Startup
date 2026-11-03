'use client';
// Reads the token from the address bar (in the browser only) and builds the app links.
// Nothing here sends the token anywhere; the store links carry no referrer (see the page's metadata).
import { PILOT_WHATSAPP } from '@pohnch/core';
import { t } from '@pohnch/messages';
import { colors } from '@pohnch/ui/theme';
import { useEffect, useState } from 'react';

const PLAY_URL = 'https://play.google.com/store/apps/details?id=pk.pohnch.parent';

const button = (bg: string, fg: string, lip?: string) =>
  ({ display: 'block', textAlign: 'center', background: bg, color: fg, fontWeight: 700, fontSize: 18, padding: '18px 20px', borderRadius: 18, textDecoration: 'none', boxShadow: lip ? `0 4px 0 ${lip}` : `inset 0 0 0 2px ${colors.line}` }) as const;

export function InviteButtons() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const m = /^\/i\/([A-Za-z0-9_-]{43})\/?$/.exec(window.location.pathname);
    setToken(m ? (m[1] as string) : null);
  }, []);

  if (token === undefined) return null;
  if (token === null) {
    return (
      <p role="alert" style={{ background: colors.dangerBg, color: colors.dangerText, padding: 16, borderRadius: 14, margin: 0 }}>
        <span lang="ur" dir="rtl" style={{ display: 'block' }}>{t('ur', 'web.invite.bad')}</span>
        <span lang="en" style={{ display: 'block', fontFamily: 'var(--font-latin), sans-serif' }}>{t('en', 'web.invite.bad')}</span>
      </p>
    );
  }
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <a className="pohnch-btn" data-testid="open-parent" href={`pohnch://i/${token}`} style={button(colors.neel, colors.ghee, colors.neelDeep)}>
        <span lang="ur" dir="rtl" style={{ display: 'block' }}>{t('ur', 'web.invite.openParent')}</span><span lang="en" dir="ltr" style={{ display: 'block', fontFamily: 'var(--font-latin), sans-serif', fontSize: 15, opacity: 0.85 }}>{t('en', 'web.invite.openParent')}</span>
      </a>
      <a className="pohnch-btn" data-testid="open-driver" href={`pohnch-driver://i/${token}`} style={button(colors.white, colors.siyahi)}>
        <span lang="ur" dir="rtl" style={{ display: 'block' }}>{t('ur', 'web.invite.openDriver')}</span><span lang="en" dir="ltr" style={{ display: 'block', fontFamily: 'var(--font-latin), sans-serif', fontSize: 15, opacity: 0.85 }}>{t('en', 'web.invite.openDriver')}</span>
      </a>
      <p style={{ margin: '14px 0 0', fontWeight: 700, textAlign: 'center' }}>{t('ur', 'web.invite.noApp')} · {t('en', 'web.invite.noApp')}</p>
      <a className="pohnch-btn" href={PLAY_URL} rel="noreferrer" style={button(colors.zamurrad, colors.white, colors.zamurradDeep)}><span lang="ur" dir="rtl" style={{ display: 'block' }}>{t('ur', 'web.invite.android')}</span><span lang="en" dir="ltr" style={{ display: 'block', fontFamily: 'var(--font-latin), sans-serif', fontSize: 15, opacity: 0.85 }}>{t('en', 'web.invite.android')}</span></a>
      <a className="pohnch-btn" href={`https://wa.me/${PILOT_WHATSAPP.waNumber}`} rel="noreferrer" style={button(colors.kesarTint, colors.siyahi)}><span lang="ur" dir="rtl" style={{ display: 'block' }}>{t('ur', 'web.invite.iphone')}</span><span lang="en" dir="ltr" style={{ display: 'block', fontFamily: 'var(--font-latin), sans-serif', fontSize: 15, opacity: 0.85 }}>{t('en', 'web.invite.iphone')}</span></a>
      <p style={{ margin: '10px 0 0', fontSize: 15, color: colors.ink2, textAlign: 'center' }}>{t('ur', 'web.invite.private')} · {t('en', 'web.invite.private')}</p>
    </div>
  );
}
