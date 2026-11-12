// The 3D miniature of Karachi behind the home page (v16, rebuilt in v18). Everything is built in code
// from simple shapes, in modules under ./world: the city (Karachi apartments with balconies, laundry,
// shop signs, water tanks, trees, the mosque, your home, the school), the truck-art school van, the
// street life (kites, rickshaws, a donkey cart, people, children, crows) and the far edge (the sea,
// Mazar-e-Quaid, a minaret). The page tells it what to show through setState(): the camera, the hour
// of the day, how much colour (grey before Pohnch), how much of the route is lit, and where the van
// is. A tilt-shift blur makes it look like a model city.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { clamp } from './hour';
import { buildCity } from './world/city';
import { buildLandmarks } from './world/landmarks';
import { buildLife } from './world/life';
import { HOME } from './world/map';
import { PostShader } from './world/post';
import { skyAt } from './world/sky';
import { NO_WORDS, cloudTex, forgetPainted, streetSign, whenFontsReady, type WorldWords } from './world/textures';
import type { Quality, World, WorldState } from './world/types';
import { buildVan } from './world/van';

export type { Pose, Quality, World, WorldState } from './world/types';
export type { WorldWords } from './world/textures';
export { FORK, HOME, ROADS_X, ROADS_Z, ROUTE, SCHOOL, routeCurve, routeU } from './world/map';
export { skyAt } from './world/sky';

export function createWorld(canvas: HTMLCanvasElement, opts: { quality?: Quality; words?: WorldWords } = {}): World {
  const q: Quality = opts.quality ?? 'high';
  const words = opts.words ?? NO_WORDS;
  // 'low' (phones): no post-processing pass at all, the page greys the canvas with a CSS filter instead
  const post = q !== 'low';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !post, powerPreference: 'high-performance', stencil: false });
  const prCap = Math.min({ high: 1.5, mid: 1.25, low: 1.1 }[q], window.devicePixelRatio || 1);
  let pr = prCap;
  renderer.setPixelRatio(pr);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // the city never moves, so its shadows are drawn once and again only when the sun moves
  renderer.shadowMap.autoUpdate = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#EDE3D0', 260, 640);
  const camera = new THREE.PerspectiveCamera(24, 1, 5, 2000);
  const hemi = new THREE.HemisphereLight('#ffffff', '#C9B48E', 1.2); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#FFF4E2', 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(q === 'low' ? 1024 : 2048, q === 'low' ? 1024 : 2048);
  const sc = sun.shadow.camera as THREE.OrthographicCamera; sc.left = -250; sc.right = 250; sc.top = 250; sc.bottom = -250; sc.near = 10; sc.far = 900;
  sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.8;
  scene.add(sun); scene.add(sun.target);

  const clouds = cloudTex();
  const city = buildCity(scene, q, words);
  const van = buildVan(scene, q, words);
  const life = buildLife(scene, q, city.blocks, city.tanksArr, clouds);
  const edge = buildLandmarks(scene, q);
  const cloudSprites: THREE.Sprite[] = [];
  { const r = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    for (let k = 0; k < 9; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: clouds, transparent: true, depthWrite: false, opacity: 0.55 })); s.scale.set(90 + r() * 60, 45, 1); s.position.set(-260 + r() * 520, 70 + r() * 30, -200 + r() * 320); scene.add(s); cloudSprites.push(s); } }

  /* ---------------- the street sign with your area (v17) ---------------- */
  const signCanvas = document.createElement('canvas'); signCanvas.width = 512; signCanvas.height = 150;
  const signTex = new THREE.CanvasTexture(signCanvas); signTex.colorSpace = THREE.SRGBColorSpace; signTex.anisotropy = 4;
  const sign = new THREE.Group();
  { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 7, 8), new THREE.MeshStandardMaterial({ color: '#5A5F70', roughness: 0.9 })); pole.position.y = 3.5; sign.add(pole);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(11, 3.2), new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide }));
    board.position.y = 7.6; sign.add(board);
    sign.position.set(HOME.x + 16, 0, HOME.z - 5); sign.visible = false; scene.add(sign); }
  let signText: [string, string, boolean] | null = null;
  function setAreaLabel(text: string | null, fontFamily: string, rtl: boolean) {
    signText = text ? [text, fontFamily, rtl] : null;
    if (!text) { sign.visible = false; dirty = true; return; }
    streetSign(signCanvas.getContext('2d')!, text, fontFamily, rtl);
    signTex.needsUpdate = true; sign.visible = true; dirty = true;
  }
  // painted words wait for the site's fonts
  whenFontsReady(() => { if (signText) setAreaLabel(...signText); dirty = true; });

  // post-processing (desktop): one pass for the tilt-shift blur and the colour, then the output pass
  let composer: EffectComposer | null = null, postPass: ShaderPass | null = null;
  if (post) {
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: q === 'high' ? 4 : 0 });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    postPass = new ShaderPass(PostShader); composer.addPass(postPass);
    composer.addPass(new OutputPass());
  }

  let W = 1, Hh = 1, dirty = true, lastKey = '', lastDraw = 0, lastShadow = -1;
  function resize() {
    const r = canvas.getBoundingClientRect(); W = Math.max(1, r.width); Hh = Math.max(1, r.height);
    renderer.setPixelRatio(pr); renderer.setSize(W, Hh, false);
    if (composer) { composer.setPixelRatio(pr); composer.setSize(W, Hh); }
    camera.aspect = W / Hh; camera.updateProjectionMatrix();
    if (postPass) (postPass.uniforms.res!.value as THREE.Vector2).set(W * pr, Hh * pr);
    dirty = true;
  }
  resize();

  const v3 = new THREE.Vector3(), tan = new THREE.Vector3();
  function setState(s: WorldState) {
    const p = s.pose, now = performance.now(), t = now / 1000;
    // draw only when something changed, plus the slow ambient life (clouds, kites, traffic) at ~24 fps
    const key = [p.tx, p.tz, p.dist, p.az, p.el, p.fov ?? 0, s.hour, s.grey, s.lit, s.u, s.school, s.homePin, s.brake ? 1 : 0].map((v) => v.toFixed(3)).join('|');
    if (!dirty && key === lastKey && now - lastDraw < 42) return;
    const moving = key !== lastKey; lastKey = key; lastDraw = now; dirty = false;
    // camera: orbit around a target
    const cx = p.tx + Math.cos(p.az) * Math.cos(p.el) * p.dist, cz = p.tz + Math.sin(p.az) * Math.cos(p.el) * p.dist, cy = (p.ty ?? 0) + Math.sin(p.el) * p.dist;
    camera.position.set(cx, cy, cz); camera.lookAt(p.tx, p.ty ?? 0, p.tz);
    if (p.fov && Math.abs(camera.fov - p.fov) > 0.01) { camera.fov = p.fov; camera.updateProjectionMatrix(); }
    // light of the hour
    const k = skyAt(s.hour);
    scene.background = k.skyC; (scene.fog as THREE.Fog).color.copy(k.fogC);
    // the haze begins a little beyond what the camera looks at, so far-back views don't wash out
    { const f = scene.fog as THREE.Fog; f.near = Math.max(260, p.dist * 1.05); f.far = Math.max(640, p.dist * 2.4); }
    hemi.color.copy(k.topC); hemi.groundColor.copy(k.botC); hemi.intensity = k.hemiI;
    sun.color.copy(k.sunC); sun.intensity = k.sunI;
    sun.position.set(-10 + Math.cos(k.az) * Math.cos(k.el) * 400, Math.sin(k.el) * 400, -20 + Math.sin(k.az) * Math.cos(k.el) * 400); sun.target.position.set(-10, 0, -20);
    // shadows follow the sun in small steps (each redraw costs a frame, so not on every change of hour)
    const sk = Math.round(s.hour * (q === 'high' ? 24 : 14)); if (sk !== lastShadow) { lastShadow = sk; renderer.shadowMap.needsUpdate = true; }
    const n = k.night;
    city.setNight(n); van.setNight(n);
    for (const c of cloudSprites) { (c.material as THREE.SpriteMaterial).opacity = 0.55 * (1 - n); c.position.x += 0.02; if (c.position.x > 300) c.position.x = -300; }
    // the city's moving parts
    city.tick(t); life.tick(t, s, n, camera); edge.tick(t);
    // the route, drawn as far as lit
    const lit = clamp(s.lit); city.routeGeo.setDrawRange(0, Math.floor(city.routeIdx * lit / 3) * 3); city.routeMesh.visible = lit > 0.002;
    // the van on its route, a gentle sway while moving, brake lights when stopping, glints as it turns
    const u = clamp(s.u, 0, 1);
    city.curve.getPointAt(u, v3); city.curve.getTangentAt(Math.min(0.999, Math.max(0.001, u)), tan);
    van.van.position.set(v3.x, 0, v3.z); van.van.rotation.y = Math.atan2(-tan.z, tan.x);
    van.vanBody.position.y = moving ? Math.sin(t * 9) * 0.04 : 0; van.vanBody.rotation.z = s.brake ? 0.03 : 0;
    van.brakeMat.emissiveIntensity = s.brake ? 2.4 : 0.2 + n;
    van.tick(t, van.van.rotation.y - p.az, n, s.grey);
    city.gateMat.emissiveIntensity = s.school * 1.6;
    const pin = city.pin; pin.visible = s.homePin > 0.01; pin.position.y = 13 + Math.sin(t * 1.6) * 0.6; pin.rotation.y = t * 0.6;
    pin.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined; if (m) m.opacity = s.homePin; });
    // tilt-shift band follows the target's place on screen; colour grade
    const [, fy] = project(p.tx, p.ty ?? 0, p.tz);
    if (postPass && composer) {
      postPass.uniforms.focus!.value = 1 - fy / Hh; postPass.uniforms.grey!.value = clamp(s.grey); postPass.uniforms.night!.value = n;
      composer.render();
    } else renderer.render(scene, camera);
  }
  function project(x: number, y: number, z: number): [number, number, boolean] {
    v3.set(x, y, z).project(camera);
    return [(v3.x * 0.5 + 0.5) * W, (-v3.y * 0.5 + 0.5) * Hh, v3.z < 1];
  }
  function routeAt(u: number): [number, number] { const p = city.curve.getPointAt(clamp(u)); return [p.x, p.z]; }
  // keep the frame rate up: lower the resolution step by step when frames are slow, raise it back when there's room
  let acc = 0, cnt = 0;
  function tune(ms: number) {
    if (ms > 200) return; // a background tab or a pause, not a slow frame
    acc += ms; cnt++;
    if (cnt < 45) return;
    const avg = acc / cnt; acc = 0; cnt = 0;
    const next = avg > 22 ? Math.max(0.6, pr - 0.15) : avg < 12 && pr < prCap ? Math.min(prCap, pr + 0.1) : pr;
    if (Math.abs(next - pr) > 0.01) { pr = next; resize(); }
  }
  function dispose() {
    renderer.dispose(); composer?.dispose(); forgetPainted();
    scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose?.(); const mm = m.material as THREE.Material | THREE.Material[] | undefined; if (Array.isArray(mm)) mm.forEach((x) => x.dispose()); else mm?.dispose?.(); });
  }
  const info = () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles });
  return { quality: q, setState, resize, tune, setAreaLabel, project, dispose, routeAt, info };
}
