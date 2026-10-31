// The one theme file. Every colour, size and font name the apps use comes from here (design/BRAND.md).

export const colors = {
  ghee: '#FAF6EE', // ground, every screen background
  white: '#FFFFFF', // cards and rows
  siyahi: '#141A33', // text, lock screen, dark panels
  ink2: '#4A4F66', // secondary text
  line: '#E2DCCD', // borders only
  neel: '#1F2A5C', // brand, primary buttons, step "left"
  neelHover: '#2B3A80',
  neelTint: '#E6E9F5',
  kesar: '#E8A33D', // the star, "reached school"; text on it is siyahi
  kesarTint: '#FBEBCF',
  shingarf: '#A8321F', // help, "van is late", strikes only
  shingarfTint: '#F6DDD6',
  zamurrad: '#17705A', // "picked", "dropped", success
  zamurradTint: '#DCEFE7',
  zamurradOnTint: '#0B4A3D',
  pista: '#A7D47E', // decoration only
  absentText: '#5E5A52',
  absentBg: '#EEE9DF',
  dangerText: '#9E2A1F',
  dangerBg: '#F9E3DF',
} as const;

export type Step = 'left' | 'picked' | 'reachedSchool' | 'leftSchool' | 'dropped';

/** One colour per meaning: the fill and text colour for each trip step. */
export const stepColors: Record<Step, { fill: string; text: string }> = {
  left: { fill: colors.neel, text: colors.ghee },
  picked: { fill: colors.zamurrad, text: colors.white },
  reachedSchool: { fill: colors.kesar, text: colors.siyahi },
  leftSchool: { fill: colors.neel, text: colors.ghee },
  dropped: { fill: colors.zamurrad, text: colors.white },
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { card: 16, button: 14, sheet: 24, pill: 999 } as const;

/** Driver tap targets: every tap at least 64 px, the next expected tap 104 px. */
export const tap = { min: 64, next: 104 } as const;

/** No text under 14 px. Urdu UI line height about 1.6. */
export const type = {
  minSize: 14,
  body: 16,
  title: 22,
  display: 30,
  urduLineHeight: 1.6,
  latinLineHeight: 1.35,
} as const;

/**
 * Font family names as loaded by @expo-google-fonts in the apps (and next/font on the web).
 * Noto Sans Arabic for Urdu UI, Manrope for Latin and every digit, Gulzar for display only (>= 26 px).
 */
export const fonts = {
  urdu: { regular: 'NotoSansArabic_500Medium', bold: 'NotoSansArabic_700Bold' },
  latin: { regular: 'Manrope_500Medium', bold: 'Manrope_800ExtraBold' },
  display: 'Gulzar_400Regular',
} as const;

export const mapColors = {
  land: '#EFE9DC',
  parks: '#DDEBCB',
  water: '#CFDCE8',
  road: '#FFFFFF',
  roadCasing: '#DDD4C2',
  labels: colors.ink2,
} as const;

export type MapStyleRule = { featureType?: string; elementType?: string; stylers: Array<Record<string, string>> };

/** Google Maps style for react-native-maps (customMapStyle): warm land, few labels, no shops or transit. */
export const googleMapStyle: MapStyleRule[] = [
  { elementType: 'geometry', stylers: [{ color: mapColors.land }] },
  { elementType: 'labels.text.fill', stylers: [{ color: mapColors.labels }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: colors.ghee }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: mapColors.parks }] },
  { featureType: 'poi.park', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school', stylers: [{ visibility: 'on' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: mapColors.road }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: mapColors.roadCasing }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: mapColors.water }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
];

/** Where the map opens before a van is joined: central Karachi. */
export const karachiRegion = {
  latitude: 24.8607,
  longitude: 67.0011,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
} as const;
