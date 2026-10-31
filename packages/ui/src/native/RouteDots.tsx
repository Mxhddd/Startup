// Progress as the logo draws it: a row of dots from start to arrival. Done stops neel, the van's place
// a kesar star, the rest small and light. Runs right to left in Urdu.
import { View } from 'react-native';
import { useLang } from '../lang';
import { colors } from '../theme';
import { StarIcon } from './icons';

export function RouteDots({ total, done, tone = 'light' }: { total: number; done: number; tone?: 'light' | 'dark' }) {
  const { dir } = useLang();
  const upcoming = tone === 'dark' ? 'rgba(250,246,238,0.35)' : colors.line;
  const passed = tone === 'dark' ? colors.ghee : colors.neel;
  const items = Array.from({ length: total }, (_, i) => i);
  return (
    <View
      testID="route-dots"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: done }}
      style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 24 }}
    >
      {items.map((i) => {
        if (i === done && done < total) return <StarIcon key={i} size={22} color={colors.kesar} />;
        const size = 6 + Math.round((i / Math.max(1, total - 1)) * 6); // dots grow towards arrival
        return <View key={i} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: i < done ? passed : upcoming }} />;
      })}
    </View>
  );
}
