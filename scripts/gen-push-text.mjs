// Copies the words the server needs for push notifications from packages/messages into the Edge
// Function (which is deployed on its own and can't read the apps' packages).
// Run after changing any of these keys: node scripts/gen-push-text.mjs   (a test checks they match)
import { readFileSync, writeFileSync } from 'node:fs';

export const PUSH_KEYS = [
  'app.parent.name', 'step.left', 'step.picked', 'step.reachedSchool', 'step.leftSchool', 'step.dropped',
  'eta.door', 'parent.late', 'help.reason.traffic', 'help.reason.breakdown', 'help.reason.roadClosed', 'timeline.by',
  // The iPhone Live Activity card, filled by the server while the phone is locked (v7).
  'parent.place.coming', 'parent.place.inVan', 'parent.place.atSchool', 'parent.place.home', 'eta.unit.home',
  'moment.left', 'moment.picked', 'moment.arriving', 'moment.reached_school', 'moment.left_school', 'moment.dropped', 'moment.late',
];

export function pushText() {
  const out = {};
  for (const lang of ['ur', 'en']) {
    const all = JSON.parse(readFileSync(new URL(`../packages/messages/src/${lang}.json`, import.meta.url), 'utf8'));
    out[lang] = Object.fromEntries(PUSH_KEYS.map((k) => [k, all[k]]));
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(new URL('../supabase/functions/_shared/pushText.json', import.meta.url), JSON.stringify(pushText(), null, 2) + '\n');
  console.log('wrote supabase/functions/_shared/pushText.json');
}
