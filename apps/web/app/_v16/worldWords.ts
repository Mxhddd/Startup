// The words the 3D city paints on itself (rooftop boards, the van's plate and back panel, shop signs).
// They live in packages/messages like every other word; the boards always show Urdu with English
// underneath, and the shop signs are in Urdu, as on Karachi's streets.
import { t, type MessageKey } from '@pohnch/messages';
import type { WorldWords } from './world3d';

export const LINE_COUNT = 5, SHOP_COUNT = 12;
export function worldWords(): WorldWords {
  return {
    lines: Array.from({ length: LINE_COUNT }, (_, i) => ({ ur: t('ur', `web.line.${i + 1}` as MessageKey), en: t('en', `web.line.${i + 1}` as MessageKey) })),
    shops: Array.from({ length: SHOP_COUNT }, (_, i) => t('ur', `web.shop.${i + 1}` as MessageKey)),
    plateEn: t('en', 'web.van.plate'),
    plateUr: t('ur', 'web.van.plate'),
  };
}
