// The 3D miniature of Karachi behind the home page (v16). Everything is built in code from simple
// shapes: a few street blocks of clay-like buildings with water tanks and rooftop stair rooms, neem
// trees, a minaret, your home with its kesar door, a roundabout, the school with arches, and the
// school van (neel body, kesar stripe, the star on its roof). The page tells it what to show through
// setState(): the camera, the hour of the day, how much colour (grey before Pohnch), how much of the
// route is lit, and where the van is. A tilt-shift blur makes it look like a model city.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { clamp, lerp } from './hour';

export type Pose = { tx: number; tz: number; dist: number; az: number; el: number; fov?: number; ty?: number };
export type WorldState = {
  pose: Pose;
  hour: number;      // 0 dawn .. 3 night
  grey: number;      // 1 = colour drained (before Pohnch)
  lit: number;       // 0..1 of the route drawn in gilt
  u: number;         // where the van is on its route, 0..1
  brake: boolean;
  school: number;    // 0..1 glow on the school gate
  homePin: number;   // 0..1 how visible the "your home" pin is
};
export type Quality = 'high' | 'mid' | 'low';
export type World = {
  quality: Quality;
  setState: (s: WorldState) => void;
  resize: () => void;
  /** Tell the world how long the last frame took (ms); it lowers or raises its resolution to stay smooth. */
  tune: (frameMs: number) => void;
  /** Show the visitor's area ("Gulshan-e-Iqbal") on a street sign by your home; null hides it. */
  setAreaLabel: (text: string | null, fontFamily: string, rtl: boolean) => void;
  project: (x: number, y: number, z: number) => [number, number, boolean];
  dispose: () => void;
  routeAt: (u: number) => [number, number];
};

/* ---------------- the map (plain data) ---------------- */
export const ROADS_X = [-130, -70, -10, 50, 110];
export const ROADS_Z = [-110, -50, 10, 70];
export const HOME = { x: -52, z: 82 };       // your house, south side of the road z = 70
export const FORK = { x: -10, z: 10, r: 11 }; // the roundabout
export const SCHOOL = { x: 80, z: -78 };     // school, north of the road z = -50
// the van's route: from its first stop, past your home, round the roundabout, to the school gate
export const ROUTE: [number, number][] = [[-150, 70], [-10, 70], [-10, 21], [-21, 10], [-10, -1], [-10, -50], [80, -50], [80, -62]];

function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** The route as a smooth curve (corners rounded) in the ground plane. */
export function routeCurve(): THREE.CurvePath<THREE.Vector3> {
  const path = new THREE.CurvePath<THREE.Vector3>();
  const P = ROUTE.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const R = 7;
  let prev = P[0]!.clone();
  for (let i = 1; i < P.length - 1; i++) {
    const a = P[i - 1]!, b = P[i]!, c = P[i + 1]!;
    const d1 = b.clone().sub(a).normalize(), d2 = c.clone().sub(b).normalize();
    const r = Math.min(R, a.distanceTo(b) / 2, b.distanceTo(c) / 2);
    const p1 = b.clone().addScaledVector(d1, -r), p2 = b.clone().addScaledVector(d2, r);
    path.add(new THREE.LineCurve3(prev, p1));
    path.add(new THREE.QuadraticBezierCurve3(p1, b.clone(), p2));
    prev = p2;
  }
  path.add(new THREE.LineCurve3(prev, P[P.length - 1]!.clone()));
  return path;
}

/** Where on the route (0..1) is nearest to a ground point. */
export function routeU(x: number, z: number, curve = routeCurve()): number {
  let best = 0, bd = Infinity; const v = new THREE.Vector3();
  for (let k = 0; k <= 1000; k++) { curve.getPointAt(k / 1000, v); const d = (v.x - x) ** 2 + (v.z - z) ** 2; if (d < bd) { bd = d; best = k / 1000; } }
  return best;
}

/* ---------------- light and colour through the day ---------------- */
type Sky = { sky: string; fog: string; sun: string; sunI: number; hemiTop: string; hemiBot: string; hemiI: number; el: number; az: number; night: number };
const KEYS: [number, Sky][] = [
  [0, { sky: '#F3D2BC', fog: '#F0D5C2', sun: '#FFBE8E', sunI: 1.7, hemiTop: '#F8DFCC', hemiBot: '#B59A78', hemiI: 1.0, el: 0.26, az: 1.75, night: 0 }],
  [1, { sky: '#EDE3D0', fog: '#EDE3D0', sun: '#FFF4E2', sunI: 2.3, hemiTop: '#FFFFFF', hemiBot: '#C9B48E', hemiI: 1.25, el: 0.95, az: 2.6, night: 0 }],
  [2, { sky: '#EFC08E', fog: '#E9B98C', sun: '#FFB46A', sunI: 2.0, hemiTop: '#FFE2C2', hemiBot: '#A7845E', hemiI: 1.0, el: 0.3, az: 4.2, night: 0.05 }],
  [3, { sky: '#10162F', fog: '#141B3A', sun: '#9DB0EA', sunI: 0.5, hemiTop: '#3D4F92', hemiBot: '#10152E', hemiI: 0.8, el: 0.7, az: 3.6, night: 1 }],
];
const tmpA = new THREE.Color(), tmpB = new THREE.Color();
function mixHex(a: string, b: string, t: number) { return tmpA.set(a).lerp(tmpB.set(b), t).clone(); }
export function skyAt(hour: number): Sky & { skyC: THREE.Color; fogC: THREE.Color; sunC: THREE.Color; topC: THREE.Color; botC: THREE.Color } {
  const h = clamp(hour, 0, 3), i = Math.min(2, Math.floor(h)), t = h - i;
  const A = KEYS[i]![1], B = KEYS[i + 1]![1];
  return {
    ...A,
    sunI: lerp(A.sunI, B.sunI, t), hemiI: lerp(A.hemiI, B.hemiI, t), el: lerp(A.el, B.el, t), az: lerp(A.az, B.az, t), night: lerp(A.night, B.night, t),
    skyC: mixHex(A.sky, B.sky, t), fogC: mixHex(A.fog, B.fog, t), sunC: mixHex(A.sun, B.sun, t), topC: mixHex(A.hemiTop, B.hemiTop, t), botC: mixHex(A.hemiBot, B.hemiBot, t),
  };
}

/* ---------------- the post-processing: tilt-shift + colour (grey) + vignette ---------------- */
const PostShader = {
  uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2(1, 1) }, focus: { value: 0.55 }, band: { value: 0.16 }, amount: { value: 1 }, grey: { value: 0 }, vig: { value: 0.2 }, night: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res; uniform float focus; uniform float band; uniform float amount; uniform float grey; uniform float vig; uniform float night; varying vec2 vUv;
  void main(){
    float d = max(0.0, abs(vUv.y - focus) - band) * 2.4; float r = clamp(d, 0.0, 1.0) * amount * 5.0;
    vec4 c = texture2D(tDiffuse, vUv);
    if (r > 0.35) { vec4 s = c; for (int i = 0; i < 12; i++) { float fi = float(i); float a = fi * 2.39996; float rr = sqrt((fi + 0.5) / 12.0) * r; s += texture2D(tDiffuse, vUv + vec2(cos(a), sin(a)) * rr / res); } c = s / 13.0; }
    float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    vec3 g = mix(c.rgb, vec3(l) * vec3(0.96, 0.98, 1.03), grey * 0.92); g = mix(g, g * 0.92 + vec3(0.03, 0.035, 0.05), grey * 0.5);
    float v = smoothstep(0.95, 0.25, distance(vUv, vec2(0.5))); g *= mix(1.0 - vig - night * 0.15, 1.0, v);
    gl_FragColor = vec4(g, c.a); }`,
};

/* ---------------- building the world ---------------- */
export function createWorld(canvas: HTMLCanvasElement, opts: { quality?: Quality } = {}): World {
  const q: Quality = opts.quality ?? 'high';
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
  const sc = sun.shadow.camera as THREE.OrthographicCamera; sc.left = -240; sc.right = 240; sc.top = 240; sc.bottom = -240; sc.near = 10; sc.far = 900;
  sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.8;
  scene.add(sun); scene.add(sun.target);

  const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, ...extra });
  const rnd = mulberry(11);

  // ground, roads
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), mat('#E3D3B4'));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const roadMat = mat('#F3ECDD');
  const curbMat = mat('#CDBB98');
  const roadW = 12;
  for (const x of ROADS_X) { const m = new THREE.Mesh(new THREE.BoxGeometry(roadW, 0.2, 520), roadMat); m.position.set(x, 0.1, -20); m.receiveShadow = true; scene.add(m); const c = new THREE.Mesh(new THREE.BoxGeometry(roadW + 2.4, 0.12, 520), curbMat); c.position.set(x, 0.06, -20); scene.add(c); }
  for (const z of ROADS_Z) { const m = new THREE.Mesh(new THREE.BoxGeometry(520, 0.21, roadW), roadMat); m.position.set(-10, 0.105, z); m.receiveShadow = true; scene.add(m); const c = new THREE.Mesh(new THREE.BoxGeometry(520, 0.13, roadW + 2.4), curbMat); c.position.set(-10, 0.065, z); scene.add(c); }
  // centre dashes
  { const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(3, 0.05, 0.5), mat('#E2D3B4'), 400); let k = 0; const m4 = new THREE.Matrix4();
    for (const x of ROADS_X) for (let z = -260; z < 220; z += 9) { if (k >= 400) break; m4.makeRotationY(Math.PI / 2).setPosition(x, 0.24, z); dash.setMatrixAt(k++, m4); }
    for (const z of ROADS_Z) for (let x = -270; x < 250 && k < 400; x += 9) { m4.makeTranslation(x, 0.24, z); dash.setMatrixAt(k++, m4); }
    dash.count = k; scene.add(dash); }

  // the roundabout: a ring road around a garden with the Pohnch star
  { const ring = new THREE.Mesh(new THREE.CylinderGeometry(FORK.r + 9, FORK.r + 9, 0.24, 48), roadMat); ring.position.set(FORK.x, 0.12, FORK.z); ring.receiveShadow = true; scene.add(ring);
    const garden = new THREE.Mesh(new THREE.CylinderGeometry(FORK.r, FORK.r + 0.6, 1.1, 40), mat('#AEB98A')); garden.position.set(FORK.x, 0.55, FORK.z); garden.receiveShadow = true; garden.castShadow = true; scene.add(garden);
    const kerb = new THREE.Mesh(new THREE.TorusGeometry(FORK.r + 0.3, 0.45, 8, 48), mat('#F6EFE2')); kerb.rotation.x = Math.PI / 2; kerb.position.set(FORK.x, 1.1, FORK.z); scene.add(kerb); }

  // blocks of buildings (instanced: walls, tanks, stair rooms, windows)
  type B = { x: number; z: number; w: number; d: number; h: number; tone: number };
  const blocks: B[] = [];
  const nearRoad = (x: number, z: number, w: number, d: number) => ROADS_X.some((rx) => Math.abs(x - rx) < w / 2 + roadW / 2 + 2) || ROADS_Z.some((rz) => Math.abs(z - rz) < d / 2 + roadW / 2 + 2);
  for (let i = 0; i < ROADS_X.length + 1; i++) for (let j = 0; j < ROADS_Z.length + 1; j++) {
    const x0 = (ROADS_X[i - 1] ?? ROADS_X[0]! - 60) + roadW / 2 + 3, x1 = (ROADS_X[i] ?? ROADS_X[ROADS_X.length - 1]! + 60) - roadW / 2 - 3;
    const z0 = (ROADS_Z[j - 1] ?? ROADS_Z[0]! - 60) + roadW / 2 + 3, z1 = (ROADS_Z[j] ?? ROADS_Z[ROADS_Z.length - 1]! + 60) - roadW / 2 - 3;
    const park = (i === 1 && j === 1) || (i === 4 && j === 3);
    if (park) continue;
    let x = x0;
    while (x < x1 - 6) {
      const w = 9 + rnd() * 9; let z = z0;
      while (z < z1 - 6) {
        const d = 9 + rnd() * 8; const cx = x + w / 2, cz = z + d / 2;
        const nearHome = Math.hypot(cx - HOME.x, cz - HOME.z) < 24, nearSchool = cx > SCHOOL.x - 30 && cx < SCHOOL.x + 30 && cz < -56 && cz > -106;
        if (x + w < x1 && z + d < z1 && !nearHome && !nearSchool && !nearRoad(cx, cz, w - 1, d - 1) && rnd() > 0.06) {
          const tall = rnd() < 0.12;
          blocks.push({ x: cx, z: cz, w: w - 1.6, d: d - 1.6, h: tall ? 18 + rnd() * 14 : 6 + rnd() * 9, tone: Math.floor(rnd() * 5) });
        }
        z += d + 0.6;
      }
      x += w + 0.6;
    }
  }
  const TONES = ['#ECE1CB', '#E6D6B8', '#F1E9DA', '#E9D3C2', '#DDD8C2'];
  const wallGeo = new RoundedBoxGeometry(1, 1, 1, 2, 0.04);
  const walls = new THREE.InstancedMesh(wallGeo, mat('#ffffff'), blocks.length);
  walls.castShadow = true; walls.receiveShadow = true;
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  blocks.forEach((b, k) => { m4.compose(new THREE.Vector3(b.x, b.h / 2, b.z), new THREE.Quaternion(), new THREE.Vector3(b.w, b.h, b.d)); walls.setMatrixAt(k, m4); walls.setColorAt(k, col.set(TONES[b.tone]!)); });
  scene.add(walls);
  // parapet lip: a slightly bigger, thin slab on top
  const lip = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat('#F6EFE3'), blocks.length);
  blocks.forEach((b, k) => { m4.compose(new THREE.Vector3(b.x, b.h + 0.25, b.z), new THREE.Quaternion(), new THREE.Vector3(b.w + 0.3, 0.5, b.d + 0.3)); lip.setMatrixAt(k, m4); });
  lip.castShadow = true; scene.add(lip);
  // water tanks (black and white drums) and stair rooms ("mumty") on roofs
  const tanksArr: [number, number, number, boolean][] = [], rooms: [number, number, number, number, number][] = [];
  blocks.forEach((b) => {
    const n = 1 + Math.floor(rnd() * 2.2);
    for (let t = 0; t < n; t++) tanksArr.push([b.x + (rnd() - 0.5) * (b.w - 3), b.h + 0.5, b.z + (rnd() - 0.5) * (b.d - 3), rnd() < 0.55]);
    if (rnd() < 0.55) rooms.push([b.x + (rnd() - 0.5) * (b.w - 5), b.h, b.z + (rnd() - 0.5) * (b.d - 5), 3 + rnd() * 2, 2.6]);
  });
  const tankGeo = new THREE.CylinderGeometry(0.95, 0.95, 1.9, 14);
  const tanks = new THREE.InstancedMesh(tankGeo, mat('#ffffff', { roughness: 0.6 }), tanksArr.length);
  tanksArr.forEach(([x, y, z, black], k) => { m4.makeTranslation(x, y + 0.95, z); tanks.setMatrixAt(k, m4); tanks.setColorAt(k, col.set(black ? '#2B3048' : '#F4F1EA')); });
  tanks.castShadow = true; scene.add(tanks);
  const roomM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat('#E8DCC5'), rooms.length);
  rooms.forEach(([x, y, z, w, h], k) => { m4.compose(new THREE.Vector3(x, y + h / 2, z), new THREE.Quaternion(), new THREE.Vector3(w, h, w * 0.9)); roomM.setMatrixAt(k, m4); });
  roomM.castShadow = true; scene.add(roomM);
  // windows on the two faces the camera sees most (south and east), lit warmly at night
  const wins: [number, number, number, number][] = [];
  blocks.forEach((b) => {
    const floors = Math.max(1, Math.floor((b.h - 1.5) / 3.2));
    for (let f = 0; f < floors; f++) {
      const y = 2.2 + f * 3.2;
      for (let c = 0; c < Math.floor(b.w / 3.2); c++) wins.push([b.x - b.w / 2 + 1.8 + c * 3.2, y, b.z + b.d / 2 + 0.06, 0]);
      for (let c = 0; c < Math.floor(b.d / 3.2); c++) wins.push([b.x + b.w / 2 + 0.06, y, b.z - b.d / 2 + 1.8 + c * 3.2, 1]);
    }
  });
  const winMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const winM = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.3, 1.6), winMat, wins.length);
  const winOn: boolean[] = [];
  wins.forEach(([x, y, z, side], k) => { const q4 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), side ? Math.PI / 2 : 0); m4.compose(new THREE.Vector3(x, y, z), q4, new THREE.Vector3(1, 1, 1)); winM.setMatrixAt(k, m4); winOn.push(rnd() < 0.55); winM.setColorAt(k, col.set('#5C6584')); });
  scene.add(winM);

  // trees (neem): trunk + two canopy balls
  const trees: [number, number, number][] = [];
  for (let k = 0; k < 140; k++) { const x = -200 + rnd() * 400, z = -170 + rnd() * 300; if (!nearRoad(x, z, 2, 2) && !blocks.some((b) => Math.abs(b.x - x) < b.w / 2 + 2 && Math.abs(b.z - z) < b.d / 2 + 2) && Math.hypot(x - HOME.x, z - HOME.z) > 9) trees.push([x, z, 1.7 + rnd() * 1.6]); }
  // street trees along the route
  for (let x = -140; x < -15; x += 15) trees.push([x, 78.5, 2]);
  for (let z = -40; z < 0; z += 12) trees.push([-1.5, z, 1.8]);
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.35, 3, 6), mat('#8C7552'), trees.length);
  const canopy = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), mat('#A2AE7C', { flatShading: true }), trees.length * 2);
  trees.forEach(([x, z, s], k) => {
    m4.makeTranslation(x, 1.5, z); trunk.setMatrixAt(k, m4);
    m4.compose(new THREE.Vector3(x, 3.6 * s / 1.8, z), new THREE.Quaternion(), new THREE.Vector3(s * 1.3, s * 1.1, s * 1.3)); canopy.setMatrixAt(k * 2, m4); canopy.setColorAt(k * 2, col.set(k % 3 ? '#A2AE7C' : '#93A06E'));
    m4.compose(new THREE.Vector3(x + s * 0.6, 3.2 * s / 1.8, z + s * 0.3), new THREE.Quaternion(), new THREE.Vector3(s * 0.9, s * 0.8, s * 0.9)); canopy.setMatrixAt(k * 2 + 1, m4); canopy.setColorAt(k * 2 + 1, col.set('#B0BA88'));
  });
  trunk.castShadow = true; canopy.castShadow = true; canopy.receiveShadow = true; scene.add(trunk, canopy);
  // parks: grass slabs
  for (const [x, z, w, d] of [[-100, -20, 46, 46], [140, 95, 46, 40]] as const) { const p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), mat('#B8C192')); p.position.set(x, 0.15, z); p.receiveShadow = true; scene.add(p); }

  // a mosque: dome + minaret, by the park
  { const g = new THREE.Group(); const white = mat('#F5F0E6');
    const base = new THREE.Mesh(new RoundedBoxGeometry(16, 7, 14, 2, 0.3), white); base.position.y = 3.5; g.add(base);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#DCE6E2')); dome.position.y = 7; g.add(dome);
    const min = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.25, 22, 12), white); min.position.set(7, 11, -5); g.add(min);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3, 12), mat('#DCE6E2')); cap.position.set(7, 23.5, -5); g.add(cap);
    const bal = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.6, 12), white); bal.position.set(7, 17, -5); g.add(bal);
    g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.position.set(-100, 0, -20); scene.add(g); }

  // your home: a two-storey house with a kesar door and a gate, plus a floating "home" pin
  const home = new THREE.Group();
  { const body = new THREE.Mesh(new RoundedBoxGeometry(14, 9, 11, 2, 0.25), mat('#F4ECDD')); body.position.y = 4.5; home.add(body);
    const lipH = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.6, 11.4), mat('#FBF7EF')); lipH.position.y = 9.2; home.add(lipH);
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.6, 4, 0.3), mat('#E8A33D')); door.position.set(0, 2, -5.6); home.add(door);
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.3, 16, 1, false, 0, Math.PI), mat('#E8A33D')); arch.rotation.set(Math.PI / 2, 0, Math.PI / 2); arch.position.set(0, 4, -5.6); home.add(arch);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(18, 1.6, 0.6), mat('#E9DDC6')); wall.position.set(0, 0.8, -7.4); home.add(wall);
    const tank = new THREE.Mesh(tankGeo, mat('#2B3048', { roughness: 0.6 })); tank.position.set(4, 10.4, 2); home.add(tank);
    const lawn = new THREE.Mesh(new THREE.BoxGeometry(22, 0.35, 20), mat('#BCC596')); lawn.position.set(0, 0.17, 1.5); home.add(lawn);
    const bou = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 1), mat('#C46A8A', { flatShading: true })); bou.position.set(-8, 2.4, -6.5); home.add(bou);
    home.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    home.position.set(HOME.x, 0, HOME.z); scene.add(home); }
  const pin = new THREE.Group();
  { const pm = new THREE.MeshStandardMaterial({ color: '#17705A', roughness: 0.5, emissive: '#17705A', emissiveIntensity: 0.15, transparent: true });
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 14), pm); head.position.y = 2.4; pin.add(head);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.4, 16), pm); tip.rotation.x = Math.PI; tip.position.y = 0.6; pin.add(tip);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true })); dot.position.set(0, 2.5, -1.4); pin.add(dot);
    pin.position.set(HOME.x, 13, HOME.z); scene.add(pin); }

  // the school: a long building with arches, a courtyard wall and a gate that glows on arrival
  const gateMat = new THREE.MeshStandardMaterial({ color: '#E8A33D', roughness: 0.5, emissive: '#E8A33D', emissiveIntensity: 0 });
  { const g = new THREE.Group(); const cream = mat('#F2E7D2');
    const main = new THREE.Mesh(new RoundedBoxGeometry(46, 13, 18, 2, 0.4), cream); main.position.set(0, 6.5, -10); g.add(main);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(47, 0.8, 19), mat('#FBF6EC')); roof.position.set(0, 13.3, -10); g.add(roof);
    for (let k = 0; k < 7; k++) { const a = new THREE.Mesh(new THREE.BoxGeometry(3.4, 5, 0.4), mat('#B5865A')); a.position.set(-18 + k * 6, 3.2, -0.9); g.add(a);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.4, 16, 1, false, 0, Math.PI), mat('#B5865A')); top.rotation.set(Math.PI / 2, 0, Math.PI / 2); top.position.set(-18 + k * 6, 5.7, -0.9); g.add(top); }
    for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(18, 2.2, 0.8), cream); w.position.set(sx * 14, 1.1, 6); g.add(w); }
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5, 1.4), cream); pillarL.position.set(-4.5, 2.5, 6); g.add(pillarL);
    const pillarR = pillarL.clone(); pillarR.position.x = 4.5; g.add(pillarR);
    const gate = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.45, 8, 24, Math.PI), gateMat); gate.position.set(0, 5, 6); g.add(gate);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 12, 6), mat('#9A9AA0')); pole.position.set(16, 19, -6); g.add(pole);
    g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.position.set(SCHOOL.x, 0, SCHOOL.z); scene.add(g); }

  // street lamps along the route: posts + glowing heads at night
  const lampPts: [number, number][] = [];
  for (let x = -140; x < -15; x += 22) lampPts.push([x, 63.5]);
  for (let z = -45; z < 60; z += 22) lampPts.push([-3.5, z]);
  for (let x = 0; x < 80; x += 22) lampPts.push([x, -56.5]);
  const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 0.2, 6, 6), mat('#4A4E62'), lampPts.length);
  const headMat = new THREE.MeshStandardMaterial({ color: '#FFF1D0', emissive: '#FFC56E', emissiveIntensity: 0 });
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 10, 8), headMat, lampPts.length);
  lampPts.forEach(([x, z], k) => { m4.makeTranslation(x, 3, z); posts.setMatrixAt(k, m4); m4.makeTranslation(x, 6.2, z); heads.setMatrixAt(k, m4); });
  posts.castShadow = true; scene.add(posts, heads);
  // soft glow pools under lamps (additive sprites on the road)
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!; const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,214,150,1)'); gr.addColorStop(1, 'rgba(255,214,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const poolMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(14, 14), poolMat, lampPts.length);
  lampPts.forEach(([x, z], k) => { m4.compose(new THREE.Vector3(x, 0.32, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2), new THREE.Vector3(1, 1, 1)); pools.setMatrixAt(k, m4); });
  scene.add(pools);

  // the route: a gilt ribbon on the road, drawn as far as `lit`, glowing at night
  const curve = routeCurve();
  const routeGeo = new THREE.TubeGeometry(curve as unknown as THREE.Curve<THREE.Vector3>, 400, 0.9, 6, false);
  routeGeo.scale(1, 0.25, 1); routeGeo.translate(0, 0.4, 0);
  const routeMat = new THREE.MeshStandardMaterial({ color: '#C8923A', roughness: 0.45, metalness: 0.2, emissive: '#E8A33D', emissiveIntensity: 0.1 });
  const routeMesh = new THREE.Mesh(routeGeo, routeMat); scene.add(routeMesh);
  const routeIdx = routeGeo.index!.count;
  // a faint dotted trace of the whole route (always there)
  const trace = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 8), mat('#C9B48E'), 200);
  for (let k = 0; k < 200; k++) { const p = curve.getPointAt(k / 199); m4.makeTranslation(p.x, 0.28, p.z); trace.setMatrixAt(k, m4); }
  scene.add(trace);

  // the school van
  const van = new THREE.Group(), vanBody = new THREE.Group();
  const brakeMat = new THREE.MeshStandardMaterial({ color: '#B83A2A', emissive: '#FF5A3C', emissiveIntensity: 0.2 });
  const headMatV = new THREE.MeshStandardMaterial({ color: '#FFF6E0', emissive: '#FFE9B0', emissiveIntensity: 0.2 });
  { const neel = new THREE.MeshStandardMaterial({ color: '#1F2A5C', roughness: 0.38, metalness: 0.15 });
    const glass = new THREE.MeshStandardMaterial({ color: '#25304F', roughness: 0.15, metalness: 0.4 });
    const body = new THREE.Mesh(new RoundedBoxGeometry(10, 3.6, 4.4, 4, 0.9), neel); body.position.y = 2.6; vanBody.add(body);
    const cabin = new THREE.Mesh(new RoundedBoxGeometry(8.2, 2.2, 4.5, 4, 0.7), glass); cabin.position.set(-0.4, 4.2, 0); vanBody.add(cabin);
    const roof = new THREE.Mesh(new RoundedBoxGeometry(8.4, 0.6, 4.3, 3, 0.25), neel); roof.position.set(-0.4, 5.35, 0); vanBody.add(roof);
    for (const s of [-1, 1]) { const stripe = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.5, 0.06), mat('#E8A33D', { roughness: 0.5 })); stripe.position.set(0, 2.8, s * 2.22); vanBody.add(stripe);
      for (let k = 0; k < 3; k++) { const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.1, 0.06), neel); pillar.position.set(-3.2 + k * 2.4, 4.2, s * 2.27); vanBody.add(pillar); } }
    // the star on the roof
    const sh = new THREE.Shape(); for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, r = k % 2 ? 0.75 : 1.5; const px = Math.cos(a) * r, py = Math.sin(a) * r; if (k) sh.lineTo(px, py); else sh.moveTo(px, py); }
    const star = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.25, bevelEnabled: false }), mat('#E8A33D', { roughness: 0.4, emissive: '#E8A33D', emissiveIntensity: 0.15 })); star.rotation.x = -Math.PI / 2; star.position.set(-0.4, 5.66, 0); vanBody.add(star);
    for (const s of [-1, 1]) { const hl = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.9), headMatV); hl.position.set(5.02, 2.3, s * 1.5); vanBody.add(hl); const bl = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 0.6), brakeMat); bl.position.set(-5.02, 2.6, s * 1.6); vanBody.add(bl); }
    const bumper = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.6, 4.4, 2, 0.2), mat('#2A2F45')); bumper.position.set(5.1, 1.2, 0); vanBody.add(bumper);
    // a soft blob shadow instead of a real one, so the city's shadow map never needs redrawing for the van
    const wheel = new THREE.CylinderGeometry(0.95, 0.95, 0.7, 16); const tyre = mat('#1E2130', { roughness: 0.8 });
    for (const [x, z] of [[3.2, 2.05], [3.2, -2.05], [-3.2, 2.05], [-3.2, -2.05]] as const) { const w = new THREE.Mesh(wheel, tyre); w.rotation.x = Math.PI / 2; w.position.set(x, 0.95, z); van.add(w); }
    van.add(vanBody); scene.add(van); }
  { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!; const gr = g.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(16,22,47,.55)'); gr.addColorStop(1, 'rgba(16,22,47,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(15, 9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.set(1.2, 0.36, 1.2); van.add(blob); }
  // headlight beams at night (additive cone on the ground)
  const beamMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(22, 12), beamMat); beam.rotation.x = -Math.PI / 2; beam.position.set(14, 0.35, 0); van.add(beam);

  // soft clouds high above (sprites), drifting slowly
  const cloudTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!; for (let k = 0; k < 6; k++) { const x = 30 + k * 14, y = 64 + Math.sin(k * 2) * 10, r = 26 + (k % 3) * 8; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } return new THREE.CanvasTexture(c); })();
  const clouds: THREE.Sprite[] = [];
  for (let k = 0; k < 9; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: 0.55 })); s.scale.set(90 + rnd() * 60, 45, 1); s.position.set(-260 + rnd() * 520, 70 + rnd() * 30, -200 + rnd() * 320); scene.add(s); clouds.push(s); }

  /* ---------------- the street sign with your area (v17) ---------------- */
  const signCanvas = document.createElement('canvas'); signCanvas.width = 512; signCanvas.height = 150;
  const signTex = new THREE.CanvasTexture(signCanvas); signTex.colorSpace = THREE.SRGBColorSpace; signTex.anisotropy = 4;
  const sign = new THREE.Group();
  { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 7, 8), mat('#5A5F70')); post.position.y = 3.5; sign.add(post);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(11, 3.2), new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide }));
    board.position.y = 7.6; sign.add(board);
    sign.position.set(HOME.x + 16, 0, HOME.z - 5); sign.visible = false; scene.add(sign); }
  function setAreaLabel(text: string | null, fontFamily: string, rtl: boolean) {
    if (!text) { sign.visible = false; dirty = true; return; }
    const g = signCanvas.getContext('2d')!;
    g.clearRect(0, 0, 512, 150);
    g.fillStyle = '#17705A'; g.beginPath(); g.roundRect(4, 4, 504, 142, 16); g.fill();
    g.strokeStyle = '#F5EEE1'; g.lineWidth = 5; g.beginPath(); g.roundRect(14, 14, 484, 122, 10); g.stroke();
    g.fillStyle = '#F5EEE1'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = rtl ? 'rtl' : 'ltr';
    let size = rtl ? 70 : 64; do { g.font = `700 ${size}px ${fontFamily}`; size -= 4; } while (g.measureText(text).width > 440 && size > 26);
    g.fillText(text, 256, rtl ? 80 : 77);
    signTex.needsUpdate = true; sign.visible = true; dirty = true;
  }

  /* ---------------- Karachi life (v17): kites, a chai stall, rickshaws and cars, children, crows ---------------- */
  const life = mulberry(29);
  // kites high above the rooftops, on thin strings to a roof (all kites one draw, all tails one, all strings one)
  const KITE_COLS = ['#E8A33D', '#C2453A', '#17705A', '#2F6FB5', '#B04B8C', '#F2C14E', '#1F2A5C'];
  const KITE_N = KITE_COLS.length;
  const KITE_AT: [number, number][] = [[HOME.x - 18, HOME.z - 22], [HOME.x + 26, HOME.z - 30], [FORK.x - 70, FORK.z + 40], [FORK.x + 60, FORK.z - 70], [SCHOOL.x - 30, SCHOOL.z + 26], [SCHOOL.x + 14, SCHOOL.z + 8], [20, 40]];
  const kites: { x: number; z: number; h: number; ph: number }[] = [];
  const kiteGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 2.4, 0), new THREE.Vector3(1.7, 0, 0), new THREE.Vector3(0, -2.6, 0), new THREE.Vector3(-1.7, 0, 0)]);
  kiteGeo.setIndex([0, 1, 2, 0, 2, 3]); kiteGeo.computeVertexNormals();
  const kiteMesh = new THREE.InstancedMesh(kiteGeo, new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide }), KITE_N);
  const tailGeo = new THREE.PlaneGeometry(0.25, 2.2); tailGeo.translate(0, -3.6, 0);
  const tailMesh = new THREE.InstancedMesh(tailGeo, new THREE.MeshBasicMaterial({ color: '#F5EEE1', side: THREE.DoubleSide }), KITE_N);
  const stringPos = new Float32Array(KITE_N * 6);
  const strings = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#6E6450', transparent: true, opacity: 0.45 }));
  strings.geometry.setAttribute('position', new THREE.BufferAttribute(stringPos, 3));
  for (let k = 0; k < KITE_N; k++) {
    kiteMesh.setColorAt(k, col.set(KITE_COLS[k]!));
    // flown near the places the camera visits (home, the route, the roundabout, school), so they are in view
    const [ax, az] = KITE_AT[k]!; const x = ax + (life() - 0.5) * 16, z = az + (life() - 0.5) * 16, h = 26 + life() * 12;
    const b = blocks[Math.floor(life() * blocks.length)]!;
    stringPos.set([b.x, b.h + 1, b.z, x, h, z], k * 6);
    kites.push({ x, z, h, ph: life() * 6.28 });
  }
  for (const m of [kiteMesh, tailMesh, strings]) { m.frustumCulled = false; scene.add(m); }
  const kq = new THREE.Quaternion(), ke = new THREE.Euler(), kv = new THREE.Vector3(), ks = new THREE.Vector3(1.8, 1.8, 1.8), km = new THREE.Matrix4();
  function moveKites(t: number) {
    kites.forEach((kt, k) => {
      const sway = Math.sin(t * 0.9 + kt.ph);
      kv.set(kt.x + sway * 4, kt.h + Math.cos(t * 1.3 + kt.ph) * 2, kt.z + Math.sin(t * 0.6 + kt.ph) * 3);
      kq.setFromEuler(ke.set(0, Math.atan2(camera.position.x - kt.x, camera.position.z - kt.z), sway * 0.35));
      // a kite close to the camera shrinks away, so none ever fills the screen
      ks.setScalar(1.8 * clamp((camera.position.distanceTo(kv) - 70) / 90));
      km.compose(kv, kq, ks); kiteMesh.setMatrixAt(k, km); tailMesh.setMatrixAt(k, km);
      stringPos[k * 6 + 3] = kv.x; stringPos[k * 6 + 4] = kv.y - 4.7; stringPos[k * 6 + 5] = kv.z;
    });
    kiteMesh.instanceMatrix.needsUpdate = true; tailMesh.instanceMatrix.needsUpdate = true; strings.geometry.attributes.position!.needsUpdate = true;
  }
  // a chai stall by the roundabout: a cart, a striped awning, a kettle with a curl of steam
  const steam: THREE.Sprite[] = [];
  if (q !== 'low') {
    const g = new THREE.Group();
    const cart = new THREE.Mesh(new RoundedBoxGeometry(5, 2.4, 3, 2, 0.3), mat('#B5865A')); cart.position.y = 1.6; g.add(cart);
    const stripe = document.createElement('canvas'); stripe.width = 64; stripe.height = 8; const sg = stripe.getContext('2d')!;
    for (let k = 0; k < 8; k++) { sg.fillStyle = k % 2 ? '#F5EEE1' : '#C2453A'; sg.fillRect(k * 8, 0, 8, 8); }
    const awn = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.3, 4.2), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(stripe), roughness: 0.8 })); awn.position.y = 5.2; awn.rotation.z = 0.08; g.add(awn);
    for (const sx of [-2.8, 2.8]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3, 6), mat('#4A4E62')); pole.position.set(sx, 3.9, 1.6); g.add(pole); }
    const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.8, 10), mat('#C9CCD3', { metalness: 0.5, roughness: 0.35 })); kettle.position.set(1.2, 3.2, 0); g.add(kettle);
    for (let k = 0; k < 2; k++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 8), mat('#8C7552')); st.position.set(-1 - k * 1.6, 0.6, 3); g.add(st); }
    g.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
    g.position.set(FORK.x + 24, 0, FORK.z - 14); g.rotation.y = 0.3; scene.add(g);
    for (let k = 0; k < 3; k++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: 0.5 })); sp.scale.set(1.6, 1.6, 1); scene.add(sp); steam.push(sp); }
  }
  // rickshaws (green and yellow) and small cars, driving back and forth on roads the van doesn't use
  const LANES: [number, number, number, number][] = [[110, -200, 110, 150], [-250, -110, 250, -110], [-70, -200, -70, 40], [30, 10, 250, 10]];
  const traffic: { lane: number; off: number; speed: number; ph: number; car: boolean }[] = [];
  for (let k = 0; k < 12; k++) traffic.push({ lane: k % 4, off: (k % 2 ? 2.8 : -2.8), speed: 0.018 + life() * 0.02, ph: life(), car: k >= 6 });
  const rickBody = new THREE.InstancedMesh(new RoundedBoxGeometry(4, 2.6, 2.6, 2, 0.5), mat('#2E8B57'), 6);
  const rickRoof = new THREE.InstancedMesh(new RoundedBoxGeometry(3.6, 0.5, 2.8, 2, 0.2), mat('#F2C14E'), 6);
  const carBody = new THREE.InstancedMesh(new RoundedBoxGeometry(5.6, 1.5, 2.6, 2, 0.4), mat('#ffffff', { roughness: 0.5 }), 6);
  const carTop = new THREE.InstancedMesh(new RoundedBoxGeometry(3, 1.1, 2.3, 2, 0.35), mat('#2A3150', { roughness: 0.3 }), 6);
  const CAR_COLS = ['#D9D4C7', '#9E2A1F', '#4A6FA5', '#E8E2D4', '#3A3D52', '#B8862F'];
  CAR_COLS.forEach((c, k) => carBody.setColorAt(k, col.set(c)));
  for (const m of [rickBody, rickRoof, carBody, carTop]) { m.castShadow = q !== 'low'; scene.add(m); }
  const tq = new THREE.Quaternion(), tv = new THREE.Vector3(), ts3 = new THREE.Vector3(1, 1, 1), yAxis = new THREE.Vector3(0, 1, 0);
  function moveTraffic(t: number) {
    let r = 0, c = 0;
    for (const v of traffic) {
      const [x0, z0, x1, z1] = LANES[v.lane]!; const k = (Math.sin((t * v.speed + v.ph) * Math.PI * 2) + 1) / 2;
      const dir = Math.cos((t * v.speed + v.ph) * Math.PI * 2) >= 0 ? 1 : -1;
      const horiz = z0 === z1, x = x0 + (x1 - x0) * k + (horiz ? 0 : v.off), z = z0 + (z1 - z0) * k + (horiz ? v.off : 0);
      tq.setFromAxisAngle(yAxis, horiz ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? -Math.PI / 2 : Math.PI / 2));
      if (!v.car) { tv.set(x, 2.1, z); m4.compose(tv, tq, ts3); rickBody.setMatrixAt(r, m4); tv.set(x, 3.6, z); m4.compose(tv, tq, ts3); rickRoof.setMatrixAt(r, m4); r++; }
      else { tv.set(x, 1.5, z); m4.compose(tv, tq, ts3); carBody.setMatrixAt(c, m4); tv.set(x - 0.2, 2.7, z); m4.compose(tv, tq, ts3); carTop.setMatrixAt(c, m4); c++; }
    }
    for (const m of [rickBody, rickRoof, carBody, carTop]) m.instanceMatrix.needsUpdate = true;
  }
  // children at the school gate: small rounded figures with backpacks, walking in as the van arrives
  const KIDS = 10;
  const kidBody = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.75, 1.5, 4, 8), mat('#F5F1E6'), KIDS);
  const kidHead = new THREE.InstancedMesh(new THREE.SphereGeometry(0.6, 10, 8), mat('#8C6A4F'), KIDS);
  const kidBag = new THREE.InstancedMesh(new RoundedBoxGeometry(1.1, 1.2, 0.6, 2, 0.2), mat('#ffffff'), KIDS);
  const BAGS = ['#C2453A', '#2F6FB5', '#E8A33D', '#17705A', '#B04B8C'];
  const kidSpots = Array.from({ length: KIDS }, (_, k) => ({ x: SCHOOL.x - 7 + (k % 5) * 3.4 + life(), z: SCHOOL.z + 13 + Math.floor(k / 5) * 3 + life(), d: life() * 0.35 }));
  kidSpots.forEach((_, k) => kidBag.setColorAt(k, col.set(BAGS[k % BAGS.length]!)));
  for (const m of [kidBody, kidHead, kidBag]) { m.castShadow = q !== 'low'; scene.add(m); }
  function moveKids(school: number, t: number) {
    const on = school > 0.02; kidBody.visible = kidHead.visible = kidBag.visible = on; if (!on) return;
    kidSpots.forEach((p, k) => {
      const w2 = clamp((school - p.d) / 0.65), x = p.x + (SCHOOL.x - p.x) * w2 * 0.6, z = p.z - w2 * 18, bob = Math.abs(Math.sin(t * 6 + k)) * 0.25 * (w2 > 0 && w2 < 1 ? 1 : 0);
      const fade = w2 >= 1 ? 0 : 1;
      tv.set(x, 1.5 + bob, z); m4.compose(tv, tq.identity(), ts3.setScalar(fade)); kidBody.setMatrixAt(k, m4);
      tv.set(x, 3.3 + bob, z); m4.compose(tv, tq, ts3); kidHead.setMatrixAt(k, m4);
      tv.set(x, 2.2 + bob, z + 0.75); m4.compose(tv, tq, ts3); kidBag.setMatrixAt(k, m4);
      ts3.set(1, 1, 1);
    });
    for (const m of [kidBody, kidHead, kidBag]) m.instanceMatrix.needsUpdate = true;
  }
  // crows sitting on water tanks; one at a time hops to the next tank (bodies, heads and wings: three draws)
  const crowMat = new THREE.MeshStandardMaterial({ color: '#1B1E2B', roughness: 0.7 });
  const crowSpots = q === 'low' ? [] : tanksArr.filter((_, k) => k % 9 === 0).slice(0, 7).map(([x, y, z]) => new THREE.Vector3(x, y + 2.1, z));
  const CN = Math.max(1, crowSpots.length);
  const crowBodyGeo = new THREE.SphereGeometry(0.5, 8, 6); crowBodyGeo.scale(1.5, 0.9, 0.9);
  const crowHeadGeo = new THREE.SphereGeometry(0.32, 8, 6); crowHeadGeo.translate(0.7, 0.35, 0);
  const wingGeo = new THREE.PlaneGeometry(1.4, 0.6); wingGeo.rotateX(Math.PI / 2);
  const crowBody = new THREE.InstancedMesh(crowBodyGeo, crowMat, CN), crowHead = new THREE.InstancedMesh(crowHeadGeo, crowMat, CN), crowWing = new THREE.InstancedMesh(wingGeo, crowMat, CN * 2);
  for (const m of [crowBody, crowHead, crowWing]) { m.visible = crowSpots.length > 0; m.frustumCulled = false; scene.add(m); }
  const cp = new THREE.Vector3(), cq = new THREE.Quaternion(), wq = new THREE.Quaternion(), xAxis = new THREE.Vector3(1, 0, 0), one = new THREE.Vector3(1, 1, 1), cm = new THREE.Matrix4(), wm = new THREE.Matrix4(), wo = new THREE.Vector3();
  function moveCrows(t: number) {
    if (!crowSpots.length) return;
    const cyc = 6, i = Math.floor(t / cyc) % crowSpots.length, k = (t % cyc) / cyc;
    crowSpots.forEach((home, j) => {
      let flap = 0;
      if (j === i && k < 0.35 && crowSpots.length > 1) {
        const to = crowSpots[(j + 1) % crowSpots.length]!, f = k / 0.35;
        cp.lerpVectors(home, to, f); cp.y += Math.sin(Math.PI * f) * 14; flap = Math.sin(t * 22) * 0.9;
      } else cp.copy(home);
      cm.compose(cp, cq, one); crowBody.setMatrixAt(j, cm); crowHead.setMatrixAt(j, cm);
      for (const sz of [-1, 1]) {
        wq.setFromAxisAngle(xAxis, flap * sz); wo.set(cp.x - 0.1, cp.y + 0.25, cp.z + sz * 0.5);
        wm.compose(wo, wq, one); crowWing.setMatrixAt(j * 2 + (sz > 0 ? 1 : 0), wm);
      }
    });
    for (const m of [crowBody, crowHead, crowWing]) m.instanceMatrix.needsUpdate = true;
  }

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
  if (!post) { renderer.toneMapping = THREE.ACESFilmicToneMapping; }
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
  let lastNight = -1;
  function setState(s: WorldState) {
    const p = s.pose, now = performance.now(), t = now / 1000;
    // draw only when something changed, plus the slow ambient life (clouds, the home pin) at ~24 fps
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
    hemi.color.copy(k.topC); hemi.groundColor.copy(k.botC); hemi.intensity = k.hemiI;
    sun.color.copy(k.sunC); sun.intensity = k.sunI;
    sun.position.set(-10 + Math.cos(k.az) * Math.cos(k.el) * 400, Math.sin(k.el) * 400, -20 + Math.sin(k.az) * Math.cos(k.el) * 400); sun.target.position.set(-10, 0, -20);
    const sk = Math.round(s.hour * 40); if (sk !== lastShadow) { lastShadow = sk; renderer.shadowMap.needsUpdate = true; }
    const n = k.night;
    if (Math.abs(n - lastNight) > 0.002) {
      lastNight = n;
      const dayW = new THREE.Color('#58617F'), nightOff = new THREE.Color('#1A2142'), lit = new THREE.Color('#FFCF7E');
      winOn.forEach((on, i) => winM.setColorAt(i, col.copy(dayW).lerp(on ? lit : nightOff, n)));
      if (winM.instanceColor) winM.instanceColor.needsUpdate = true;
      headMat.emissiveIntensity = 2.2 * n; poolMat.opacity = 0.55 * n; beamMat.opacity = 0.5 * n;
      headMatV.emissiveIntensity = 0.2 + 2 * n;
      for (const c of clouds) (c.material as THREE.SpriteMaterial).opacity = 0.55 * (1 - n);
    }
    routeMat.emissiveIntensity = 0.1 + 1.1 * n;
    // Karachi life
    moveKites(t);
    steam.forEach((sp, k) => { const f = ((t * 0.5 + k / 3) % 1); sp.position.set(FORK.x + 25.2 + Math.sin(t + k) * 0.5, 4 + f * 5, FORK.z - 13.6); (sp.material as THREE.SpriteMaterial).opacity = 0.45 * (1 - f) * (1 - n * 0.5); sp.scale.setScalar(1.2 + f * 2); });
    moveTraffic(t); moveKids(s.school, t); moveCrows(t);
    // the route, drawn as far as lit
    const lit = clamp(s.lit); routeGeo.setDrawRange(0, Math.floor(routeIdx * lit / 3) * 3); routeMesh.visible = lit > 0.002;
    // the van on its route, a gentle sway while moving, brake lights when stopping
    const u = clamp(s.u, 0, 1);
    curve.getPointAt(u, v3); curve.getTangentAt(Math.min(0.999, Math.max(0.001, u)), tan);
    van.position.set(v3.x, 0, v3.z); van.rotation.y = Math.atan2(-tan.z, tan.x);
    vanBody.position.y = moving ? Math.sin(t * 9) * 0.04 : 0; vanBody.rotation.z = s.brake ? 0.03 : 0;
    brakeMat.emissiveIntensity = s.brake ? 2.4 : 0.2 + n;
    gateMat.emissiveIntensity = 0.0 + s.school * 1.6;
    pin.visible = s.homePin > 0.01; pin.position.y = 13 + Math.sin(t * 1.6) * 0.6; pin.rotation.y = t * 0.6;
    pin.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined; if (m) m.opacity = s.homePin; });
    for (const c of clouds) { c.position.x += 0.02; if (c.position.x > 300) c.position.x = -300; }
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
  function routeAt(u: number): [number, number] { const p = curve.getPointAt(clamp(u)); return [p.x, p.z]; }
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
    renderer.dispose(); composer?.dispose();
    scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose?.(); const mm = m.material as THREE.Material | THREE.Material[] | undefined; if (Array.isArray(mm)) mm.forEach((x) => x.dispose()); else mm?.dispose?.(); });
  }
  return { quality: q, setState, resize, tune, setAreaLabel, project, dispose, routeAt };
}
