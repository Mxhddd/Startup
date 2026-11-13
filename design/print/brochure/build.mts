// The Pohnch Z-fold brochure (v21): A4 landscape, 3 panels of 99 mm per side. Nothing crosses a fold;
// each panel is laid out on its own centre line. Cover on the right (Urdu reads right to left).
//   Side A (outside, left -> right): [What you see] [How it works] [Cover]
//   Side B (inside,  left -> right): [For drivers]  [Safety]       [QR]
// Print: A4, double-sided, flip on the SHORT edge, accordion (Z) fold with the cover on top.
// Run from apps/web:  npx tsx ../../design/print/brochure/build.mts <outDir>
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { chamakTile, jhalarTile, parrot, roseSvg, svgUri, vineTile } from '../../../packages/ui/src/truckart.ts';
const require = createRequire(new URL('../../../apps/web/package.json', import.meta.url));
const qrcode = require('qrcode-generator');
const { chromium } = require('playwright');
const out = process.argv[2] ?? '.';

const markUrdu = readFileSync(new URL('../../../apps/web/public/pohnch-mark-urdu.svg', import.meta.url), 'utf8');
const markLight = markUrdu.replace(/#1F2A5C/g, '#FBF7EF');
const q = qrcode(0, 'H'); q.addData('https://pohnch.pk/app'); q.make();
const QR = q.createSvgTag({ cellSize: 10, margin: 0, scalable: true });
const ROSE = `data:image/svg+xml,${encodeURIComponent(roseSvg(80))}`;
const STAR = (s: number, c = '#E8A33D') => `<svg width="${s}" height="${s}" viewBox="-1 -1 2 2"><path d="${Array.from({ length: 16 }, (_, k) => { const a = (k / 16) * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 0.42 : 1; return `${k ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(3)} ${(Math.sin(a) * r).toFixed(3)}`; }).join('')}Z" fill="${c}"/></svg>`;
const ICON: Record<string, string> = {
  van: '<path d="M3 16V8a2 2 0 0 1 2-2h9l5 4v6M3 16h18M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  school: '<path d="M3 10l9-5 9 5-9 5-9-5zM7 12v5c0 1 2.2 2.5 5 2.5s5-1.5 5-2.5v-5"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  name: '<path d="M4 20c0-4 3.6-6 8-6s8 2 8 6M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  tap: '<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-2.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4c0 3.5-2.5 6.5-6 6.5S7 18 6 15l-1.5-3a1.5 1.5 0 0 1 2.6-1.4L9 13"/>',
  free: '<path d="M20 12l-8 8-8-8V4h8z"/><circle cx="8" cy="8" r="1.3"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
};
const ic = (n: string, c = '#1F2A5C') => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;

// v2 (less templated): no icons in boxes. Steps are stops on a painted route, one colour per meaning;
// promises are a typeset list with a kesar star and gilt rules, like a printed card, not an app screen.
const stop = (n: number, fill: string, ink: string, ur: string, en: string) => `<li><div><b class="ur">${ur}</b><small>${en}</small></div><span class="dot" style="background:${fill};color:${ink}">${n}</span></li>`;
const vow = (ur: string, en: string) => `<li><div><b class="ur">${ur}</b><small>${en}</small></div><span class="vstar">${STAR(11)}</span></li>`;
const BIRD = (flip: boolean) => `<svg class="bird" viewBox="-70 -86 115 146" aria-hidden="true">${parrot(0, 0, 100, flip)}</svg>`;
const ORN = `<span class="orn" aria-hidden="true"><i></i>${STAR(9)}<i></i></span>`;

const phoneParent = `<div class="phone"><div class="scr lock">
  <div class="time">7:12</div>
  <div class="note"><div class="nh">${STAR(9)} POHNCH · ابھی</div><b class="ur">علی وین میں بیٹھ گیا</b><span>Ali got in the van · 7:09</span></div>
  <div class="note dim"><div class="nh">${STAR(9)} POHNCH · 7:05</div><b class="ur">وین نکل گئی، 4 منٹ میں آپ کے دروازے پر</b><span>The van left · at your door in 4 min</span></div>
  <div class="live"><div class="lr"><span class="m">8</span><span class="ur t">منٹ میں اسکول</span></div><div class="bar"><i></i></div></div>
</div></div>`;
const phoneDriver = `<div class="phone short"><div class="scr drv">
  <div class="dh"><b class="ur">صبح کا سفر</b><span class="ur">12 بچے</span></div>
  <div class="dr done"><i></i><b class="ur">وین نکل گئی</b><em>7:05</em></div>
  <div class="dr done"><i></i><b class="ur">حمزہ، عائشہ</b><em>7:09</em></div>
  <div class="dbig">${ic('check', '#FFFFFF')}<b class="ur">علی بیٹھ گیا</b></div>
  <div class="dr"><i class="o"></i><b class="ur">بلال</b><em class="ur">اگلا</em></div>
</div></div>`;

const panel = (cls: string, inner: string) => `<section class="panel ${cls}"><div class="band top"></div><div class="body">${inner}</div><div class="band bot"></div></section>`;

// v3 (tells the idea): the cover asks the question every parent asks ("Where's the van?"), the outside
// spread answers it with one real morning (times, one colour per step) and the phone that shows it; inside,
// before and after, our promise, and the QR code.
const moment = (time: string, fill: string, ur: string, en: string, last = false) => `<li class="${last ? 'last' : ''}"><div><b class="ur">${ur}</b><small>${en}</small></div><span class="tdot" style="background:${fill}"></span><span class="time">${time}</span></li>`;
const before = (ur: string, en: string) => `<li><b class="ur">${ur}</b><small>${en}</small></li>`;

const sideA = [
  panel('paper', `<p class="kick">فون پر سب کچھ<span>All on your phone</span>${ORN}</p>
    ${phoneParent}
    <p class="cap ur">ایپ کھولنے کی بھی ضرورت نہیں: لاک اسکرین پر منٹ بہ منٹ۔</p><p class="capen">You don't even open the app. It's on your lock screen.</p>`),
  panel('paper', `<p class="kick">پہنچ کے ساتھ ایک صبح<span>One morning with Pohnch</span>${ORN}</p>
    <ol class="day">
      ${moment('7:05', '#1F2A5C', 'وین نکل گئی', 'The van left. Ali is 4 stops away.')}
      ${moment('7:09', '#17705A', 'علی وین میں بیٹھ گیا', 'Ali got in. You saw it, you didn’t call.')}
      ${moment('7:22', '#1F2A5C', 'نقشے پر وین چلتی دکھائی دی', 'Watch it move on the map, minute by minute.')}
      ${moment('7:31', '#E8A33D', 'اسکول پہنچ گئے', 'At school. And the same again at home time.', true)}
    </ol>`),
  panel('night cover', `<div class="frame"><span class="chamak"></span></div>
    <div class="logo">${markLight}</div>
    <h1 class="ur hook">وین کہاں ہے؟</h1>
    <p class="ur sub2">اب فون کرنے کی ضرورت نہیں۔<br><mark>وین آپ کے فون پر۔</mark></p>
    <p class="en">Where's the van? Stop calling.<br>See it, live, on your phone.</p>
    <div class="birds">${BIRD(false)}${ORN}${BIRD(true)}</div>
    <p class="for2">School-van parents in Karachi · <b>Free pilot</b></p>`),
];
const sideB = [
  panel('paper', `<p class="kick">پہلے اور اب<span>Before and after</span>${ORN}</p>
    <div class="ba">
      <p class="tag then">پہلے<span>Before</span></p>
      <ul class="then">
        ${before('ڈرائیور کو بار بار فون', 'Calling the driver again and again')}
        ${before('گیٹ پر کھڑے انتظار', 'Waiting at the gate, guessing')}
        ${before('“بیٹھ گیا؟ پہنچ گیا؟”', '“Is he in? Did she reach?”')}
      </ul>
      <p class="tag now">اب<span>Now</span></p>
      <ul class="now">
        ${vow('ایک نظر، پورا سفر', 'One look, the whole trip.')}
        ${vow('بیٹھا تو خبر، پہنچا تو خبر', 'An alert when in, an alert at school.')}
      </ul>
    </div>
    <p class="drv ur">وین ڈرائیور ہیں؟ آپ کی ایپ مفت ہے۔</p><p class="capen">Van driver? Your app is free: one tap per child.</p>`),
  panel('paper', `<p class="kick">ہمارا وعدہ<span>Our promise</span>${ORN}</p>
    <ul class="vows">
      ${vow('جگہ صرف سفر کے دوران', 'Location only during a trip, never at home.')}
      ${vow('بچے کا صرف پہلا نام', 'First names only. No photos, no gender.')}
      ${vow('30 دن بعد ڈیٹا ختم', 'Trip locations deleted after 30 days.')}
      ${vow('صرف آپ کی وین', 'You see only your child and your van.')}
    </ul>
    <p class="note2 ur">کراچی میں، کراچی کے لیے بنی</p><p class="capen">Made in Karachi, for Karachi.</p>`),
  panel('night qr', `<p class="kick light">پہنچ حاصل کریں<span>Get Pohnch</span>${ORN}</p>
    <div class="qrbox">${QR}<img class="r l" src="${ROSE}"><img class="r rr" src="${ROSE}"></div>
    <p class="scan ur">کیمرے سے اسکین کریں</p><p class="scanen">Scan with your Android camera</p>
    <p class="url">pohnch.pk/app</p>
    <div class="wa"><span class="ur">مدد کے لیے واٹس ایپ</span><b>0300 1478729</b></div>
    <p class="for ur">والدین اور وین ڈرائیور · دونوں کے لیے</p><p class="foren">For parents and van drivers</p>`),
];

const CSS = `
@page { margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
body { font-family: Manrope, sans-serif; color: #141A33; -webkit-print-color-adjust: exact; print-color-adjust: exact }
.sheet { width: var(--W); height: var(--H); padding: var(--B); display: grid; grid-template-columns: repeat(3, 99mm); grid-template-rows: 210mm; break-after: page; position: relative; background: #FBF7EF }
.sheet.dark-b { background: linear-gradient(90deg, #FBF7EF 0 calc(var(--B) + 198mm), #10162F calc(var(--B) + 198mm)) }
.sheet.dark-a { background: linear-gradient(90deg, #FBF7EF 0 calc(var(--B) + 198mm), #10162F calc(var(--B) + 198mm)) }
.ur { font-family: 'Noto Sans Arabic', sans-serif; direction: rtl; }
.panel { position: relative; display: flex; flex-direction: column; width: 99mm; height: 210mm; overflow: hidden }
.panel .body { flex: 1; padding: 12mm 9mm 8mm; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; text-align: center; gap: 4mm }
.band.top { height: 9mm; background: ${svgUri(vineTile(34))} repeat-x center 0 / auto 100% }
.band.bot { height: 7mm; background: ${svgUri(jhalarTile(26))} repeat-x center 0 / auto 100%; transform: scaleY(-1) }
.night { background: #10162F; color: #F5EEE1 }
.paper + .paper::before { content: ""; position: absolute; left: 0; top: 18mm; bottom: 16mm; width: .3mm; background: rgba(184,134,47,.28) }
.kick { font-family: 'Noto Sans Arabic'; font-weight: 700; font-size: 15pt; color: #1F2A5C; line-height: 1.5; display: flex; flex-direction: column; align-items: center }
.kick span { font-family: Manrope; font-size: 8.5pt; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #7A5410; line-height: 1.2 }
.kick::after { content: ""; display: block; width: 14mm; height: 2.2mm; margin-top: 2mm; background: ${svgUri(chamakTile(10))} repeat-x 0 0 / auto 100%; border-radius: 9mm }
.kick.light { color: #F6C46E } .kick.light span { color: #D6CFC1 }
.cover .body { gap: 6mm; justify-content: center; padding-top: 6mm }
.cover .logo svg { width: 46mm; height: auto; display: block }
.cover h1 { font-family: Gulzar, serif; font-weight: 400; font-size: 25pt; line-height: 1.75; color: #F5EEE1 }
.cover h1 mark { background: none; color: #F6C46E }
.cover .en { font-size: 11pt; font-weight: 500; color: #D6CFC1; line-height: 1.4; max-width: 70mm }
.pill { display: inline-flex; align-items: center; gap: 2mm; padding: 2mm 4.5mm; border-radius: 99mm; box-shadow: inset 0 0 0 .3mm rgba(245,238,225,.3); font-size: 9pt; color: #F5EEE1 }
.pill b { color: #F6C46E }
.phone { width: 50mm; height: 98mm; border-radius: 8mm; background: #141A33; padding: 2.2mm; box-shadow: 0 6mm 10mm -6mm rgba(16,22,47,.6) }
.phone.short { height: 74mm } .scr { width: 100%; height: 100%; border-radius: 6mm; overflow: hidden; padding: 6mm 3.5mm 4mm; display: flex; flex-direction: column; gap: 2.5mm }
.scr.lock { background: linear-gradient(180deg, #33428A, #18214C); color: #F5EEE1; text-align: center }
.scr .time { font-size: 24pt; font-weight: 800; letter-spacing: -.02em; margin-bottom: 1mm }
.scr .note { background: rgba(255,253,248,.95); color: #141A33; border-radius: 3mm; padding: 2.4mm; text-align: right; display: flex; flex-direction: column; gap: .6mm }
.scr .note .nh { font-size: 5.6pt; font-weight: 800; color: #4A4F66; display: flex; align-items: center; gap: 1mm; justify-content: flex-end; direction: ltr }
.scr .note.dim { opacity: .82 } .scr .note b { font-size: 8pt; line-height: 1.5 } .scr .note span { font-size: 6pt; color: #4A4F66; text-align: left; direction: ltr }
.scr .live { background: rgba(16,22,47,.75); border-radius: 3mm; padding: 2.4mm; margin-top: auto }
.scr .live .lr { display: flex; align-items: baseline; justify-content: space-between; direction: ltr }
.scr .live .m { font-size: 17pt; font-weight: 800; color: #F6C46E } .scr .live .t { font-size: 7.5pt; font-weight: 700 }
.scr .live .bar { height: 1.4mm; border-radius: 9mm; background: rgba(245,238,225,.2); margin-top: 1.5mm } .scr .live .bar i { display: block; width: 62%; height: 100%; border-radius: 9mm; background: #E8A33D }
.scr.drv { background: #FBF7EF; padding-top: 5mm; gap: 1.8mm }
.dh { background: #1F2A5C; color: #F5EEE1; border-radius: 3mm; padding: 2.2mm 2.6mm; display: flex; justify-content: space-between; align-items: center; direction: rtl }
.dh b { font-size: 8pt } .dh span { font-size: 6.5pt; opacity: .85 }
.dr { display: flex; align-items: center; gap: 1.8mm; direction: rtl; background: #FFFDF8; border-radius: 2.4mm; padding: 1.8mm 2.4mm; font-size: 7pt }
.dr i { width: 2.6mm; height: 2.6mm; border-radius: 50%; background: #17705A; flex: none } .dr i.o { background: none; box-shadow: inset 0 0 0 .35mm #4A4F66 }
.dr b { flex: 1; text-align: right } .dr em { font-style: normal; color: #4A4F66; font-family: Manrope; font-size: 6.5pt }
.dr.done b { color: #4A4F66 }
.dbig { background: #17705A; color: #fff; border-radius: 3mm; padding: 3mm; display: flex; align-items: center; gap: 2mm; direction: rtl; min-height: 14mm }
.dbig .ic { width: 6mm; height: 6mm } .dbig b { font-size: 9pt }
.cap { font-size: 10.5pt; font-weight: 700; line-height: 1.6; max-width: 76mm; margin-top: auto } .capen { font-size: 8.5pt; color: #4A4F66; line-height: 1.4; max-width: 72mm; margin-top: -2.5mm }
.steps { list-style: none; display: flex; flex-direction: column; justify-content: space-evenly; flex: 1; gap: 6mm; width: 100%; margin-top: 2mm }
.steps li { display: grid; grid-template-columns: 1fr 11mm 7mm; align-items: center; gap: 2.5mm; direction: ltr }
.steps li div { grid-column: 1; grid-row: 1; text-align: right; display: flex; flex-direction: column; gap: .8mm }
.steps .sic { grid-row: 1; grid-column: 2; width: 11mm; height: 11mm; border-radius: 3.2mm; background: #E4E7F2; display: grid; place-items: center } .steps .sic .ic { width: 6.2mm; height: 6.2mm }
.steps .num { grid-row: 1; grid-column: 3; font-weight: 800; font-size: 13pt; color: #E8A33D; text-align: center }
.steps b { font-size: 11pt; line-height: 1.55 } .steps small { font-size: 8pt; color: #4A4F66; line-height: 1.35; direction: ltr; text-align: right }
.note2 { font-size: 11pt; font-weight: 700; color: #7A5410; margin-top: 0 }
.plist { list-style: none; display: flex; flex-direction: column; gap: 3mm; width: 100% } .plist.big { gap: 5mm; margin-top: 2mm; flex: 1; justify-content: space-evenly }
.plist li { display: grid; grid-template-columns: 1fr 9mm; align-items: center; gap: 3mm; direction: ltr; background: #FFFDF8; border-radius: 3.5mm; padding: 2.4mm 3mm; box-shadow: inset 0 0 0 .3mm rgba(184,134,47,.3) }
.plist li div { grid-column: 1; grid-row: 1; text-align: right; display: flex; flex-direction: column; gap: .5mm }
.plist .pic { grid-column: 2; grid-row: 1; width: 9mm; height: 9mm; border-radius: 50%; background: #DCEFE6; display: grid; place-items: center } .plist .pic .ic { width: 5mm; height: 5mm }
.plist b { font-size: 10pt; line-height: 1.5 } .plist small { font-size: 7.5pt; color: #4A4F66; line-height: 1.35; text-align: right }
.qr .body { gap: 3.5mm }
.qr .qrbox { margin-top: 6mm } .qrbox { position: relative; background: #fff; padding: 4mm; border-radius: 4.5mm; box-shadow: 0 0 0 1.2mm #E8A33D, 0 0 0 1.9mm #F5EEE1 }
.qrbox svg { width: 50mm; height: 50mm; display: block }
.qrbox .r { position: absolute; width: 14mm; bottom: -6mm } .qrbox .l { left: -9mm } .qrbox .rr { right: -9mm }
.scan { font-size: 12pt; font-weight: 700; color: #F5EEE1; margin-top: 4mm; line-height: 1.5 } .scanen { font-size: 9pt; color: #D6CFC1; margin-top: -3mm }
.url { font-size: 13pt; font-weight: 800; color: #F6C46E; letter-spacing: .02em }
.wa { display: flex; flex-direction: column; align-items: center; gap: .5mm; padding: 2.5mm 6mm; border-radius: 99mm; background: rgba(245,238,225,.08); box-shadow: inset 0 0 0 .3mm rgba(245,238,225,.22) }
.wa span { font-size: 8.5pt; color: #D6CFC1 } .wa b { font-size: 11.5pt; color: #F5EEE1; letter-spacing: .03em }
.night .band.top { opacity: .95 }
.ic { display: block }

.cover h1.hook { font-size: 40pt; line-height: 1.55; color: #F6C46E; margin-top: -2mm }
.cover .sub2 { font-size: 13pt; line-height: 1.75; color: #F5EEE1; font-weight: 700; margin-top: -4mm } .cover .sub2 mark { background: none; color: #F6C46E }
.cover .logo svg { width: 30mm !important }
.for2 { font-size: 8.5pt; color: #D6CFC1 } .for2 b { color: #F6C46E }
.day { list-style: none; width: 100%; flex: 1; display: flex; flex-direction: column; justify-content: space-evenly; position: relative; margin-top: 1mm }
.day::before { content: ""; position: absolute; right: 15.2mm; top: 9%; bottom: 9%; border-right: .7mm dashed #E8A33D }
.day li { display: grid; grid-template-columns: 1fr 5mm 12mm; gap: 2.8mm; align-items: center; direction: ltr; position: relative }
.day li div { text-align: right; display: flex; flex-direction: column; gap: .6mm }
.day .tdot { width: 5mm; height: 5mm; border-radius: 50%; box-shadow: 0 0 0 1.2mm #FBF7EF }
.day .time { font-weight: 800; font-size: 11pt; color: #141A33; font-variant-numeric: tabular-nums; text-align: left }
.day li.last .time { color: #7A5410 }
.day b { font-size: 11pt; line-height: 1.5 } .day small { font-size: 8pt; color: #4A4F66; line-height: 1.35; text-align: right }
.ba { width: 100%; display: flex; flex-direction: column; gap: 2mm; margin-top: 1mm }
.ba .tag { font-family: Gulzar, serif; font-size: 18pt; line-height: 1.6; text-align: right; display: flex; align-items: baseline; justify-content: space-between; direction: ltr; border-bottom: .3mm solid rgba(184,134,47,.35) }
.ba .tag span { font-family: Manrope; font-size: 7.5pt; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #4A4F66; order: -1 }
.ba .tag.then { color: #4A4F66 } .ba .tag.now { color: #17705A; margin-top: 3mm }
.ba ul.then { list-style: none; display: flex; flex-direction: column; gap: 2mm }
.ba ul.then li { text-align: right; display: flex; flex-direction: column }
.ba ul.then b { font-size: 10pt; line-height: 1.5; color: #4A4F66; text-decoration: line-through; text-decoration-color: rgba(168,50,31,.55); text-decoration-thickness: .35mm }
.ba ul.then small { font-size: 7.5pt; color: #6E6450 }
.ba ul.now { list-style: none } .ba ul.now li { display: grid; grid-template-columns: 1fr 6mm; gap: 3mm; direction: ltr; padding: 1.6mm 0 } .ba ul.now li div { text-align: right; display: flex; flex-direction: column }
.ba ul.now b { font-size: 10.5pt; line-height: 1.5 } .ba ul.now small { font-size: 7.8pt; color: #4A4F66; text-align: right } .ba ul.now .vstar { padding-top: 1.4mm; display: flex; justify-content: center }
.drv { font-size: 10.5pt; font-weight: 700; color: #1F2A5C; margin-top: auto; line-height: 1.6 }

.kick::after { display: none }
.orn { display: flex; align-items: center; gap: 2mm; margin-top: 2.2mm } .orn i { width: 9mm; height: .3mm; background: #B8862F; opacity: .7 } .orn svg { display: block }
.kick.light .orn i { background: #F6C46E }
.route { list-style: none; position: relative; width: 100%; flex: 1; display: flex; flex-direction: column; justify-content: space-evenly; margin: 2mm 0 }
.route::before { content: ""; position: absolute; right: 4.6mm; top: 12%; bottom: 12%; border-right: .7mm dashed #E8A33D }
.route li { position: relative; display: grid; grid-template-columns: 1fr 10mm; gap: 4mm; align-items: center; direction: ltr }
.route li div { text-align: right; display: flex; flex-direction: column; gap: .8mm }
.route .dot { width: 10mm; height: 10mm; border-radius: 50%; display: grid; place-items: center; font-weight: 800; font-size: 12pt; box-shadow: 0 0 0 1.4mm #FBF7EF }
.route b { font-size: 11.5pt; line-height: 1.55 } .route small { font-size: 8.2pt; color: #4A4F66; line-height: 1.35; text-align: right }
.vows { list-style: none; width: 100%; flex: 1; display: flex; flex-direction: column; justify-content: space-evenly; margin-top: 1mm }
.vows.small { flex: none; gap: 0; margin-top: 2mm }
.vows li { display: grid; grid-template-columns: 1fr 6mm; gap: 3mm; align-items: start; direction: ltr; padding: 3mm 0; border-top: .3mm solid rgba(184,134,47,.35) }
.vows li:last-child { border-bottom: .3mm solid rgba(184,134,47,.35) }
.vows li div { text-align: right; display: flex; flex-direction: column; gap: .5mm }
.vows .vstar { padding-top: 1.6mm; display: flex; justify-content: center }
.vows b { font-size: 11pt; line-height: 1.5 } .vows small { font-size: 8pt; color: #4A4F66; line-height: 1.35; text-align: right }
.vows.small li { padding: 2mm 0 } .vows.small b { font-size: 9.5pt }
.for { font-size: 9.5pt; color: #F6C46E; margin-top: auto; line-height: 1.6 } .foren { font-size: 8pt; color: #D6CFC1; margin-top: -3mm }
.cover { position: relative }
.cover .frame { position: absolute; inset: 15mm 6mm 13mm; border: .35mm solid rgba(246,196,110,.45); border-radius: 5mm; pointer-events: none }
.cover .frame .chamak { position: absolute; top: 3mm; left: 10mm; right: 10mm; height: 2.4mm; border-radius: 9mm; background: ${svgUri(chamakTile(10))} repeat-x center 0 / auto 100% }
.cover .birds { display: flex; align-items: flex-end; justify-content: center; gap: 3mm } .cover .birds .bird { width: 17mm; height: 21mm } .cover .birds .orn { margin: 0 0 3mm }
.cover .birds .orn i { background: #F6C46E }
`;

const html = (bleed: number) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Gulzar&family=Manrope:wght@500;700;800&family=Noto+Sans+Arabic:wght@500;700&display=swap" rel="stylesheet">
<style>:root{--B:${bleed}mm;--W:${297 + 2 * bleed}mm;--H:${210 + 2 * bleed}mm}${CSS}</style></head><body>
<div class="sheet dark-a">${sideA.join('')}</div>
<div class="sheet dark-b">${sideB.join('')}</div>
</body></html>`;

const b = await chromium.launch();
for (const [name, bleed] of [['pohnch-brochure', 0]] as const) {
  const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
  await p.setContent(html(bleed), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: `${out}/${name}.pdf`, width: `${297 + 2 * bleed}mm`, height: `${210 + 2 * bleed}mm`, printBackground: true });
  if (bleed === 0) {
    
    const sheets = await p.$$('.sheet');
    await sheets[0]!.screenshot({ path: `${out}/pohnch-brochure-outside.png` });
    await sheets[1]!.screenshot({ path: `${out}/pohnch-brochure-inside.png` });
    // fold check: every text/box inside a panel stays inside that panel (no crossing a fold)
    const report = await p.evaluate(() => {
      const bad: string[] = []; const centres: number[] = [];
      document.querySelectorAll('.panel').forEach((pn, i) => {
        const r = pn.getBoundingClientRect();
        pn.querySelectorAll('.body *').forEach((el) => { const e = el.getBoundingClientRect(); if (e.width && (e.left < r.left - 0.5 || e.right > r.right + 0.5) && !el.classList.contains('r')) bad.push(`panel ${i}: ${el.tagName}.${el.className}`); });
        const body = pn.querySelector('.body')!; const kids = [...body.children].map((c) => c.getBoundingClientRect());
        const mid = (r.left + r.right) / 2; centres.push(Math.max(...kids.map((k) => Math.abs((k.left + k.right) / 2 - mid))));
      });
      return { bad, worstOffCentrePx: Math.max(...centres) };
    });
    console.log(JSON.stringify(report));
  }
  await p.close();
}
await b.close();
