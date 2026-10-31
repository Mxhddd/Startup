// renders each poster page to its own PDF page at its exact size, plus PNG previews
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  await p.goto('file://' + path.resolve('posters.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(1500);
  const n = await p.evaluate(() => document.querySelectorAll('.page').length);
  for (let k = 0; k < n; k++) {
    const dims = await p.evaluate((k) => { const pages = [...document.querySelectorAll('.page')]; pages.forEach((e, j) => { e.style.display = j === k ? 'flex' : 'none'; e.style.margin = '0'; }); document.body.style.background = '#FAF6EE'; const e = pages[k]; return { w: e.dataset.w, h: e.dataset.h }; }, k);
    await p.pdf({ path: 'page' + k + '.pdf', width: dims.w + 'mm', height: dims.h + 'mm', printBackground: true, pageRanges: '1' });
    const el = await p.$$('.page');
    await el[k].screenshot({ path: 'prev' + k + '.png' });
  }
  await b.close();
  console.log('pages', n);
})();
