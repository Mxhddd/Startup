// Renders each sticker in stickers.html to a 512x512 transparent PNG, then WebP under 100 KB, plus the
// 96x96 tray icon. Usage: node render.cjs
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 2048, height: 1024 } });
  await p.goto('file://' + path.join(__dirname, 'stickers.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(800);
  for (let i = 1; i <= 8; i++) await p.locator('#st' + i).screenshot({ path: path.join(__dirname, `png/sticker-${i}.png`), omitBackground: true });
  await b.close();
  execFileSync('python3', ['-c', `
from PIL import Image
import os
d=${JSON.stringify(__dirname)}
for i in range(1,9):
    im=Image.open(f'{d}/png/sticker-{i}.png').convert('RGBA').resize((512,512))
    q=90
    while True:
        im.save(f'{d}/webp/pohnch-sticker-{i}.webp','WEBP',quality=q,method=6)
        if os.path.getsize(f'{d}/webp/pohnch-sticker-{i}.webp')<100000 or q<40: break
        q-=10
Image.open(f'{d}/png/sticker-8.png').convert('RGBA').resize((96,96)).save(f'{d}/webp/tray.png')
`], { stdio: 'inherit' });
})();
