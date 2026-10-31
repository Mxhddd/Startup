'use client';
// Reads the token from the address bar (in the browser only) and builds the app links.
// Nothing here sends the token anywhere; the store links carry no referrer (see the page's metadata).
import { PILOT_WHATSAPP } from '@pohnch/core';
import { t } from '@pohnch/messages';
import { colors } from '@pohnch/ui/theme';
import { useEffect, useState } from 'react';

const PLAY_URL = 'https://play.google.com/store/apps/details?id=pk.pohnch.parent';

const button = (bg: string, fg: string) =>
  ({ display: 'block', textAlign: 'center', background: bg, color: fg, fontWeight: 700, fontSize: 18, padding: '16px 20px', borderRadius: 14, textDecoration: 'none' }) as const;

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
      <a data-testid="open-parent" href={`pohnch://i/${token}`} style={button(colors.neel, colors.ghee)}>
        {t('ur', 'web.invite.openParent')} · <span style={{ fontFamily: 'var(--font-latin), sans-serif' }}>{t('en', 'web.invite.openParent')}</span>
      </a>
      <a data-testid="open-driver" href={`pohnch-driver://i/${token}`} style={button(colors.white, colors.siyahi)}>
        {t('ur', 'web.invite.openDriver')} · <span style={{ fontFamily: 'var(--font-latin), sans-serif' }}>{t('en', 'web.invite.openDriver')}</span>
      </a>
      <p style={{ margin: '12px 0 0', fontWeight: 700 }}>{t('ur', 'web.invite.noApp')} · {t('en', 'web.invite.noApp')}</p>
      <a href={PLAY_URL} rel="noreferrer" style={button(colors.zamurrad, colors.white)}>{t('ur', 'web.invite.android')} · {t('en', 'web.invite.android')}</a>
      <a href={`https://wa.me/${PILOT_WHATSAPP.waNumber}`} rel="noreferrer" style={button(colors.kesarTint, colors.siyahi)}>{t('ur', 'web.invite.iphone')} · {t('en', 'web.invite.iphone')}</a>
      <p style={{ margin: '8px 0 0', fontSize: 15, color: colors.ink2 }}>{t('ur', 'web.invite.private')} · {t('en', 'web.invite.private')}</p>
    </div>
  );
}
