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
  // v8 roles that stay the same in the night palette (text on a coloured fill, the dark chip).
  onBrand: '#FAF6EE', // text and icons on neel, zamurrad, shingarf and other dark fills
  onFill: '#FFFFFF', // white marks on zamurrad and shingarf
  onKesar: '#141A33', // text on kesar
  night: '#141A33', // a dark chip or panel (offline banner, the undo bar's ground)
  link: '#1F2A5C', // neel used as text or an icon on a light surface
  // v10 "Jharoka": layered surfaces instead of boxes, buttons with depth.
  inset: '#F2ECE0', // filled fields, segmented tracks, quiet chips (no borders)
  neelHi: '#2B3A7E', // the top of a neel button face (it shades down to neel)
  zamurradHi: '#1B8066',
  kesarHi: '#F2B95C',
  shingarfHi: '#C24A33',
  neelTint2: '#D3D9EE', // the lip under a soft button; the second tone of two-tone icons
  zamurradTint2: '#BFE3D4',
  sandDeep: '#DCD3C1', // the lip under a sand button
  toggleOff: '#D9D1C1', // the track of a switch that is off
  headerTop: '#33428A', // the light corner of the arch header
  headerBottom: '#18214C', // its dark corner
};

export type ColorName = keyof typeof colors;

/** The day palette as defined above, kept so the night palette can be undone. */
export const dayColors: Readonly<Record<ColorName, string>> = { ...colors };

/**
 * v8 night palette (the parent app follows the phone; the driver app always stays in day).
 * Matches the dark theme of the Pohnch Design System. Only what changes is listed.
 */
export const nightColors: Partial<Record<ColorName, string>> = {
  ghee: '#0E1430', white: '#182044', siyahi: '#F3EEE3', ink2: '#BFC4D6', line: '#2C3766', hairline: '#232C55', sand: '#1F2750',
  neel: '#3A4C9E', neelHover: '#4357AE', neelRaised: '#4357AE', neelDeep: '#0A0F26', neelTint: '#1F2A5C',
  kesarTint: '#3A2F1A', kesarDeep: '#8C5E18', kesarText: '#F0C27A',
  zamurrad: '#197A62', zamurradTint: '#12382F', zamurradOnTint: '#9FD9C3',
  shingarf: '#C2452F', shingarfTint: '#3A1A16', dangerText: '#F2A79B', dangerBg: '#3A1A16',
  absentText: '#C9C3B8', absentBg: '#262B40', link: '#AEBBF2',
  scrim: 'rgba(0,0,0,0.55)', glass: 'rgba(24,32,68,0.72)', glassEdge: 'rgba(255,255,255,0.10)',
  neelGlow: 'rgba(0,0,0,0.35)', zamurradGlow: 'rgba(0,0,0,0.35)', kesarGlow: 'rgba(0,0,0,0.30)',
  inset: '#222B57', neelHi: '#4A5DB8', zamurradHi: '#1C836A', shingarfHi: '#C24A33', neelTint2: '#2C3766', zamurradTint2: '#1B4A3E',
  sandDeep: '#141B40', toggleOff: '#3A4470', headerTop: '#24306A', headerBottom: '#0A0F26',
};

let scheme: 'light' | 'dark' = 'light';
/** Which palette is in use now. */
export function colorScheme(): 'light' | 'dark' {
  return scheme;
}
/**
 * Switches every colour in place (components read colors.* when they draw, so the next render uses
 * the new palette). The parent app calls this before drawing and again when the phone switches.
 */
export function applyColorScheme(next: 'light' | 'dark') {
  scheme = next;
  Object.assign(colors, dayColors, next === 'dark' ? nightColors : {});
}

/**
 * v12 driver sunlight mode: for bright midday sun on the dashboard. Pure white ground, near-black
 * secondary text, deeper tints and lines, so everything reads at a glance. Same meanings and colours.
 */
export const sunColors: Partial<Record<ColorName, string>> = {
  ghee: '#FFFFFF', white: '#FFFFFF', ink2: '#262B40', line: '#8F8A7E', sand: '#E3DAC6', hairline: '#CFC7B5',
  neelTint: '#D3D9F0', zamurradTint: '#C6E6D8', kesarTint: '#F8DDAA', shingarfTint: '#F1C9BE', inset: '#E9E1D0',
};
let sun = false;
export function sunlight(): boolean {
  return sun;
}
export function applySunlight(on: boolean) {
  sun = on;
  scheme = 'light';
  Object.assign(colors, dayColors, on ? sunColors : {});
}

/** v12 big-text mode: one scale for all text (1 or 1.18), chosen in settings. */
let scale = 1;
const scaleSubs = new Set<() => void>();
export function textScale(): number {
  return scale;
}
export function setTextScale(next: number) {
  scale = next;
  scaleSubs.forEach((cb) => cb());
}
export function onTextScale(cb: () => void): () => void {
  scaleSubs.add(cb);
  return () => scaleSubs.delete(cb);
}

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

/**
 * v10 elevation: three soft layers tinted with neel (not grey), so depth reads as warm light.
 * e1: a group on the page. e2: a featured card. e3: something floating (a toast, the join card).
 */
export const elevation = {
  e1: '0px 1px 1px rgba(31,42,92,0.04), 0px 4px 10px rgba(31,42,92,0.05), 0px 14px 28px rgba(31,42,92,0.06)',
  e2: '0px 1px 2px rgba(31,42,92,0.06), 0px 8px 18px rgba(31,42,92,0.08), 0px 24px 48px rgba(31,42,92,0.10)',
  e3: '0px 2px 4px rgba(31,42,92,0.08), 0px 14px 30px rgba(31,42,92,0.14), 0px 40px 80px rgba(31,42,92,0.16)',
  /** The 1 px light along the top edge of a button face. */
  highlight: (alpha = 0.16) => `inset 0px 1px 0px rgba(255,255,255,${alpha})`,
} as const;

/** v10 radii for groups and fields (the older card/button radii stay for what still uses them). */
export const radius10 = { group: 28, field: 20, row: 20 } as const;

/**
 * v10 the jharoka arch: one pointed Mughal arch used for parent page headers, avatars and brand
 * cards. Straight sides, then two curves that bend in to a sharp point, with a tiny finial on top.
 * Returns an SVG path for a box w x h (the finial pokes 6% of the rise above y = 0).
 */
export function archPath(w: number, h: number, rise = w * 0.62, finial = true): string {
  const r = Math.min(rise, h);
  const a = w / 2;
  const n = (v: number) => Math.round(v * 10) / 10;
  const fin = finial ? ` L${n(a)} ${n(-r * 0.06)} L${n(a)} 0` : '';
  return (
    `M0 ${n(h)} L0 ${n(r)} C0 ${n(r * 0.48)} ${n(a - w * 0.2)} ${n(r * 0.2)} ${n(a)} 0${fin} ` +
    `C${n(a + w * 0.2)} ${n(r * 0.2)} ${n(w)} ${n(r * 0.48)} ${n(w)} ${n(r)} L${n(w)} ${n(h)} Z`
  );
}

/**
 * The top edge of a page that rises into its header: flat, then a pointed hump at the centre
 * (the canvas curve "Z10" scaled to any width). The box is w x h; the flat edge sits at y = rise.
 */
export function humpPath(w: number, h = 40, rise = 30): string {
  const x = (f: number) => Math.round(w * f * 10) / 10;
  const y = (f: number) => Math.round(rise * f * 10) / 10;
  return (
    `M0 ${h} L0 ${y(1)} C${x(0.154)} ${y(1)} ${x(0.308)} ${y(0.933)} ${x(0.41)} ${y(0.6)} ` +
    `C${x(0.451)} ${y(0.433)} ${x(0.482)} ${y(0.133)} ${x(0.5)} 0 ` +
    `C${x(0.518)} ${y(0.133)} ${x(0.549)} ${y(0.433)} ${x(0.59)} ${y(0.6)} ` +
    `C${x(0.692)} ${y(0.933)} ${x(0.846)} ${y(1)} ${w} ${y(1)} L${w} ${h} Z`
  );
}

/** Driver tap targets: every tap at least 64 px, the next expected tap 104 px. */
export const tap = { min: 64, next: 104 } as const;

/** No text under 14 px. Urdu UI line height about 1.6. */
export const type = {
  /** The one huge number on a screen (minutes to your door). */
  hero: 64,
  /** v8 strict scale: Display 34 (Gulzar in Urdu, brand moments only), Title 24, Headline 20, Body 17, Caption 14. */
  display: 34,
  title: 24,
  headline: 20,
  body: 17,
  caption: 14,
  minSize: 14,
  urduLineHeight: 1.6,
  /** Gulzar (Nastaliq) climbs and falls far more than Naskh: it needs the extra room. */
  nastaliqLineHeight: 1.9,
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

/**
 * v8 time-of-day map moods, all from the same brand style: a warm morning (the school run), the
 * bright day of the base palette, a cooler dusk for late afternoons, and night for dark mode.
 */
export type MapMood = 'morning' | 'day' | 'dusk' | 'night';
export type MapPalette = { [K in keyof typeof mapColors]: string } & { halo: string };
export const mapMoods: Record<MapMood, MapPalette> = {
  morning: { ...mapColors, land: '#F2E7D3', residential: '#ECE0CA', building: '#E6D8BF', parks: '#DCE8C2', water: '#CCD9E2', roadCasing: '#E0D2B8', halo: colors.ghee },
  day: { ...mapColors, halo: colors.ghee },
  dusk: { ...mapColors, land: '#E7E1D8', residential: '#E0D9CE', building: '#D8D0C3', parks: '#D3E0C6', water: '#BFCCDC', roadCasing: '#D2C9BA', road: '#FBF9F5', halo: '#F3EFE8' },
  night: {
    land: '#161C35', residential: '#1A2140', building: '#222A4D', parks: '#1C2B33', water: '#0E1430', road: '#2B3560', roadCasing: '#1F2747',
    labels: '#BFC4D6', rail: '#2A3254', boundary: '#343C60', halo: '#141A33',
  },
};

/** The map mood for a Karachi hour (0-23): morning until 10, day until 16, then dusk. */
export function mapMoodAt(hour: number): Exclude<MapMood, 'night'> {
  if (hour >= 5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 16) return 'day';
  return 'dusk';
}

/** The free, key-less base map (OpenFreeMap, built on OpenStreetMap). We recolour it with brandMapStyle. */
export const BASE_MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

/** Where the map opens before a van is joined: central Karachi. */
export const karachiRegion = {
  latitude: 24.8607,
  longitude: 67.0011,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
} as const;

/**
 * v12: a child's own colours, by their place in the family (kesar, zamurrad, neel, then round again).
 * The same child keeps the same colour everywhere: menu niches, family view, map pins and the story.
 */
export function childColors(index: number): { fill: string; ink: string; tint: string; text: string } {
  const all = [
    { fill: colors.kesar, ink: colors.onKesar, tint: colors.kesarTint, text: colors.onKesar },
    { fill: colors.zamurrad, ink: colors.onFill, tint: colors.zamurradTint, text: colors.zamurradOnTint },
    { fill: colors.neel, ink: colors.onBrand, tint: colors.neelTint, text: colors.link },
  ];
  return all[((index % all.length) + all.length) % all.length]!;
}

/**
 * v13 "Parat" (layers): three materials and one light. The light comes from the top left, so every
 * shadow falls down and a little to the right. Values are CSS strings, shared by the website and the
 * apps (the apps read the colours and turn the shadows into their own boxShadow).
 */
export const materials = {
  /** Matte paper: cards, groups, the page ground in front of the street. */
  paper: { fill: '#FFFDF9', rim: 'inset 0 1px 0 #FFFFFF' },
  /** Frosted glass over the map and the street. */
  glass: { fill: 'rgba(255,253,249,0.78)', blur: 22, rim: 'inset 0 1px 0 #FFFFFF, inset 0 0 0 1px rgba(255,255,255,0.55)' },
  /** Deep lacquer: driver headers, the drivers band, the footer. Text on it is ghee or mutedOnDark. */
  lacquer: { top: '#3A4A96', mid: '#1F2A5C', bottom: '#111840', gloss: 'rgba(255,255,255,0.22)' },
  /** A surface pressed into the page (filled fields, done steps). */
  pressed: { fill: '#F1EADD', shadow: 'inset 0 2px 4px rgba(31,42,92,0.14), inset 0 -1px 0 rgba(255,255,255,0.8)' },
} as const;

/** Elevations 1-3, all with the same light. */
export const lift = {
  1: '0 1px 2px rgba(31,42,92,0.08), 0 3px 8px -4px rgba(31,42,92,0.14)',
  2: '0 1px 2px rgba(31,42,92,0.07), 0 6px 14px -6px rgba(31,42,92,0.16), 0 22px 36px -20px rgba(31,42,92,0.22)',
  3: '0 2px 4px rgba(31,42,92,0.08), 0 14px 24px -10px rgba(31,42,92,0.22), 0 40px 60px -30px rgba(31,42,92,0.30)',
} as const;

/** The paper-cut Karachi street, tinted by the time of day: sky, far roofs, mid street, near plane. */
export type StreetTime = 'morning' | 'noon' | 'evening' | 'night';
export const streetColors: Record<StreetTime, { sky1: string; sky2: string; sun: string; far: string; mid: string; near: string; edge: string; haze: string }> = {
  morning: { sky1: '#8FA9D6', sky2: '#F6D7AE', sun: '#FFE2A8', far: '#C9B7C4', mid: '#9A86A0', near: '#2B3A7E', edge: '#4A5AA8', haze: 'rgba(246,215,174,0.55)' },
  noon: { sky1: '#7FA6D8', sky2: '#DCE8F2', sun: '#FFF4D6', far: '#B9C4D6', mid: '#7F8FB0', near: '#24316A', edge: '#3D4E9A', haze: 'rgba(220,232,242,0.55)' },
  evening: { sky1: '#5A5E9E', sky2: '#F2A976', sun: '#FFC98A', far: '#B98D9A', mid: '#7A5F86', near: '#1F2550', edge: '#3B3F80', haze: 'rgba(242,169,118,0.45)' },
  night: { sky1: '#0B1030', sky2: '#26306A', sun: '#F4E9C8', far: '#2A3366', mid: '#1B2250', near: '#0D1233', edge: '#2B3A7E', haze: 'rgba(38,48,106,0.5)' },
};
