'use client';
// The interactive parts of the inner pages (v16): on the drivers page, the hold-to-tap and
// no-signal demos, and the join form with "A van driver" already chosen.
import { useState } from 'react';
import { AREA_IDS, AREA_SPOTS, PILOT_WHATSAPP, type AreaId } from '@pohnch/core';
import { t, type Lang, type MessageKey } from '@pohnch/messages';
import { HoldDemo, SignalDemo } from './Demos';
import { JoinForm } from './Panel';
import type { Words } from './Phone';

export function DriverIslands({ lang, w, part }: { lang: Lang; w: Words; part: 'demos' | 'join' }) {
  const [role, setRole] = useState<'parent' | 'driver'>('driver');
  const [, setMine] = useState<AreaId | null>(null);
  if (part === 'demos') return <div className="demos2"><HoldDemo w={w} /><SignalDemo w={w} /></div>;
  const areas = AREA_IDS.map((id) => ({ id, label: t(lang, `area.${id}` as MessageKey), spot: id === 'other' ? null : AREA_SPOTS[id] }));
  return <JoinForm w={w} lang={lang} areas={areas} role={role} setRole={setRole} onJoined={setMine} wa={`https://wa.me/${PILOT_WHATSAPP.waNumber}`} />;
}
