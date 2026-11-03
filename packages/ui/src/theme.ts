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
  kesarText: '#7A5410', // kesar-family text on white, ghee or kesarTint (v8: "No van tomorrow")
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
  // From the v5 screens: quiet surfaces and the darker "lip" under the big buttons.
  sand: '#F3EEE3', // secondary action tiles
  hairline: '#F0EBE0', // dividers inside a white card
  neelDeep: '#0E1430', // the lip under a neel button
  zamurradDeep: '#0B4A3D', // the lip under a zamurrad button
  kesarDeep: '#B9802A', // the lip under a kesar button
  shingarfDeep: '#7A1E14', // the lip under a red button; also help text on shingarfTint
  mutedOnDark: '#BFC4D6', // secondary text on siyahi or neel
  gold: '#C9A24A', // the thin ring round the driver's initial
  scrim: 'rgba(20,26,51,0.45)', // behind a sheet that opens over the screen
  // v6: depth and glass
  neelRaised: '#24316A', // the top of the neel header's gentle light
  neelGlow: 'rgba(31,42,92,0.32)', // the soft coloured shadow under a neel button
  zamurradGlow: 'rgba(23,112,90,0.30)',
  kesarGlow: 'rgba(185,128,42,0.30)',
  glass: 'rgba(255,255,255,0.72)', // frosted chips over the map
  glassEdge: 'rgba(255,255,255,0.75)',
  glassDark: 'rgba(250,246,238,0.12)', // a frosted pill on neel
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

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, gutter: 20 } as const;

export const radius = { card: 22, button: 18, tile: 22, big: 28, sheet: 32, pill: 999 } as const;

/**
 * Elevation, as CSS box-shadow strings (React Native 0.76+ and the web both read them).
 * float: chips over the map. sheet: the bottom sheet. card: a white card on ghee.
 * lip(): the solid edge under a big button, which the press pushes down into.
 */
export const shadow = {
  float: '0px 6px 20px rgba(20,26,51,0.12)',
  sheet: '0px -1px 0px rgba(20,26,51,0.04), 0px -16px 48px rgba(20,26,51,0.14)',
  card: '0px 1px 2px rgba(20,26,51,0.05), 0px 10px 30px rgba(20,26,51,0.06)',
  /** A raised panel that sits over other content (the map card, the trip header). */
  raised: '0px 1px 2px rgba(20,26,51,0.06), 0px 16px 40px rgba(20,26,51,0.16)',
  lip: (color: string, depth = 5) => `0px ${depth}px 0px ${color}`,
  /** The coloured bloom under a big button (its own colour, soft). */
  glow: (color: string) => `0px 18px 36px ${color}`,
} as const;

/** Driver tap targets: every tap at least 64 px, the next expected tap 104 px. */
export const tap = { min: 64, next: 104 } as const;

/** No text under 14 px. Urdu UI line height about 1.6. */
export const type = {
  /** The one huge number on a screen (minutes to your door). */
  hero: 64,
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
  residential: '#E9E2D2',
  building: '#E3DBCA',
  rail: '#D6CDBB',
  boundary: '#C9C0AE',
} as const;

/** The free, key-less base map (OpenFreeMap, built on OpenStreetMap). We recolour it with brandMapStyle. */
export const BASE_MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

/** Where the map opens before a van is joined: central Karachi. */
export const karachiRegion = {
  latitude: 24.8607,
  longitude: 67.0011,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
} as const;
