// Renders ad.html frame by frame: node render.cjs [fps] [out.mp4]   or   node render.cjs stills 1,5,10
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const here = __dirname, frames = path.join(here, 'frames');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.join(here, 'ad.html'));
  await p.evaluate(() => window.ready);
  if (process.argv[2] === 'stills') {
    for (const t of process.argv[3].split(',').map(Number)) { await p.evaluate((t) => window.seek(t), t); await p.screenshot({ path: path.join(here, `still-${t}.png`) }); }
    await b.close(); return;
  }
  const fps = Number(process.argv[2] || 30), dur = await p.evaluate(() => window.DURATION);
  fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames);
  for (let i = 0; i < Math.round(dur * fps); i++) {
    await p.evaluate((t) => window.seek(t), i / fps);
    await p.screenshot({ path: path.join(frames, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
  }
  await b.close();
  const out = process.argv[3] || path.join(here, 'pohnch-ad-v1.mp4');
  execFileSync('ffmpeg', ['-y', '-framerate', String(fps), '-i', path.join(frames, 'f%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', out], { stdio: 'inherit' });
})();
