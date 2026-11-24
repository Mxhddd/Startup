// v24: the school, picked from Pohnch's list (search by name, area, short name or initials). If it isn't
// listed the person adds it; it's theirs straight away and the team checks it. One spelling per school, so
// families and vans of the same school always match.
import { matchSchools, type SchoolRow } from '@pohnch/core';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLang } from '../lang';
import { colors, radius, space } from '../theme';
import { AppText } from './AppText';
import { Icon } from './icons';
import { PressableScale } from './PressableScale';
import { TextField } from './TextField';

export function SchoolPicker({
  schools,
  value,
  onChange,
  onAdd,
  testID = 'school-picker',
}: {
  schools: SchoolRow[];
  value: { id: string; name: string } | null;
  onChange: (s: { id: string; name: string }) => void;
  /** Adds a school that isn't listed; returns its id. */
  onAdd: (name: string) => Promise<string>;
  testID?: string;
}) {
  const { t, dir } = useLang();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(!value);
  const [busy, setBusy] = useState(false);
  const found = useMemo(() => (q.trim() ? matchSchools(q, schools, 6) : []), [q, schools]);
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const exact = found.some((s) => s.name.toLowerCase() === q.trim().toLowerCase());

  if (value && !editing) {
    return (
      <View testID={testID} style={{ flexDirection: row, alignItems: 'center', gap: space.md, minHeight: 64, paddingHorizontal: space.lg, backgroundColor: colors.inset, borderRadius: radius.card, borderCurve: 'continuous' }}>
        <Icon name="reachedSchool" size={22} color={colors.neel} />
        <View style={{ flex: 1 }}>
          <AppText variant="caption">{t('school.label')}</AppText>
          <AppText bold numberOfLines={2}>{value.name}</AppText>
        </View>
        <PressableScale onPress={() => { setEditing(true); setQ(''); }} accessibilityRole="button" accessibilityLabel={t('school.change')} testID={`${testID}-change`}>
          <View style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: space.md }}>
            <AppText bold color={colors.neel}>{t('school.change')}</AppText>
          </View>
        </PressableScale>
      </View>
    );
  }

  const choose = (s: { id: string; name: string }) => {
    onChange(s);
    setEditing(false);
    setQ('');
  };
  const add = async () => {
    const name = q.trim().replace(/\s+/g, ' ');
    if (name.length < 2 || busy) return;
    setBusy(true);
    try {
      choose({ id: await onAdd(name), name });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View testID={testID} style={{ gap: space.sm }}>
      <TextField label={t('school.search')} value={q} onChange={setQ} maxLength={80} testID={`${testID}-input`} />
      {found.length || (q.trim().length >= 2 && !exact) ? (
        <View style={{ backgroundColor: colors.white, borderRadius: radius.card, borderCurve: 'continuous', overflow: 'hidden' }}>
          {found.map((s, i) => (
            <PressableScale key={s.id} onPress={() => choose({ id: s.id, name: s.name })} accessibilityRole="button" accessibilityLabel={s.name} testID={`${testID}-result-${i}`}>
              <View style={{ flexDirection: row, alignItems: 'center', gap: space.md, minHeight: 64, paddingHorizontal: space.lg, borderTopWidth: i ? 1 : 0, borderColor: colors.inset }}>
                <Icon name="reachedSchool" size={20} color={colors.neel} />
                <View style={{ flex: 1 }}>
                  <AppText bold numberOfLines={1}>{s.name}</AppText>
                  <AppText variant="secondary" numberOfLines={1}>{[s.area, s.verified === false ? t('school.unchecked') : null].filter(Boolean).join(' · ')}</AppText>
                </View>
              </View>
            </PressableScale>
          ))}
          {q.trim().length >= 2 && !exact ? (
            <PressableScale onPress={add} accessibilityRole="button" accessibilityLabel={t('school.add', { name: q.trim() })} testID={`${testID}-add`}>
              <View style={{ flexDirection: row, alignItems: 'center', gap: space.md, minHeight: 64, paddingHorizontal: space.lg, borderTopWidth: found.length ? 1 : 0, borderColor: colors.inset }}>
                <Icon name="plus" size={20} color={colors.neel} />
                <AppText bold color={colors.neel} style={{ flex: 1 }}>{t('school.add', { name: q.trim() })}</AppText>
              </View>
            </PressableScale>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
