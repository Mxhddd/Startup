import { chamakTile, lehriyaTile, jhalarTile, parrot, peacock, TC } from './ta.mts';
import { writeFileSync } from 'node:fs';
const uri = (s: string) => `data:image/svg+xml,${encodeURIComponent(s)}`;
const css = (s: string) => `url("${uri(s)}")`;
const wrap = (w: number, h: number, vb: string, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">${body}</svg>`;
const STAR = 'M32 4 L40.2 12.2 L51.8 12.2 L51.8 23.8 L60 32 L51.8 40.2 L51.8 51.8 L40.2 51.8 L32 60 L23.8 51.8 L12.2 51.8 L12.2 40.2 L4 32 L12.2 23.8 L12.2 12.2 L23.8 12.2 Z';
const pea = (flip: boolean) => uri(wrap(220, 220, '-110 -190 220 220', peacock(0, 0, 160, flip)));
const par = (flip: boolean) => uri(wrap(160, 190, '-80 -112 160 190', parrot(0, 0, 112, flip)));
const card = (col: string, icon: string, ur: string, en: string, time: string, ink = '#FFFDF8') => `
      <div style="display: flex; align-items: center; gap: 16px; background: #FFFDF8; border: 4px solid #23284A; border-radius: 26px; padding: 14px 18px 14px 14px; box-shadow: 0 5px 0 #23284A">
        <svg width="64" height="64" viewBox="24 24 64 64" style="flex: none"><circle cx="56" cy="56" r="32" fill="${col}"/><path d="${icon}" fill="none" stroke="${ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 0">
          <span lang="ur" dir="rtl" style="font-family: 'Noto Sans Arabic', sans-serif; font-weight: 700; font-size: 26px; line-height: 1.6; color: #141A33; text-align: right">${ur}</span>
          <span style="display: flex; justify-content: space-between; font-size: 19px; font-weight: 700; color: #4A4F66"><span>${en}</span><b style="color: #141A33; font-weight: 800">${time}</b></span>
        </div>
      </div>`;
const BELL = 'M44 64 h24 M48 64 v-12 a8 8 0 0 1 16 0 v12 M56 70 v2';
const CHECK = 'M42 56 L52 66 L70 46';
const FLAG = 'M46 72 V40 M46 40 L68 46 L46 54';
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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&amp;family=Gulzar&amp;family=Manrope:wght@600;700;800&amp;family=Noto+Sans+Arabic:wght@600;700&amp;display=swap">
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
    <filter id="pencil" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter>
    <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="17" cy="17" r="1.8" fill="#D8CDB6"/></pattern>
    <pattern id="lattice" width="72" height="72" patternUnits="userSpaceOnUse"><path transform="translate(36 36) scale(0.34) translate(-32 -32)" d="${STAR}" fill="#26326B"/><circle cx="36" cy="36" r="2.6" fill="#E8A33D" opacity="0.7"/></pattern>
  </defs></svg>

  <!-- paper -->
  <svg width="850" height="2000" style="position: absolute; inset: 0" aria-hidden="true"><rect width="850" height="2000" fill="url(#dots)"/></svg>

  <!-- 1. the painted night: question, phone, peacocks -->
  <svg width="850" height="1190" style="position: absolute; left: 0; top: 0" aria-hidden="true"><rect width="850" height="1190" fill="#1F2A5C"/><rect width="850" height="1190" fill="url(#lattice)"/></svg>
  <div class="b-chamak" style="position: absolute; left: 0; top: 0; width: 850px; height: 34px"></div>
  <div style="position: absolute; left: 0; top: 34px; width: 850px; height: 30px; background: #141C42"></div>
  <div class="b-lehriya" style="position: absolute; left: 0; top: 38px; width: 850px; height: 22px"></div>
  <div lang="ur" dir="rtl" style="position: absolute; left: 0; top: 96px; width: 850px; text-align: center; font-family: Gulzar, serif; font-size: 150px; line-height: 1.7; color: #FAF6EE">وین کہاں ہے؟</div>
  <div style="position: absolute; left: 0; top: 378px; width: 850px; text-align: center; font-size: 46px; font-weight: 800; color: #E8A33D; letter-spacing: -0.01em">Where's the van?</div>

  <div style="position: absolute; left: 205px; top: 470px; width: 440px; height: 660px; box-sizing: border-box; border: 16px solid #0E1022; border-radius: 60px; background: #F4EEE1 radial-gradient(circle at 17px 17px, #D8CDB6 1.8px, transparent 2px) 0 0 / 34px 34px; transform: rotate(-2.5deg); box-shadow: 0 24px 50px -20px rgba(0,0,0,.5); padding: 22px 18px 0; display: flex; flex-direction: column; gap: 16px">
    <div style="align-self: center; width: 100px; height: 22px; border-radius: 11px; background: #0E1022"></div>
    <div style="text-align: center; line-height: 1"><div style="font-size: 54px; font-weight: 800">7:31</div><div style="font-family: Caveat, cursive; font-size: 30px; font-weight: 700; color: #4A4F66; margin-top: 4px">this morning</div></div>
    ${card('#1F2A5C', BELL, 'وین 5 منٹ دور ہے', 'Get ready', '7:07')}
    ${card('#17705A', CHECK, 'عائشہ وین میں ہے', 'Picked up', '7:12')}
    ${card('#E8A33D', FLAG, 'وین اسکول پہنچ گئی', 'Reached school', '7:31', '#141A33')}
  </div>
  <img src="${pea(false)}" alt="" style="position: absolute; left: -6px; top: 900px; width: 250px; height: 250px">
  <img src="${pea(true)}" alt="" style="position: absolute; right: -6px; top: 900px; width: 250px; height: 250px">
  <div class="b-chamak-s" style="position: absolute; left: 0; top: 1166px; width: 850px; height: 24px"></div>
  <div class="b-jhalar" style="position: absolute; left: 0; top: 1188px; width: 850px; height: 50px"></div>

  <!-- 2. the promise -->
  <div style="position: absolute; left: 40px; top: 1270px; width: 770px; text-align: center; font-size: 64px; font-weight: 800; line-height: 1.05; letter-spacing: -0.03em">Stop calling.<br>Get an alert.</div>
  <div style="position: absolute; left: 40px; top: 1414px; width: 770px; text-align: center; font-family: Caveat, cursive; font-size: 42px; font-weight: 700; color: #17705A">at every step of the school run</div>

  <!-- 3. the QR, alone in a painted frame -->
  <svg width="440" height="440" viewBox="0 0 440 440" style="position: absolute; left: 205px; top: 1488px" aria-hidden="true">
    <rect x="6" y="10" width="428" height="428" rx="40" fill="#0E1022"/>
    <rect x="4" y="4" width="428" height="428" rx="40" fill="#E8A33D" stroke="#0E1022" stroke-width="5"/>
    <rect x="34" y="34" width="368" height="368" rx="20" fill="#FFFDF8" stroke="#0E1022" stroke-width="4"/>
  </svg>
  <div class="b-chamak-s" style="position: absolute; left: 245px; top: 1497px; width: 360px; height: 24px; border-radius: 6px"></div>
  <div class="b-chamak-s" style="position: absolute; left: 245px; top: 1897px; width: 360px; height: 24px; border-radius: 6px"></div>
  <img src="/_blob/8b75ab2ca13c2149ba90256ef3f55838" alt="QR code to pohnch.pk/links" style="position: absolute; left: 263px; top: 1550px; width: 324px; height: 324px">
  <img src="${par(false)}" alt="" style="position: absolute; left: 30px; top: 1700px; width: 170px; height: 202px">
  <img src="${par(true)}" alt="" style="position: absolute; right: 30px; top: 1700px; width: 170px; height: 202px">
  <div style="position: absolute; left: 0; top: 1946px; width: 850px; text-align: center; font-size: 30px; font-weight: 800; color: #1F2A5C; letter-spacing: 0.02em">pohnch.pk</div>
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
