# Pohnch ad v1 (hand-drawn, 34 s, 9:16)

- `ad.html`: the animation (GSAP timeline, SVG, pencil filters). Open it in a browser and call `seek(t)` to look at any moment.
- `render.cjs`: renders it. `node render.cjs` writes every frame and `pohnch-ad-v1.mp4` (no sound); `node render.cjs stills 2,10,20` saves stills.
- The sound (`pohnch-ad-v1-sound.mp4`) is the app's own Pohnch tones placed on each moment, over a soft D-major pad and a phone ring. The ffmpeg command is in the chat log of 17 Nov 2026; re-run it after a new render.
