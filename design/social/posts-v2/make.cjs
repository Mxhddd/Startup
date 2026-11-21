// Renders every post in posts.html to png/<id>.png and writes the same markup as a canvas artboard
// (canvas/<Name>.dc.html) for the Claude design canvas.  node make.cjs
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const here = __dirname;
(async () => {
  fs.mkdirSync(path.join(here, 'png'), { recursive: true }); fs.mkdirSync(path.join(here, 'canvas'), { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.goto('file://' + path.join(here, 'posts.html'), { waitUntil: 'domcontentloaded' });
  const ids = await p.evaluate(() => window.IDS);
  let css = await p.evaluate(() => document.getElementById('css').textContent);
  css = css.replace(/@font-face[^}]*}\s*/g, '');
  for (const id of ids) {
    await p.goto('file://' + path.join(here, 'posts.html') + '#' + id, { waitUntil: 'domcontentloaded' });
    await p.reload({ waitUntil: 'domcontentloaded' });
    await p.evaluate(() => Promise.all(['700 40px Caveat', '800 40px Manrope', '700 40px Manrope', '40px Gulzar', '40px "Noto Color Emoji"'].map((f) => document.fonts.load(f, 'Aa پہنچ 🚐'))));
    await p.waitForTimeout(150);
    await p.locator('.post').screenshot({ path: path.join(here, 'png', id + '.png') });
    const html = await p.evaluate(() => document.querySelector('.post').outerHTML);
    const name = 'V2' + id[0].toUpperCase() + id.slice(1);
    fs.writeFileSync(path.join(here, 'canvas', name + '.dc.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${name}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&amp;family=Gulzar&amp;family=Manrope:wght@500;700;800&amp;display=swap">
<style>
${css}
</style>
</helmet>
${html}
</x-dc>
</body>
</html>
`);
    console.log(id);
  }
  await b.close();
})();
