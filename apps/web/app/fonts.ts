// Fonts for the website, self-hosted by Next at build time: Noto Sans Arabic for Urdu, Manrope for Latin and digits.
import { Manrope, Noto_Sans_Arabic } from 'next/font/google';

export const urduFont = Noto_Sans_Arabic({ subsets: ['arabic'], weight: ['500', '700'], variable: '--font-urdu' });
export const latinFont = Manrope({ subsets: ['latin'], weight: ['500', '800'], variable: '--font-latin' });
