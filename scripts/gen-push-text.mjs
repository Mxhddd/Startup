// Copies the words the server needs for push notifications from packages/messages into the Edge
// Function (which is deployed on its own and can't read the apps' packages).
// Run after changing any of these keys: node scripts/gen-push-text.mjs   (a test checks they match)
import { readFileSync, writeFileSync } from 'node:fs';

export const PUSH_KEYS = [
  'app.parent.name', 'step.left', 'step.picked', 'step.reachedSchool', 'step.leftSchool', 'step.dropped',
  'eta.door', 'parent.late', 'help.reason.traffic', 'help.reason.breakdown', 'help.reason.roadClosed', 'timeline.by',
  // The iPhone Live Activity card, filled by the server while the phone is locked (v7).
  'parent.place.coming', 'parent.place.inVan', 'parent.place.atSchool', 'parent.place.home', 'eta.unit.home',
  'min.short', 'moment.left', 'moment.picked', 'moment.arriving', 'moment.reached_school', 'moment.left_school', 'moment.dropped', 'moment.late',
  // The driver's whole-van day off (v8).
  'live.marks.morning', 'live.marks.afternoon',
  // v9: name-first alert titles, short bodies.
  'push.title.left', 'push.title.picked', 'push.title.arriving', 'push.title.reached_school', 'push.title.left_school', 'push.title.dropped', 'push.title.late',
  'push.body.by', 'push.body.arriving',
  'push.driver.request.title', 'push.driver.request.body', 'push.driver.verified.title', 'push.driver.verified.body',
  'push.when.today', 'push.when.tomorrow', 'push.when.date', 'push.dayOff.title', 'push.dayOff.body', 'push.dayOn.title', 'push.dayOn.body',
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
