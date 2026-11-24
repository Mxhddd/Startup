// v24: putting a pin on a place without hunting on the map. Type the area or street and pick a result,
// or tap an area chip; the map flies there. Then tap your own gate on the map to place the pin exactly.
// Typing only: the phone's location is never read. Used for a child's home, stops and school drop-offs.
import { AREA_CENTRES } from '@pohnch/core';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLang } from '../lang';
import { colors, radius, space } from '../theme';
import { AppText } from './AppText';
import { ChoiceChip } from './ChoiceChip';
import { Icon } from './icons';
import { PohnchMap, type MapPin } from './PohnchMap';
import { PressableScale } from './PressableScale';
import { TextField } from './TextField';

export type PlaceResult = { id: string; name: string; detail: string; lat: number; lng: number };
type Pt = { lat: number; lng: number };

export function PlacePicker({
  pin,
  onPin,
  pinKind = 'home',
  search,
  otherPins = [],
  mapHeight = 300,
  testID,
}: {
  pin: Pt | null;
  onPin: (p: Pt) => void;
  pinKind?: 'home' | 'school' | 'stop';
  /** Address search (packages/client places.searchPlaces); left out, only the map and areas show. */
  search?: (q: string, signal: AbortSignal) => Promise<PlaceResult[]>;
  /** Pins already on the map for context (a van's other stops). */
  otherPins?: MapPin[];
  mapHeight?: number;
  testID?: string;
}) {
  const { t, dir } = useLang();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [state, setState] = useState<'idle' | 'busy' | 'none' | 'offline'>('idle');
  const [focus, setFocus] = useState<{ lat: number; lng: number; zoom?: number; key: number } | null>(null);
  const key = useRef(0);

  useEffect(() => {
    if (!search || q.trim().length < 3) {
      setResults([]);
      setState('idle');
      return;
    }
    const ctl = new AbortController();
    setState('busy');
    const id = setTimeout(() => {
      search(q, ctl.signal)
        .then((r) => {
          setResults(r.slice(0, 5));
          setState(r.length ? 'idle' : 'none');
        })
        .catch((e: unknown) => {
          if ((e as { name?: string }).name !== 'AbortError') setState('offline');
        });
    }, 300);
    return () => {
      clearTimeout(id);
      ctl.abort();
    };
  }, [q, search]);

  const go = (p: Pt, zoom?: number) => setFocus({ ...p, zoom, key: ++key.current });
  const pick = (r: PlaceResult) => {
    go(r, 17);
    onPin({ lat: r.lat, lng: r.lng });
    setResults([]);
    setQ(r.name);
  };

  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  return (
    <View testID={testID} style={{ gap: space.md }}>
      {search ? <TextField label={t('place.search')} value={q} onChange={setQ} maxLength={80} testID={testID ? `${testID}-search` : undefined} /> : null}
      {state === 'busy' ? <AppText variant="secondary">{t('place.searching')}</AppText> : null}
      {state === 'none' ? <AppText variant="secondary">{t('place.none')}</AppText> : null}
      {state === 'offline' ? <AppText variant="secondary">{t('place.offline')}</AppText> : null}
      {results.length ? (
        <View style={{ backgroundColor: colors.white, borderRadius: radius.card, borderCurve: 'continuous', overflow: 'hidden' }}>
          {results.map((r, i) => (
            <PressableScale key={r.id} onPress={() => pick(r)} accessibilityRole="button" accessibilityLabel={`${r.name}, ${r.detail}`} testID={`place-result-${i}`}>
              <View style={{ flexDirection: row, alignItems: 'center', gap: space.md, minHeight: 64, paddingHorizontal: space.lg, borderTopWidth: i ? 1 : 0, borderColor: colors.inset }}>
                <Icon name="pin" size={20} color={colors.neel} />
                <View style={{ flex: 1 }}>
                  <AppText bold numberOfLines={1}>{r.name}</AppText>
                  {r.detail ? <AppText variant="secondary" numberOfLines={1}>{r.detail}</AppText> : null}
                </View>
              </View>
            </PressableScale>
          ))}
        </View>
      ) : null}
      <View style={{ gap: space.sm }}>
        <AppText variant="caption" bold>{t('place.areas')}</AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, flexDirection: row }}>
          {(Object.keys(AREA_CENTRES) as (keyof typeof AREA_CENTRES)[]).map((a) => (
            <ChoiceChip key={a} label={t(`area.${a}` as never)} on={false} onPress={() => go(AREA_CENTRES[a], 15)} testID={`area-${a}`} />
          ))}
        </ScrollView>
      </View>
      <View style={{ height: mapHeight, borderRadius: radius.card, borderCurve: 'continuous', overflow: 'hidden' }}>
        <PohnchMap
          accessibilityLabel={t('place.hint')}
          pins={[...otherPins, ...(pin ? [{ id: 'picked', kind: pinKind, lat: pin.lat, lng: pin.lng } as MapPin] : [])]}
          onPress={onPin}
          focus={focus}
          style={{ flex: 1 }}
          testID={testID ? `${testID}-map` : undefined}
        />
      </View>
      <AppText variant="secondary">{pin ? t('place.pinSet') : t('place.hint')}</AppText>
    </View>
  );
}
