// v10 "Jharoka": groups instead of ruled lists. A Group is one soft surface (white, rounded, a warm
// three-layer shadow); its rows are separated by space, never by lines. A SectionCaption names a group
// with a small kesar star.
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useLang } from '../lang';
import { colors, elevation, radius10 } from '../theme';
import { AppText } from './AppText';
import { Icon, StarIcon, type IconName } from './icons';
import { PressableScale } from './PressableScale';
import { ChamakStrip, ornamentOn } from './TruckArt';

export function SectionCaption({ children, color }: { children: ReactNode; color?: string }) {
  const { dir } = useLang();
  return (
    <View accessibilityRole="header" style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6, marginTop: 4 }}>
      <StarIcon size={12} color={colors.kesar} />
      <AppText bold color={color ?? colors.link} style={{ fontSize: 15 }}>
        {children}
      </AppText>
    </View>
  );
}

/**
 * v21: in the parent app (ornament on) a Group is the website's card: a gilt hairline round it and a long
 * soft shadow. `foil` adds the chamak strip inside its top edge, for the one featured card on a screen.
 * In the driver app it stays plain.
 */
export function Group({ children, style, testID, foil = false }: { children: ReactNode; style?: StyleProp<ViewStyle>; testID?: string; foil?: boolean }) {
  const dressed = ornamentOn();
  return (
    <View testID={testID} style={[{ backgroundColor: colors.white, borderRadius: radius10.group, borderCurve: 'continuous', padding: 6, gap: 2, boxShadow: dressed ? `${elevation.module}, ${elevation.e1}` : elevation.e1 }, foil && dressed ? { paddingTop: 26 } : null, style]}>
      {foil && dressed ? <ChamakStrip /> : null}
      {children}
    </View>
  );
}

/** The soft square that holds a row's icon. */
export function RowIcon({ name, tint, ink }: { name: IconName; tint?: string; ink?: string }) {
  return (
    <View style={{ width: 44, height: 44, borderRadius: 16, borderCurve: 'continuous', backgroundColor: tint ?? colors.neelTint, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={22} color={ink ?? colors.link} />
    </View>
  );
}

/**
 * One row inside a Group: a leading picture (RowIcon, an avatar), a title and an optional line under
 * it, and a trailing piece (a chevron when it opens something, a Toggle, a pill...). Rows that open
 * something press like buttons.
 */
export function GroupRow({
  title,
  sub,
  lead,
  trail,
  onPress,
  testID,
  accessibilityLabel,
  tint,
}: {
  title: string;
  sub?: string | null;
  lead?: ReactNode;
  trail?: ReactNode | 'chevron';
  onPress?: () => void;
  testID?: string;
  accessibilityLabel?: string;
  tint?: string;
}) {
  const { dir } = useLang();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const t =
    trail === 'chevron' ? (
      <View style={{ transform: [{ scaleX: dir === 'rtl' ? 1 : -1 }] }}>
        <Icon name="chevron" size={20} color={colors.ink2} />
      </View>
    ) : (
      trail
    );
  const body = (
    <View style={{ flexDirection: row, alignItems: 'center', gap: 14, minHeight: 64, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius10.row, borderCurve: 'continuous', backgroundColor: tint }}>
      {lead}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText bold style={{ fontSize: 17 }}>
          {title}
        </AppText>
        {sub ? (
          <AppText variant="small" color={colors.ink2}>
            {sub}
          </AppText>
        ) : null}
      </View>
      {t}
    </View>
  );
  if (!onPress) return <View testID={testID}>{body}</View>;
  return (
    <PressableScale testID={testID} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} onPress={onPress} scaleTo="small" haptic="tap" tilt>
      {body}
    </PressableScale>
  );
}
