// The city (v18): ground and roads (painted kerbs, zebra crossings, a speed bump), the roundabout,
// street blocks of Karachi apartments (balconies with laundry, sunshades, AC units, shop shutters
// with painted signs, water tanks, stair rooms, dish antennas, bougainvillea, rooftop boards with
// Pohnch's lines), neem trees and palms, parks, the mosque, your home, the school, street lamps and
// the van's route. Almost everything is instanced, so thousands of small things cost a few draws.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { atlasMat, bake, cellAttr, mat, merge, paint, vcMat } from './kit';
import { FORK, HOME, ROADS_X, ROADS_Z, ROAD_W, SCHOOL, SHORE_Z, mulberry, nearRoad, routeCurve } from './map';
import { SHUTTER0, SIGN_COLS, SIGN_ROWS, TRUCK, boardTex, radial, signSheetTex, type WorldWords } from './textures';
import type { Quality } from './types';

export type Block = { x: number; z: number; w: number; d: number; h: number; tone: number };
export type City = ReturnType<typeof buildCity>;

const Y = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);
const ONE = new THREE.Vector3(1, 1, 1);

export function buildCity(scene: THREE.Scene, q: Quality, words: WorldWords) {
  const rnd = mulberry(11);   // the v16/v17 layout (blocks, tanks, windows, trees) stays exactly where it was
  const dr = mulberry(41);    // v18 details use their own numbers
  const m4 = new THREE.Matrix4(), col = new THREE.Color(), v = new THREE.Vector3(), qt = new THREE.Quaternion(), sc = new THREE.Vector3();
  const place = (mesh: THREE.InstancedMesh, k: number, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, ry = 0) => {
    qt.setFromAxisAngle(Y, ry); m4.compose(v.set(x, y, z), qt, sc.set(sx, sy, sz)); mesh.setMatrixAt(k, m4);
  };
  const rich = q !== 'low';

  /* ---------- ground, roads ---------- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), mat('#E3D3B4'));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const roadMat = mat('#F3ECDD'), curbMat = mat('#CDBB98');
  for (const x of ROADS_X) { const m = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W, 0.2, 520), roadMat); m.position.set(x, 0.1, -20); m.receiveShadow = true; scene.add(m); const c = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W + 2.4, 0.12, 520), curbMat); c.position.set(x, 0.06, -20); scene.add(c); }
  for (const z of ROADS_Z) { const m = new THREE.Mesh(new THREE.BoxGeometry(520, 0.21, ROAD_W), roadMat); m.position.set(-10, 0.105, z); m.receiveShadow = true; scene.add(m); const c = new THREE.Mesh(new THREE.BoxGeometry(520, 0.13, ROAD_W + 2.4), curbMat); c.position.set(-10, 0.065, z); scene.add(c); }
  { const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(3, 0.05, 0.5), mat('#E2D3B4'), 400); let k = 0;
    for (const x of ROADS_X) for (let z = -260; z < 220; z += 9) { if (k >= 400) break; m4.makeRotationY(Math.PI / 2).setPosition(x, 0.24, z); dash.setMatrixAt(k++, m4); }
    for (const z of ROADS_Z) for (let x = -270; x < 250 && k < 400; x += 9) { m4.makeTranslation(x, 0.24, z); dash.setMatrixAt(k++, m4); }
    dash.count = k; scene.add(dash); }

  // painted things on the street: kerbs in black and kesar, zebra crossings, a speed bump (one draw)
  const paintBits: [number, number, number, number, number, number, string][] = []; // x, y, z, sx, sz, ry, colour
  const kerbRun = (x0: number, x1: number, z: number) => { let i = 0; for (let a = x0; a < x1; a += 1.8) paintBits.push([a, 0.27, z, 1.7, 0.45, 0, i++ % 2 ? '#3A3D52' : TRUCK.kesar]); };
  kerbRun(62, 100, -50 - ROAD_W / 2 - 0.8);   // a short painted stretch at the school gate only
  for (let k = 0; k < 36; k++) { const a = (k / 36) * Math.PI * 2; paintBits.push([FORK.x + Math.cos(a) * (FORK.r + 0.5), 1.12, FORK.z + Math.sin(a) * (FORK.r + 0.5), 1.9, 0.9, -a + Math.PI / 2, k % 2 ? TRUCK.ink : TRUCK.kesar]); }
  const zebra = (cx: number, cz: number, roadAlongX: boolean) => { for (let k = -2.5; k <= 2.5; k++) paintBits.push(roadAlongX ? [cx, 0.27, cz + k * 2, 4.2, 1, 0, '#FBF7EF'] : [cx + k * 2, 0.27, cz, 1, 4.2, 0, '#FBF7EF']); };
  zebra(68, -50, true); zebra(-52, 70, true); zebra(-10, 34, false);
  for (let k = -2.5; k <= 2.5; k++) paintBits.push([56, 0.3, -50 + k * 1.9, 1.3, 1.8, 0, k % 2 ? TRUCK.ink : TRUCK.kesar]);
  { const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.22, 1), mat('#ffffff', { roughness: 0.8 }), paintBits.length);
    paintBits.forEach(([x, y, z, sx, sz, ry, c], k) => { place(pm, k, x, y, z, sx, 1, sz, ry); pm.setColorAt(k, col.set(c)); });
    pm.receiveShadow = true; scene.add(pm); }

  /* ---------- the roundabout: a ring road around a garden ---------- */
  { const ring = new THREE.Mesh(new THREE.CylinderGeometry(FORK.r + 9, FORK.r + 9, 0.24, 48), roadMat); ring.position.set(FORK.x, 0.12, FORK.z); ring.receiveShadow = true; scene.add(ring);
    const garden = new THREE.Mesh(new THREE.CylinderGeometry(FORK.r, FORK.r + 0.6, 1.1, 40), mat('#AEB98A')); garden.position.set(FORK.x, 0.55, FORK.z); garden.receiveShadow = true; garden.castShadow = true; scene.add(garden); }

  /* ---------- street blocks ---------- */
  const blocks: Block[] = [];
  for (let i = 0; i < ROADS_X.length + 1; i++) for (let j = 0; j < ROADS_Z.length + 1; j++) {
    const x0 = (ROADS_X[i - 1] ?? ROADS_X[0]! - 60) + ROAD_W / 2 + 3, x1 = (ROADS_X[i] ?? ROADS_X[ROADS_X.length - 1]! + 60) - ROAD_W / 2 - 3;
    const z0 = (ROADS_Z[j - 1] ?? ROADS_Z[0]! - 60) + ROAD_W / 2 + 3, z1 = (ROADS_Z[j] ?? ROADS_Z[ROADS_Z.length - 1]! + 60) - ROAD_W / 2 - 3;
    if ((i === 1 && j === 1) || (i === 4 && j === 3)) continue; // parks
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
  const TONES = ['#ECE1CB', '#E6D6B8', '#F1E9DA', '#E9D3C2', '#DDD8C2', '#E4D9C6', '#EADBC0'];
  const walls = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 1, 0.04), mat('#ffffff'), blocks.length);
  walls.castShadow = true; walls.receiveShadow = true;
  blocks.forEach((b, k) => { place(walls, k, b.x, b.h / 2, b.z, b.w, b.h, b.d); walls.setColorAt(k, col.set(TONES[b.tone]!)); });
  scene.add(walls);
  // a painted band at the base of some buildings (Karachi buildings often carry a coloured plinth)
  const plinth = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat('#ffffff'), blocks.length);
  const PLINTHS = ['#B9A27E', '#9FB4A6', '#A9A7C2', '#C9A98E'];
  blocks.forEach((b, k) => { place(plinth, k, b.x, 0.6, b.z, b.w + 0.12, 1.2, b.d + 0.12); plinth.setColorAt(k, col.set(PLINTHS[k % PLINTHS.length]!)); });
  if (rich) scene.add(plinth);
  const lip = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat('#F6EFE3'), blocks.length);
  blocks.forEach((b, k) => place(lip, k, b.x, b.h + 0.25, b.z, b.w + 0.3, 0.5, b.d + 0.3));
  lip.castShadow = true; scene.add(lip);

  // water tanks (black and white drums) and stair rooms ("mumty") on roofs
  const tanksArr: [number, number, number, boolean][] = [], rooms: [number, number, number, number, number][] = [];
  blocks.forEach((b) => {
    const n = 1 + Math.floor(rnd() * 2.2);
    for (let t = 0; t < n; t++) tanksArr.push([b.x + (rnd() - 0.5) * (b.w - 3), b.h + 0.5, b.z + (rnd() - 0.5) * (b.d - 3), rnd() < 0.55]);
    if (rnd() < 0.55) rooms.push([b.x + (rnd() - 0.5) * (b.w - 5), b.h, b.z + (rnd() - 0.5) * (b.d - 5), 3 + rnd() * 2, 2.6]);
  });
  const tankGeo = new THREE.CylinderGeometry(0.95, 0.95, 1.9, 14);
  { const tanks = new THREE.InstancedMesh(tankGeo, mat('#ffffff', { roughness: 0.6 }), tanksArr.length);
    tanksArr.forEach(([x, y, z, black], k) => { m4.makeTranslation(x, y + 0.95, z); tanks.setMatrixAt(k, m4); tanks.setColorAt(k, col.set(black ? '#2B3048' : '#F4F1EA')); });
    tanks.castShadow = true; scene.add(tanks);
    const roomM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat('#E8DCC5'), rooms.length);
    rooms.forEach(([x, y, z, w, h], k) => place(roomM, k, x, y + h / 2, z, w, h, w * 0.9));
    roomM.castShadow = true; scene.add(roomM); }

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
  const winM = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.3, 1.6), new THREE.MeshBasicMaterial({ color: '#ffffff' }), wins.length);
  const winOn: boolean[] = [];
  wins.forEach(([x, y, z, side], k) => { place(winM, k, x, y, z, 1, 1, 1, side ? Math.PI / 2 : 0); winOn.push(rnd() < 0.55); winM.setColorAt(k, col.set('#5C6584')); });
  scene.add(winM);

  /* ---------- v18 details on the buildings ---------- */
  // which faces stand on a road (they get shops at street level)
  const shopFace = (b: Block, side: 0 | 1) => side === 0
    ? ROADS_Z.some((rz) => rz - (b.z + b.d / 2) > 0 && rz - (b.z + b.d / 2) < ROAD_W / 2 + 7)
    : ROADS_X.some((rx) => rx - (b.x + b.w / 2) > 0 && rx - (b.x + b.w / 2) < ROAD_W / 2 + 7);
  const shades: [number, number, number, number][] = [], acs: [number, number, number, number][] = [];
  const balconies: [number, number, number, number][] = [], cloths: [number, number, number, number, string][] = [];
  const shutters: [number, number, number, number, number][] = [], signs: [number, number, number, number, number][] = [];
  const RAIL = ['#3A3D52', '#F6EFE3', '#5E8F7E', '#8A6E4E'];
  const CLOTH = [TRUCK.kesar, TRUCK.rose, TRUCK.zam, '#7F93D6', TRUCK.ghee, TRUCK.pista, '#E9C46A', '#B04B8C'];
  blocks.forEach((b) => {
    const floors = Math.max(1, Math.floor((b.h - 1.5) / 3.2));
    for (const side of [0, 1] as const) {
      const len = side ? b.d : b.w, cols = Math.floor(len / 3.2), ry = side ? Math.PI / 2 : 0;
      const at = (c: number, out: number): [number, number] => side ? [b.x + b.w / 2 + out, b.z - b.d / 2 + 1.8 + c * 3.2] : [b.x - b.w / 2 + 1.8 + c * 3.2, b.z + b.d / 2 + out];
      const shops = shopFace(b, side);
      for (let f = 0; f < floors; f++) {
        const y = 2.2 + f * 3.2;
        for (let c = 0; c < cols; c++) {
          if (f === 0 && shops) {
            const [sx, sz] = at(c, 0.1); shutters.push([sx, 1.35, sz, ry, SHUTTER0 + Math.floor(dr() * 4)]);
            const [gx, gz] = at(c, 0.16); signs.push([gx, 3.25, gz, ry, Math.floor(dr() * SHUTTER0)]);
            continue;
          }
          const r = dr();
          if (f >= 1 && b.h > 9 && side === 0 && r < 0.3) {
            const [bx, bz] = at(c, 0.6); balconies.push([bx, y - 1.3, bz, Math.floor(dr() * RAIL.length)]);
            if (rich && dr() < 0.45) for (let k = 0; k < 3; k++) if (dr() < 0.8) cloths.push([bx - 0.9 + k * 0.9, y - 0.75, bz + 0.62, 0, CLOTH[Math.floor(dr() * CLOTH.length)]!]);
          } else if (r < 0.62) { const [hx, hz] = at(c, 0.3); shades.push([hx, y + 1.0, hz, ry]); }
          if (dr() < 0.16) { const [ax, az] = at(c, 0.3); acs.push([ax + (side ? 0 : 1.05), y - 0.75, az + (side ? 1.05 : 0), ry]); }
        }
      }
    }
  });
  const inst = (geo: THREE.BufferGeometry, material: THREE.Material, list: { length: number }) => { const m = new THREE.InstancedMesh(geo, material, Math.max(1, list.length)); m.count = list.length; return m; };
  if (rich) { const sh = inst(new THREE.BoxGeometry(1.8, 0.14, 0.6), mat('#EFE6D4'), shades); shades.forEach(([x, y, z, ry], k) => place(sh, k, x, y, z, 1, 1, 1, ry)); scene.add(sh); }
  if (rich) { const ac = inst(new RoundedBoxGeometry(1.0, 0.66, 0.55, 1, 0.08), mat('#E9E9E4', { roughness: 0.6 }), acs); acs.forEach(([x, y, z, ry], k) => place(ac, k, x, y, z, 1, 1, 1, ry)); scene.add(ac); }
  if (rich) { const slab = inst(new THREE.BoxGeometry(2.9, 0.22, 1.2), mat('#F1E8D7'), balconies), rail = inst(new THREE.BoxGeometry(2.9, 0.95, 0.1), mat('#ffffff', { roughness: 0.7 }), balconies);
    balconies.forEach(([x, y, z, c], k) => { place(slab, k, x, y, z); place(rail, k, x, y + 0.58, z + 0.55); rail.setColorAt(k, col.set(RAIL[c]!)); });
    scene.add(slab, rail); }
  if (cloths.length) { const cl = inst(new THREE.PlaneGeometry(0.7, 0.85), mat('#ffffff', { side: THREE.DoubleSide, roughness: 1 }), cloths); cloths.forEach(([x, y, z, ry, c], k) => { place(cl, k, x, y, z, 1, 1, 1, ry); cl.setColorAt(k, col.set(c)); }); scene.add(cl); }

  // shop shutters and painted signs: one sheet of signs, read one cell per instance
  const sheet = signSheetTex(words);
  const signMat = atlasMat(sheet, SIGN_COLS, SIGN_ROWS, { emissive: '#ffffff', emissiveMap: sheet, emissiveIntensity: 0 });
  { const geo = new THREE.PlaneGeometry(2.8, 2.5); const sm = inst(geo, atlasMat(sheet, SIGN_COLS, SIGN_ROWS), shutters);
    cellAttr(geo, shutters.map((s) => s[4])); shutters.forEach(([x, y, z, ry], k) => place(sm, k, x, y, z, 1, 1, 1, ry)); scene.add(sm); }
  { const geo = new THREE.PlaneGeometry(2.95, 1.1); const gm = inst(geo, signMat, signs);
    cellAttr(geo, signs.map((s) => s[4])); signs.forEach(([x, y, z, ry], k) => place(gm, k, x, y, z, 1, 1, 1, ry)); scene.add(gm); }

  // dish antennas and bougainvillea spilling over the edges of low roofs
  { const dishGeo = merge([paint(new THREE.CylinderGeometry(0.15, 0.15, 1.4, 6), '#7B7F8E', [0, 0.7, 0]), paint(new THREE.SphereGeometry(0.85, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2.6), '#F4F1EA', [0, 1.5, 0], [-0.9, 0, 0])]);
    const dishes: [number, number, number, number][] = [], bou: [number, number, number, number, number][] = [];
    blocks.forEach((b) => {
      if (dr() < 0.3) dishes.push([b.x + (dr() - 0.5) * (b.w - 2), b.h + 0.5, b.z + (dr() - 0.5) * (b.d - 2), dr() * 6.28]);
      if (b.h < 11 && dr() < 0.32) { const n = 2 + Math.floor(dr() * 3), cx = b.x - b.w / 2 + 0.6 + dr() * (b.w - 1.2); for (let k = 0; k < n; k++) bou.push([cx + (dr() - 0.5) * 2.2, b.h - 0.4 - dr() * 2.2, b.z + b.d / 2 + 0.3, 0.7 + dr() * 0.7, Math.floor(dr() * 3)]); }
    });
    const dm = inst(dishGeo, vcMat({ roughness: 0.5 }), dishes); dishes.forEach(([x, y, z, ry], k) => place(dm, k, x, y, z, 1, 1, 1, ry)); if (rich) scene.add(dm);
    const BOU = ['#C46A8A', '#B04B8C', '#D98AA6'];
    const bm = inst(new THREE.IcosahedronGeometry(1, 0), mat('#ffffff', { flatShading: true }), bou); bou.forEach(([x, y, z, s, c], k) => { place(bm, k, x, y, z, s, s * 0.9, s * 0.8); bm.setColorAt(k, col.set(BOU[c]!)); }); scene.add(bm); }

  // rooftop boards with Pohnch's lines (desktop): framed boards on posts, lit at night
  const boardMats: THREE.MeshStandardMaterial[] = [];
  if (rich) {
    const spots: [number, number][] = [[-34, 46], [26, -24], [36, -96]];
    const used = new Set<Block>();
    spots.forEach(([sx, sz], i) => {
      let best: Block | null = null, bd = Infinity;
      for (const b of blocks) { if (used.has(b) || b.h < 8 || b.h > 24 || b.w < 10) continue; const dd = Math.hypot(b.x - sx, b.z - sz); if (dd < bd) { bd = dd; best = b; } }
      if (!best) return; used.add(best);
      const tex = boardTex(words.lines[i + 1] ?? words.lines[i], 11 + i * 3);
      const bmat = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0, roughness: 0.7 }); boardMats.push(bmat);
      const g = new THREE.Group();
      const board = new THREE.Mesh(new THREE.PlaneGeometry(11, 4.7), bmat); board.position.y = 6.2; g.add(board);
      const back = new THREE.Mesh(new THREE.BoxGeometry(11.4, 5.1, 0.35), mat('#3A3D52')); back.position.set(0, 6.2, -0.22); g.add(back);
      for (const px of [-4, 4]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 4, 6), mat('#4A4E62')); post.position.set(px, 2, -0.3); g.add(post); }
      g.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
      g.position.set(best.x, best.h + 0.5, best.z); g.rotation.y = -0.25; scene.add(g); bmat.userData.live = true; bake(g);
    });
  }

  /* ---------- trees ---------- */
  const trees: [number, number, number][] = [];
  for (let k = 0; k < 140; k++) { const x = -200 + rnd() * 400, z = -170 + rnd() * 300; if (!nearRoad(x, z, 2, 2) && !blocks.some((b) => Math.abs(b.x - x) < b.w / 2 + 2 && Math.abs(b.z - z) < b.d / 2 + 2) && Math.hypot(x - HOME.x, z - HOME.z) > 9) trees.push([x, z, 1.7 + rnd() * 1.6]); }
  for (let x = -140; x < -15; x += 15) trees.push([x, 78.5, 2]);
  for (let z = -40; z < 0; z += 12) trees.push([-1.5, z, 1.8]);
  { // neem: a trunk with two branches and three soft lobes of leaves
    const trunkGeo = merge([paint(new THREE.CylinderGeometry(0.22, 0.36, 3, 6), '#8C7552', [0, 1.5, 0]), paint(new THREE.CylinderGeometry(0.1, 0.16, 1.6, 5), '#8C7552', [0.45, 3.1, 0], [0, 0, -0.6]), paint(new THREE.CylinderGeometry(0.1, 0.16, 1.4, 5), '#8C7552', [-0.4, 3.0, 0.2], [0.3, 0, 0.6])]);
    const trunk = new THREE.InstancedMesh(trunkGeo, vcMat(), trees.length);
    const canopy = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), mat('#ffffff', { flatShading: true }), trees.length);
    const small = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), mat('#ffffff', { flatShading: true }), trees.length * 2);
    const GREENS = ['#A2AE7C', '#93A06E', '#B0BA88', '#8E9C66', '#A8B583'];
    trees.forEach(([x, z, s], k) => {
      place(trunk, k, x, 0, z, s / 1.8, s / 1.8, s / 1.8, dr() * 6.28);
      const lobes: [number, number, number, number][] = [[0, 3.7, 0, 1.25], [s * 0.55, 3.25, s * 0.3, 0.9], [-s * 0.5, 3.3, -s * 0.25, 0.85]];
      lobes.forEach(([ox, oy, oz, ls], i) => { const m = i ? small : canopy, j = i ? k * 2 + i - 1 : k; place(m, j, x + ox, oy * s / 1.8, z + oz, s * ls * 1.15, s * ls * 0.95, s * ls * 1.15, dr() * 6.28); m.setColorAt(j, col.set(GREENS[(k + i) % GREENS.length]!)); });
    });
    trunk.castShadow = true; canopy.castShadow = true; canopy.receiveShadow = true; small.castShadow = true; scene.add(trunk, canopy, small); }
  { // palms: along the sea front and in the parks
    const palms: [number, number, number][] = [];
    for (let x = -230; x <= 230; x += 13 + dr() * 8) palms.push([x, SHORE_Z + 6 + dr() * 5, 0.9 + dr() * 0.4]);
    for (const [px, pz] of [[-112, -30], [-90, -8], [128, 86], [150, 104]] as const) palms.push([px, pz, 1]);
    const parts: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 6; k++) parts.push(paint(new THREE.CylinderGeometry(0.32 - k * 0.03, 0.36 - k * 0.03, 1.6, 6), k % 2 ? '#9C8461' : '#8A7352', [Math.sin(k * 0.22) * 0.35, 0.8 + k * 1.5, 0]));
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; parts.push(paint(new THREE.BoxGeometry(4.2, 0.08, 0.9), k % 2 ? '#6F8F4E' : '#7FA15A', [Math.cos(a) * 2.0 + 0.6, 9.4 - 0.6, Math.sin(a) * 2.0], [0, -a, -0.42])); }
    const pm = new THREE.InstancedMesh(merge(parts), vcMat({ flatShading: true }), palms.length);
    palms.forEach(([x, z, s], k) => place(pm, k, x, 0, z, s, s, s, dr() * 6.28)); pm.castShadow = true; scene.add(pm); }
  for (const [x, z, w, d] of [[-100, -20, 46, 46], [140, 95, 46, 40]] as const) { const p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), mat('#B8C192')); p.position.set(x, 0.15, z); p.receiveShadow = true; scene.add(p); }

  /* ---------- the mosque: dome + minaret, by the park ---------- */
  { const g = new THREE.Group(); const white = mat('#F5F0E6'), green = mat('#CFE0D8');
    const base = new THREE.Mesh(new RoundedBoxGeometry(16, 7, 14, 2, 0.3), white); base.position.y = 3.5; g.add(base);
    for (let k = 0; k < 4; k++) { const a = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.3, 14, 1, false, 0, Math.PI), mat('#9FB8AE')); a.rotation.set(Math.PI / 2, 0, Math.PI / 2); a.position.set(-5.4 + k * 3.6, 3.6, 7.05); g.add(a); const p = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 0.3), mat('#9FB8AE')); p.position.set(-5.4 + k * 3.6, 2, 7.05); g.add(p); }
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 1.4, 24), white); drum.position.y = 7.6; g.add(drum);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(4.6, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), green); dome.scale.y = 1.25; dome.position.y = 8.3; g.add(dome);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2.2, 8), mat('#C9A24A', { metalness: 0.5, roughness: 0.4 })); fin.position.y = 15.1; g.add(fin);
    const min = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.25, 22, 12), white); min.position.set(7, 11, -5); g.add(min);
    const bal = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.6, 0.7, 12), white); bal.position.set(7, 17, -5); g.add(bal);
    const lan = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.2, 10), white); lan.position.set(7, 23.1, -5); g.add(lan);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1.05, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), green); cap.scale.y = 1.6; cap.position.set(7, 24.2, -5); g.add(cap);
    g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.position.set(-100, 0, -20); scene.add(g); bake(g); }

  /* ---------- your home: a two-storey house with a kesar door, a jharoka window and a gate ---------- */
  { const home = new THREE.Group();
    const body = new THREE.Mesh(new RoundedBoxGeometry(14, 9, 11, 2, 0.25), mat('#F4ECDD')); body.position.y = 4.5; home.add(body);
    const lipH = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.6, 11.4), mat('#FBF7EF')); lipH.position.y = 9.2; home.add(lipH);
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.6, 4, 0.3), mat('#E8A33D')); door.position.set(0, 2, -5.6); home.add(door);
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.3, 16, 1, false, 0, Math.PI), mat('#E8A33D')); arch.rotation.set(Math.PI / 2, 0, Math.PI / 2); arch.position.set(0, 4, -5.6); home.add(arch);
    // a carved jharoka window upstairs, on both faces the camera sees
    for (const [x, z, ry] of [[3.6, 5.65, 0], [-3.6, 5.65, 0]] as const) {
      const box = new THREE.Mesh(new RoundedBoxGeometry(3, 2.6, 1.1, 2, 0.2), mat('#B5865A')); box.position.set(x, 6.4, z); box.rotation.y = ry; home.add(box);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.7), mat('#3A4466', { roughness: 0.3 })); glass.position.set(x, 6.5, z + 0.56); home.add(glass);
      const roof = new THREE.Mesh(new RoundedBoxGeometry(3.5, 0.45, 1.5, 2, 0.15), mat('#9C6E44')); roof.position.set(x, 7.9, z); home.add(roof);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), mat('#C9A24A', { metalness: 0.4, roughness: 0.5 })); knob.position.set(x, 8.35, z); home.add(knob);
      const sill = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.3, 1.4), mat('#9C6E44')); sill.position.set(x, 5.0, z); home.add(sill);
    }
    const wall = new THREE.Mesh(new THREE.BoxGeometry(18, 1.6, 0.6), mat('#E9DDC6')); wall.position.set(0, 0.8, -7.4); home.add(wall);
    const tank = new THREE.Mesh(tankGeo, mat('#2B3048', { roughness: 0.6 })); tank.position.set(4, 10.4, 2); home.add(tank);
    const lawn = new THREE.Mesh(new THREE.BoxGeometry(22, 0.35, 20), mat('#BCC596')); lawn.position.set(0, 0.17, 1.5); home.add(lawn);
    for (const [x, z, s] of [[-8, -6.5, 2.2], [-6.4, -7.2, 1.4], [8.2, -6.8, 1.6]] as const) { const bou = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), mat(s > 2 ? '#C46A8A' : '#B04B8C', { flatShading: true })); bou.position.set(x, s + 0.2, z); home.add(bou); }
    for (const x of [-2.4, 2.4]) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.38, 0.8, 10), mat('#B5653A')); pot.position.set(x, 0.75, -6.3); home.add(pot); const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), mat('#7FA15A', { flatShading: true })); leaf.position.set(x, 1.5, -6.3); home.add(leaf); }
    home.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    home.position.set(HOME.x, 0, HOME.z); scene.add(home); bake(home); }
  const pin = new THREE.Group();
  { const pm = new THREE.MeshStandardMaterial({ color: '#17705A', roughness: 0.5, emissive: '#17705A', emissiveIntensity: 0.15, transparent: true });
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 14), pm); head.position.y = 2.4; pin.add(head);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.4, 16), pm); tip.rotation.x = Math.PI; tip.position.y = 0.6; pin.add(tip);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true })); dot.position.set(0, 2.5, -1.4); pin.add(dot);
    pin.position.set(HOME.x, 13, HOME.z); scene.add(pin); }

  /* ---------- the school: arches, a courtyard wall, a gate that glows on arrival, a pennant ---------- */
  const gateMat = new THREE.MeshStandardMaterial({ color: '#E8A33D', roughness: 0.5, emissive: '#E8A33D', emissiveIntensity: 0 }); gateMat.userData.live = true;
  let pennant: THREE.Mesh | null = null;
  { const g = new THREE.Group(); const cream = mat('#F2E7D2');
    const main = new THREE.Mesh(new RoundedBoxGeometry(46, 13, 18, 2, 0.4), cream); main.position.set(0, 6.5, -10); g.add(main);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(47, 0.8, 19), mat('#FBF6EC')); roof.position.set(0, 13.3, -10); g.add(roof);
    const band = new THREE.Mesh(new THREE.BoxGeometry(46.2, 0.7, 0.2), mat('#17705A')); band.position.set(0, 11.6, -0.9); g.add(band);
    for (let k = 0; k < 7; k++) { const a = new THREE.Mesh(new THREE.BoxGeometry(3.4, 5, 0.4), mat('#B5865A')); a.position.set(-18 + k * 6, 3.2, -0.9); g.add(a);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.4, 16, 1, false, 0, Math.PI), mat('#B5865A')); top.rotation.set(Math.PI / 2, 0, Math.PI / 2); top.position.set(-18 + k * 6, 5.7, -0.9); g.add(top);
      const w2 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.2), mat('#5C6584')); w2.position.set(-18 + k * 6, 9, -0.88); g.add(w2); }
    for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(18, 2.2, 0.8), cream); w.position.set(sx * 14, 1.1, 6); g.add(w);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(18, 0.3, 1), mat('#17705A')); cap.position.set(sx * 14, 2.35, 6); g.add(cap); }
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5, 1.4), cream); pillarL.position.set(-4.5, 2.5, 6); g.add(pillarL);
    const pillarR = pillarL.clone(); pillarR.position.x = 4.5; g.add(pillarR);
    const gate = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.45, 8, 24, Math.PI), gateMat); gate.position.set(0, 5, 6); g.add(gate);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 12, 6), mat('#9A9AA0')); pole.position.set(16, 19, -6); g.add(pole);
    pennant = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.2, 6, 1), mat('#E8A33D', { side: THREE.DoubleSide })); pennant.position.set(17.9, 23.6, -6); pennant.userData.live = true; g.add(pennant);
    g.traverse((o) => { if ((o as THREE.Mesh).isMesh && o !== pennant) { o.castShadow = true; o.receiveShadow = true; } });
    g.position.set(SCHOOL.x, 0, SCHOOL.z); scene.add(g); bake(g); }
  const penBase = pennant ? Float32Array.from((pennant.geometry.getAttribute('position') as THREE.BufferAttribute).array) : null;

  /* ---------- street lamps along the route ---------- */
  const lampPts: [number, number][] = [];
  for (let x = -140; x < -15; x += 22) lampPts.push([x, 63.5]);
  for (let z = -45; z < 60; z += 22) lampPts.push([-3.5, z]);
  for (let x = 0; x < 80; x += 22) lampPts.push([x, -56.5]);
  const posts = new THREE.InstancedMesh(merge([paint(new THREE.CylinderGeometry(0.15, 0.2, 6, 6), '#4A4E62', [0, 3, 0]), paint(new THREE.BoxGeometry(1.4, 0.16, 0.2), '#4A4E62', [0.6, 6, 0])]), vcMat(), lampPts.length);
  const headMat = new THREE.MeshStandardMaterial({ color: '#FFF1D0', emissive: '#FFC56E', emissiveIntensity: 0 });
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 10, 8), headMat, lampPts.length);
  lampPts.forEach(([x, z], k) => { m4.makeTranslation(x, 0, z); posts.setMatrixAt(k, m4); m4.makeTranslation(x + 1.2, 5.85, z); heads.setMatrixAt(k, m4); });
  posts.castShadow = true; scene.add(posts, heads);
  const glowTex = radial('255,214,150');
  const poolMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(14, 14), poolMat, lampPts.length);
  lampPts.forEach(([x, z], k) => { m4.compose(v.set(x + 1.2, 0.32, z), qt.setFromAxisAngle(X, -Math.PI / 2), ONE); pools.setMatrixAt(k, m4); });
  scene.add(pools);

  /* ---------- the route: a gilt ribbon on the road, drawn as far as `lit` ---------- */
  const curve = routeCurve();
  const routeGeo = new THREE.TubeGeometry(curve as unknown as THREE.Curve<THREE.Vector3>, 400, 0.9, 6, false);
  routeGeo.scale(1, 0.25, 1); routeGeo.translate(0, 0.4, 0);
  const routeMat = new THREE.MeshStandardMaterial({ color: '#C8923A', roughness: 0.45, metalness: 0.2, emissive: '#E8A33D', emissiveIntensity: 0.1 });
  const routeMesh = new THREE.Mesh(routeGeo, routeMat); scene.add(routeMesh);
  const routeIdx = routeGeo.index!.count;
  { const trace = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 8), mat('#C9B48E'), 200);
    for (let k = 0; k < 200; k++) { const p = curve.getPointAt(k / 199); m4.makeTranslation(p.x, 0.28, p.z); trace.setMatrixAt(k, m4); }
    scene.add(trace); }

  /** Night (0..1): windows, lamps, glowing signs and boards. */
  let lastNight = -1;
  const dayW = new THREE.Color('#58617F'), nightOff = new THREE.Color('#1A2142'), litW = new THREE.Color('#FFCF7E');
  function setNight(n: number) {
    if (Math.abs(n - lastNight) < 0.002) return; lastNight = n;
    winOn.forEach((on, i) => winM.setColorAt(i, col.copy(dayW).lerp(on ? litW : nightOff, n)));
    if (winM.instanceColor) winM.instanceColor.needsUpdate = true;
    headMat.emissiveIntensity = 2.2 * n; poolMat.opacity = 0.55 * n;
    signMat.emissiveIntensity = 0.55 * n; boardMats.forEach((m) => { m.emissiveIntensity = 0.7 * n; });
    routeMat.emissiveIntensity = 0.1 + 1.1 * n;
  }
  /** The school's pennant ripples a little. */
  function tick(t: number) {
    if (!pennant || !penBase) return;
    const pos = pennant.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) { const x = penBase[i * 3]!; pos.setZ(i, Math.sin(t * 3 + x * 1.6) * 0.25 * ((x + 1.8) / 3.6)); }
    pos.needsUpdate = true;
  }
  return { blocks, tanksArr, curve, routeGeo, routeMesh, routeIdx, gateMat, pin, glowTex, tankGeo, setNight, tick };
}
