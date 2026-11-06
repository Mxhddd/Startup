// Fonts for the website, self-hosted by Next at build time: Noto Sans Arabic for Urdu, Manrope for
// Latin and digits, and Gulzar (Nastaliq) for the big Urdu headlines only (brand moments, 26 px and up).
import { Gulzar, Manrope, Noto_Sans_Arabic } from 'next/font/google';

export const urduFont = Noto_Sans_Arabic({ subsets: ['arabic'], weight: ['500', '700'], variable: '--font-urdu' });
export const latinFont = Manrope({ subsets: ['latin'], weight: ['500', '800'], variable: '--font-latin' });
export const displayFont = Gulzar({ subsets: ['arabic'], weight: ['400'], variable: '--font-display' });
// v13: a hand-written accent for the English margin notes only (as on the brochure).
import { Caveat } from 'next/font/google';
export const handFont = Caveat({ subsets: ['latin'], weight: ['600'], variable: '--font-hand' });
