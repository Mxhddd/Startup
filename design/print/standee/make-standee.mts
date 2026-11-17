// Standee v4 (85 x 200 cm at 850 x 2000): logo, a painted school van with an alert above it,
// "how it works" in three steps, and the QR alone in a painted frame. No roses; no shingarf red.
import { chamakTile, lehriyaTile, jhalarTile, parrot, peacock } from './ta.mts';
import { readFileSync, writeFileSync } from 'node:fs';
const uri = (s: string) => `data:image/svg+xml,${encodeURIComponent(s)}`;
const css = (s: string) => `url("${uri(s)}")`;
const wrap = (w: number, h: number, vb: string, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">${body}</svg>`;
const STAR = 'M32 4 L40.2 12.2 L51.8 12.2 L51.8 23.8 L60 32 L51.8 40.2 L51.8 51.8 L40.2 51.8 L32 60 L23.8 51.8 L12.2 51.8 L12.2 40.2 L4 32 L12.2 23.8 L12.2 12.2 L23.8 12.2 Z';
const logo = uri(readFileSync('/home/user/Startup/design/logo/pohnch-lockup-on-neel.svg', 'utf8'));
const pea = (flip: boolean) => uri(wrap(220, 220, '-110 -190 220 220', peacock(0, 0, 160, flip)));
const par = (flip: boolean) => uri(wrap(160, 190, '-80 -112 160 190', parrot(0, 0, 112, flip)));
const chamakUri = uri(chamakTile(28, 2));
const jhalarUri = uri(jhalarTile(26));

// the van: a boxy Karachi school van (Bolan/Hiace shape), painted truck-style
const van = `<svg width="720" height="360" viewBox="0 0 720 360" style="position: absolute; left: 65px; top: 672px" aria-hidden="true">
  <defs>
    <pattern id="vch" width="112" height="28" patternUnits="userSpaceOnUse"><image href="${chamakUri}" width="112" height="28"/></pattern>
    <pattern id="vjh" width="47.4" height="26" patternUnits="userSpaceOnUse"><image href="${jhalarUri}" width="47.4" height="26"/></pattern>
    <filter id="pen" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="6"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter>
  </defs>
  <ellipse cx="360" cy="336" rx="330" ry="16" fill="#0E1022" opacity="0.35"/>
  <!-- roof sign -->
  <rect x="190" y="22" width="300" height="58" rx="10" fill="#FAF6EE" stroke="#0E1022" stroke-width="5"/>
  <text x="340" y="66" text-anchor="middle" direction="rtl" style="font-family: 'Noto Sans Arabic', sans-serif; font-weight: 800; font-size: 34px" fill="#1F2A5C">اسکول وین</text>
  <path d="M240 80 V96 M440 80 V96" stroke="#0E1022" stroke-width="6"/>
  <!-- body -->
  <g filter="url(#pen)">
    <path d="M24 300 V128 Q24 96 56 96 H530 Q566 96 592 128 L672 220 Q696 226 696 252 V300 Z" fill="#E8A33D" stroke="#0E1022" stroke-width="7" stroke-linejoin="round"/>
    <rect x="50" y="118" width="102" height="72" rx="12" fill="#DDE6F2" stroke="#0E1022" stroke-width="5"/>
    <rect x="166" y="118" width="102" height="72" rx="12" fill="#DDE6F2" stroke="#0E1022" stroke-width="5"/>
    <rect x="282" y="118" width="102" height="72" rx="12" fill="#DDE6F2" stroke="#0E1022" stroke-width="5"/>
    <rect x="398" y="118" width="102" height="72" rx="12" fill="#DDE6F2" stroke="#0E1022" stroke-width="5"/>
    <path d="M516 118 H556 Q574 118 586 134 L640 204 H516 Z" fill="#DDE6F2" stroke="#0E1022" stroke-width="5" stroke-linejoin="round"/>
  </g>
  <rect x="28" y="206" width="664" height="28" fill="url(#vch)"/>
  <path d="M26 206 H694 M26 234 H694" stroke="#0E1022" stroke-width="4"/>
  <rect x="28" y="236" width="664" height="8" fill="#17705A"/>
  <rect x="28" y="244" width="664" height="6" fill="#C2185B"/>
  <g transform="translate(300 256) scale(0.62)"><path d="${STAR}" fill="#1F2A5C"/><circle cx="32" cy="32" r="8" fill="#E8A33D"/></g>
  <text x="378" y="290" style="font-family: Manrope, sans-serif; font-weight: 800; font-size: 26px; letter-spacing: 0.04em" fill="#1F2A5C">POHNCH</text>
  <circle cx="676" cy="268" r="11" fill="#FAF6EE" stroke="#0E1022" stroke-width="4"/>
  <rect x="660" y="296" width="44" height="12" rx="5" fill="#0E1022"/>
  <rect x="16" y="296" width="40" height="12" rx="5" fill="#0E1022"/>
  <rect x="80" y="298" width="200" height="26" fill="url(#vjh)"/>
  <rect x="430" y="298" width="160" height="26" fill="url(#vjh)"/>
  <g><circle cx="168" cy="300" r="44" fill="#0E1022"/><circle cx="168" cy="300" r="18" fill="#E8A33D"/><circle cx="168" cy="300" r="6" fill="#0E1022"/>
     <circle cx="560" cy="300" r="44" fill="#0E1022"/><circle cx="560" cy="300" r="18" fill="#E8A33D"/><circle cx="560" cy="300" r="6" fill="#0E1022"/></g>
</svg>`;

const ICON = {
  tap: '<path d="M30 52 V30 a5 5 0 0 1 10 0 V44 M40 40 a5 5 0 0 1 10 0 V46 M50 44 a5 5 0 0 1 10 0 V54 Q60 70 46 72 H38 Q30 70 26 62 L20 52 a4.5 4.5 0 0 1 8 -4 L30 52" />',
  bell: '<path d="M26 58 H62 M32 58 V42 a12 12 0 0 1 24 0 V58 M44 64 v3 M44 24 v6" />',
  map: '<path d="M22 30 L36 24 L52 30 L66 24 V64 L52 70 L36 64 L22 70 Z M36 24 V64 M52 30 V70" />',
};
const step = (n: number, col: string, icon: string, ur: string, en: string, y: number, ink = '#FFFDF8') => `
  <div style="position: absolute; left: 60px; top: ${y}px; width: 730px; height: 120px; display: flex; align-items: center; gap: 22px; background: #FFFDF8; border: 4px solid #0E1022; border-radius: 28px; box-shadow: 0 6px 0 #0E1022; padding: 0 26px 0 18px; box-sizing: border-box">
    <div style="position: relative; flex: none; width: 92px; height: 92px; border-radius: 26px; background: ${col}; display: grid; place-items: center">
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none" stroke="${ink}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
      <span style="position: absolute; top: -12px; left: -12px; width: 40px; height: 40px; border-radius: 50%; background: #0E1022; color: #E8A33D; font-weight: 800; font-size: 22px; display: grid; place-items: center">${n}</span>
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; gap: 0">
      <span lang="ur" dir="rtl" style="font-family: 'Noto Sans Arabic', sans-serif; font-weight: 700; font-size: 32px; line-height: 1.55; color: #141A33; text-align: right">${ur}</span>
      <span style="font-size: 25px; font-weight: 800; color: #1F2A5C; letter-spacing: -0.01em">${en}</span>
    </div>
  </div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Pohnch standee</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&amp;family=Gulzar&amp;family=Manrope:wght@600;700;800&amp;family=Noto+Sans+Arabic:wght@600;700;800&amp;display=swap">
<style>
body{margin:0}
.b-chamak{background-image:${css(chamakTile(34, 3))};background-repeat:repeat-x;background-size:auto 34px}
.b-chamak-s{background-image:${css(chamakTile(24, 1))};background-repeat:repeat-x;background-size:auto 24px}
.b-lehriya{background-image:${css(lehriyaTile(22))};background-repeat:repeat-x;background-size:auto 22px}
.b-jhalar{background-image:${css(jhalarTile(50))};background-repeat:repeat-x;background-size:auto 50px}
</style>
</helmet>
<div style="width: 850px; height: 2000px; position: relative; overflow: hidden; background: #F4EEE1; font-family: Manrope, sans-serif; color: #141A33">
  <svg width="0" height="0" style="position: absolute" aria-hidden="true"><defs>
    <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="17" cy="17" r="1.8" fill="#D8CDB6"/></pattern>
    <pattern id="lattice" width="72" height="72" patternUnits="userSpaceOnUse"><path transform="translate(36 36) scale(0.34) translate(-32 -32)" d="${STAR}" fill="#26326B"/><circle cx="36" cy="36" r="2.6" fill="#E8A33D" opacity="0.7"/></pattern>
  </defs></svg>
  <svg width="850" height="2000" style="position: absolute; inset: 0" aria-hidden="true"><rect width="850" height="2000" fill="url(#dots)"/></svg>

  <!-- 1. painted night: logo, question, the van with an alert -->
  <svg width="850" height="1080" style="position: absolute; left: 0; top: 0" aria-hidden="true"><rect width="850" height="1080" fill="#1F2A5C"/><rect width="850" height="1080" fill="url(#lattice)"/></svg>
  <div class="b-chamak" style="position: absolute; left: 0; top: 0; width: 850px; height: 34px"></div>
  <div style="position: absolute; left: 0; top: 34px; width: 850px; height: 30px; background: #141C42"></div>
  <div class="b-lehriya" style="position: absolute; left: 0; top: 38px; width: 850px; height: 22px"></div>
  <img src="${logo}" alt="Pohnch" style="position: absolute; left: 265px; top: 92px; width: 320px; height: 91.8px">
  <div lang="ur" dir="rtl" style="position: absolute; left: 0; top: 226px; width: 850px; text-align: center; font-family: Gulzar, serif; font-size: 118px; line-height: 1.7; color: #FAF6EE">وین کہاں ہے؟</div>
  <div style="position: absolute; left: 0; top: 470px; width: 850px; text-align: center; font-size: 42px; font-weight: 800; color: #E8A33D; letter-spacing: -0.01em">See your child's school van, live.</div>

  <!-- the alert, popping out of the van -->
  <div style="position: absolute; left: 150px; top: 548px; width: 550px; display: flex; align-items: center; gap: 18px; background: #FFFDF8; border: 4px solid #0E1022; border-radius: 28px; padding: 14px 22px 14px 14px; box-sizing: border-box; box-shadow: 0 8px 0 #0E1022; transform: rotate(-1.5deg)">
    <svg width="72" height="72" viewBox="24 24 64 64" style="flex: none"><circle cx="56" cy="56" r="32" fill="#17705A"/><path d="M42 56 L52 66 L70 46" fill="none" stroke="#FFFDF8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div style="flex: 1; display: flex; flex-direction: column">
      <span lang="ur" dir="rtl" style="font-family: 'Noto Sans Arabic', sans-serif; font-weight: 700; font-size: 30px; line-height: 1.5; text-align: right">عائشہ وین میں ہے</span>
      <span style="display: flex; justify-content: space-between; font-size: 22px; font-weight: 700; color: #4A4F66"><span>Pohnch · Picked up</span><b style="color: #141A33">7:12</b></span>
    </div>
  </div>
  <svg width="40" height="34" viewBox="0 0 40 34" style="position: absolute; left: 400px; top: 660px" aria-hidden="true"><path d="M2 0 L20 30 L38 0" fill="#FFFDF8" stroke="#0E1022" stroke-width="4" stroke-linejoin="round"/><rect x="4" y="-4" width="32" height="6" fill="#FFFDF8"/></svg>
  ${van}
  <svg width="850" height="20" style="position: absolute; left: 0; top: 1022px" aria-hidden="true"><path d="M0 10 H850" stroke="#E8A33D" stroke-width="5" stroke-dasharray="2 22" stroke-linecap="round" opacity="0.8"/></svg>
  <div class="b-chamak-s" style="position: absolute; left: 0; top: 1056px; width: 850px; height: 24px"></div>
  <div class="b-jhalar" style="position: absolute; left: 0; top: 1078px; width: 850px; height: 50px"></div>

  <!-- 2. how it works -->
  <div style="position: absolute; left: 0; top: 1150px; width: 850px; text-align: center; font-family: Caveat, cursive; font-size: 46px; font-weight: 700; color: #7A5410">how Pohnch works</div>
  ${step(1, '#1F2A5C', ICON.tap, 'ڈرائیور ہر بچے کے لیے ایک ٹیپ کرتا ہے', 'The driver taps when your child gets in', 1218)}
  ${step(2, '#17705A', ICON.bell, 'آپ کو فوراً اطلاع ملتی ہے', 'You get an alert, right away', 1358)}
  ${step(3, '#E8A33D', ICON.map, 'وین نقشے پر لائیو دیکھیں', 'See the van live, minutes to your door', 1498, '#141A33')}

  <!-- 3. the QR, alone in a painted frame -->
  <svg width="296" height="296" viewBox="0 0 296 296" style="position: absolute; left: 277px; top: 1640px" aria-hidden="true">
    <rect x="6" y="10" width="286" height="284" rx="32" fill="#0E1022"/>
    <rect x="3" y="3" width="286" height="284" rx="32" fill="#E8A33D" stroke="#0E1022" stroke-width="5"/>
    <rect x="25" y="25" width="242" height="240" rx="14" fill="#FFFDF8" stroke="#0E1022" stroke-width="4"/>
  </svg>
  <img src="/_blob/8b75ab2ca13c2149ba90256ef3f55838" alt="QR code to pohnch.pk/links" style="position: absolute; left: 318px; top: 1680px; width: 212px; height: 212px">
  <img src="${par(false)}" alt="" style="position: absolute; left: 80px; top: 1740px; width: 150px; height: 178px">
  <img src="${par(true)}" alt="" style="position: absolute; right: 80px; top: 1740px; width: 150px; height: 178px">
  <div style="position: absolute; left: 0; top: 1946px; width: 850px; height: 54px; background: #1F2A5C; display: flex; align-items: center; justify-content: center; gap: 18px; font-weight: 800">
    <span style="font-size: 28px; color: #E8A33D">pohnch.pk</span><span style="font-size: 22px; color: #FAF6EE">Free for drivers</span>
  </div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":850,"height":2000}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
`;
writeFileSync('campaign/project/Standee.dc.html', html);
