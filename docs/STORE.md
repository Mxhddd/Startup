# Store listings

Texts for Google Play and the App Store, in Urdu and English. Screenshots: take them from the real apps on a phone (the canvas page "v5 · Map-first app" shows which screens), 1080 × 1920, Urdu first.

## Pohnch (parents) · `pk.pohnch.parent`

**Name:** پہنچ: اسکول وین · Pohnch: School van

**Short description (80 characters)**
- اردو: بچے کی اسکول وین نقشے پر دیکھیں۔ بیٹھے تو خبر، پہنچے تو خبر۔
- English: See your child's school van on a map. An alert when they get in and arrive.

**Full description**

اردو:
پہنچ سے آپ اپنے بچے کی اسکول وین فون پر نقشے پر چلتی دیکھ سکتے ہیں۔
• وین کب نکلی، بچہ کب بیٹھا، اسکول کب پہنچا، گھر کب اترا: ہر قدم کی خبر، ڈرائیور کے نام کے ساتھ۔
• آپ کے دروازے تک کتنے منٹ۔
• «آج چھٹی»: ایک ٹیپ میں ڈرائیور کو بتائیں۔
• گھر کے 3 اور لوگ بھی وہی خبریں دیکھ سکتے ہیں۔
حفاظت: صرف آپ کا بچہ اور آپ کی وین۔ وین کی لوکیشن صرف سفر کے دوران، اور 30 دن بعد مٹ جاتی ہے۔ ہم آپ کے فون کی لوکیشن نہیں لیتے، اور بچے کا صرف پہلا نام رکھتے ہیں۔

English:
Pohnch shows your child's school van moving on a map.
• Every step, with who marked it: the van left, your child got in, reached school, dropped home.
• Minutes to your door.
• "Off today" in one tap, so the driver knows.
• Up to 3 family members see the same alerts.
Privacy: only your child and your van. The van's location is shared only during trips and deleted after 30 days. We never read your phone's location, and keep only your child's first name.

**Category:** Parenting (Play) / Education or Lifestyle (App Store). **Content rating:** everyone. **Contact:** WhatsApp 0300 1478729. **Privacy policy:** https://pohnch.pk/privacy

**Data safety (Play):** collects phone number (account), name (app functionality), approximate home location placed by the user (app functionality); not shared with third parties; encrypted in transit; users can delete their account and data inside the app (parents: Menu > Delete my account; drivers: Help and account). Does not collect the device's location.

## Pohnch Driver · `pk.pohnch.driver`

**Name:** پہنچ ڈرائیور · Pohnch Driver

**Short description**
- اردو: وین ڈرائیورز کے لیے مفت۔ ایک بٹن، کم فون کالز۔
- English: Free for school van drivers. One button, fewer phone calls.

**Full description**

اردو:
پہنچ ڈرائیور اسکول وین ڈرائیورز کے لیے مفت ایپ ہے۔ سفر شروع کریں، ہر اسٹاپ پر ایک بڑا بٹن دبائیں، اور والدین کو خود خبر ہو جاتی ہے۔ کم کالز، کم پیغامات۔
• اسٹاپ ترتیب سے، بہن بھائی ایک ٹیپ میں، 5 سیکنڈ میں واپس۔
• سگنل نہ ہو تو بٹن فون میں محفوظ، سگنل آتے ہی چلے جاتے ہیں۔
• مدد کا بٹن: دیر کی وجہ سب خاندانوں کو، اور 15 اور 1122 ایک ٹیپ پر۔
• لوکیشن صرف سفر کے دوران۔

English:
Pohnch Driver is a free app for school van drivers. Start the trip, tap one big button at each stop, and the parents know. Fewer calls, fewer messages.
• Stops in order, siblings in one tap, 5 seconds to undo.
• No signal? Taps are saved on the phone and sent when it's back.
• Help: tell every family why you're late, and call 15 or 1122 in one tap.
• Location only during a trip.

### Background location (Google Play declaration and App Store review notes)

**Feature that needs it:** "Live van position for families during a trip." The driver starts a trip; while it runs, the app sends the van's position every 5-30 seconds so the van's approved families see it on a map, including when the driver's screen is off. Location stops when the driver taps End trip (or the trip ends automatically). No location is collected outside a trip, and positions are deleted after 30 days.

**In-app disclosure:** shown before the first trip, before the system permission prompt (`apps/driver/src/components/LocationDisclosure.tsx`): "Pohnch Driver collects the van's location during a trip so that the van's families can see it on a map, even when the app is closed or not in use. Location is collected only from Start trip until End trip, never at other times, and is deleted after 30 days."

**Android:** foreground service of type location with a visible notification "Pohnch · trip running" for the whole trip.

### Reviewer demo video (about 60 seconds, for the Play declaration and App Store review)

1. Open Pohnch Driver, log in with the demo driver (0300 0000001, code 123456).
2. Today > hold "Start the morning trip". Show the disclosure, tap Continue, allow location "while using" and then "all the time".
3. Show the notification "Pohnch · trip running" in the shade.
4. Tap a stop, show the undo bar; lock the screen for 10 seconds, unlock.
5. Hold "Reached school": the notification disappears, location stops.
6. Open Pohnch on a second phone (demo parent 0300 0000002) and show the van on the map and the timeline.

**Reviewer login (App Store "Sign-in information"):** driver 0300 0000001 / 123456, parent 0300 0000002 / 123456. Before submitting, set up a review van with them through the real screens (see docs/PILOT.md), so reviewers see a van with stops and a child.
