// Renders one reel frame by frame:  node render.cjs <id> [fps]   or   node render.cjs <id> stills 1,4,9
// Writes out/<id>.mp4 (silent) and out/<id>-sound.mp4 (with the Pohnch soundtrack, faded out).
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const here = __dirname, id = process.argv[2], out = path.join(here, 'out');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.join(here, 'reel.html') + '#' + id, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.evaluate(() => Promise.race([window.ready, new Promise((r) => setTimeout(r, 20000))]));
  await p.evaluate(() => { window.seek(0); });
  if (process.argv[3] === 'stills') {
    for (const t of process.argv[4].split(',').map(Number)) { await p.evaluate((t) => { window.seek(t); }, t); await p.screenshot({ path: path.join(out, `${id}-still-${t}.png`) }); }
    await b.close(); return;
  }
  const fps = Number(process.argv[3] || 30), dur = await p.evaluate(() => window.DURATION);
  const frames = path.join(here, 'frames-' + id);
  fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames);
  for (let i = 0; i < Math.round(dur * fps); i++) {
    await p.evaluate((t) => { window.seek(t); }, i / fps);
    await p.screenshot({ path: path.join(frames, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 90 });
  }
  // the cover frame for the grid: the hook at 1.4 s
  await p.evaluate(() => { window.seek(1.4); }); await p.screenshot({ path: path.join(out, `${id}-cover.jpg`), type: 'jpeg', quality: 92 });
  await b.close();
  const silent = path.join(out, `${id}.mp4`);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(fps), '-i', path.join(frames, 'f%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-movflags', '+faststart', silent]);
  const song = path.join(here, '..', 'ad-v1', 'soundtrack.wav');
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', silent, '-i', song, '-filter_complex', `[1:a]atrim=0:${dur},afade=t=out:st=${Math.max(0, dur - 1.2)}:d=1.2,volume=0.8[a]`, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', path.join(out, `${id}-sound.mp4`)]);
  fs.rmSync(frames, { recursive: true, force: true });
  console.log(id, dur.toFixed(1) + 's');
})();
