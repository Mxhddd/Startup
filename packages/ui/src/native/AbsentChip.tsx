// "آج چھٹی": a child who is off today. On the parent side it can be tapped to undo until the van leaves.
import { Pressable, View } from 'react-native';
import { useLang } from '../lang';
import { colors, radius } from '../theme';
import { AppText } from './AppText';

export function AbsentChip({ onUndo }: { onUndo?: () => void }) {
  const { t, dir } = useLang();
  const body = (
    <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, backgroundColor: colors.absentBg, borderRadius: radius.pill, paddingHorizontal: 14, minHeight: 32, alignSelf: dir === 'rtl' ? 'flex-end' : 'flex-start' }}>
      <AppText variant="small" bold color={colors.absentText}>
        {t('chutti.label')}
      </AppText>
      {onUndo ? (
        <AppText variant="small" bold color={colors.neel}>
          {t('undo.action')}
        </AppText>
      ) : null}
    </View>
  );
  if (!onUndo) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${t('chutti.label')} · ${t('undo.action')}`} onPress={onUndo} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center', alignSelf: dir === 'rtl' ? 'flex-end' : 'flex-start' }}>
      {body}
    </Pressable>
  );
}
