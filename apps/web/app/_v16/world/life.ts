// Karachi life (v17, rebuilt in v18): kites over the roofs, a chai stall with steam, green-and-black
// rickshaws with a kesar fringe, small cars, a donkey cart, people on the pavements, children walking
// into school as the van arrives, and crows hopping between water tanks. Each kind of thing is one
// merged, painted shape drawn many times (a few draws in all). Nothing that moves casts a shadow,
// because the city's shadows are drawn once.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { clamp } from '../hour';
import { bake, mat, merge, paint, vcMat } from './kit';
import type { Block } from './city';
import { FORK, HOME, ROAD_W, SCHOOL, mulberry } from './map';
import { TRUCK } from './textures';
import type { Quality } from './types';

type Lane = [number, number, number, number];
// roads the van doesn't use (so nothing ever crosses it)
const LANES: Lane[] = [[110, -200, 110, 150], [-250, -110, 250, -110], [-70, -200, -70, 40], [30, 10, 250, 10]];

export function buildLife(scene: THREE.Scene, q: Quality, blocks: Block[], tanksArr: [number, number, number, boolean][], cloudTex: THREE.Texture) {
  const life = mulberry(29);
  const m4 = new THREE.Matrix4(), tq = new THREE.Quaternion(), tv = new THREE.Vector3(), ts3 = new THREE.Vector3(1, 1, 1), yAxis = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
  const noShadow = (o: THREE.Object3D) => { o.castShadow = false; o.frustumCulled = false; scene.add(o); return o; };

  /* ---------- kites: all kites one draw, all tails one, all strings one ---------- */
  const KITE_COLS = [TRUCK.kesar, '#B04B8C', TRUCK.zam, '#2F6FB5', TRUCK.rose, '#F2C14E', TRUCK.neel];
  const KITE_N = KITE_COLS.length;
  const KITE_AT: [number, number][] = [[HOME.x - 18, HOME.z - 22], [HOME.x + 26, HOME.z - 30], [FORK.x - 70, FORK.z + 40], [FORK.x + 60, FORK.z - 70], [SCHOOL.x - 30, SCHOOL.z + 26], [SCHOOL.x + 14, SCHOOL.z + 8], [20, 40]];
  const kites: { x: number; z: number; h: number; ph: number }[] = [];
  const kiteGeo = merge([
    paint((() => { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 2.4, 0), new THREE.Vector3(1.7, 0, 0), new THREE.Vector3(0, -2.6, 0), new THREE.Vector3(-1.7, 0, 0)]); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return g; })(), '#ffffff'),
    paint(new THREE.BoxGeometry(0.08, 5, 0.05), '#6E5A3A', [0, -0.1, 0.03]), paint(new THREE.BoxGeometry(3.4, 0.07, 0.05), '#6E5A3A', [0, 0.05, 0.03], [0, 0, -0.12]),
  ]);
  const kiteMesh = new THREE.InstancedMesh(kiteGeo, vcMat({ side: THREE.DoubleSide, roughness: 1 }), KITE_N);
  const tailGeo = new THREE.PlaneGeometry(0.25, 2.2); tailGeo.translate(0, -3.6, 0);
  const tailMesh = new THREE.InstancedMesh(tailGeo, new THREE.MeshBasicMaterial({ color: '#F5EEE1', side: THREE.DoubleSide }), KITE_N);
  const stringPos = new Float32Array(KITE_N * 6);
  const strings = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#6E6450', transparent: true, opacity: 0.45 }));
  strings.geometry.setAttribute('position', new THREE.BufferAttribute(stringPos, 3));
  for (let k = 0; k < KITE_N; k++) {
    kiteMesh.setColorAt(k, col.set(KITE_COLS[k]!));
    const [ax, az] = KITE_AT[k]!; const x = ax + (life() - 0.5) * 16, z = az + (life() - 0.5) * 16, h = 26 + life() * 12;
    const b = blocks[Math.floor(life() * blocks.length)]!;
    stringPos.set([b.x, b.h + 1, b.z, x, h, z], k * 6);
    kites.push({ x, z, h, ph: life() * 6.28 });
  }
  [kiteMesh, tailMesh, strings].forEach(noShadow);
  const kq = new THREE.Quaternion(), ke = new THREE.Euler(), kv = new THREE.Vector3(), ks = new THREE.Vector3(), km = new THREE.Matrix4();
  function moveKites(t: number, camera: THREE.Camera) {
    kites.forEach((kt, k) => {
      const sway = Math.sin(t * 0.9 + kt.ph);
      kv.set(kt.x + sway * 4, kt.h + Math.cos(t * 1.3 + kt.ph) * 2, kt.z + Math.sin(t * 0.6 + kt.ph) * 3);
      kq.setFromEuler(ke.set(0, Math.atan2(camera.position.x - kt.x, camera.position.z - kt.z), sway * 0.35));
      // a kite close to the camera shrinks away, so none ever fills the screen
      ks.setScalar(1.8 * clamp((camera.position.distanceTo(kv) - 70) / 90));
      km.compose(kv, kq, ks); kiteMesh.setMatrixAt(k, km); tailMesh.setMatrixAt(k, km);
      stringPos[k * 6 + 3] = kv.x; stringPos[k * 6 + 4] = kv.y - 4.7 * ks.x / 1.8; stringPos[k * 6 + 5] = kv.z;
    });
    kiteMesh.instanceMatrix.needsUpdate = true; tailMesh.instanceMatrix.needsUpdate = true; strings.geometry.attributes.position!.needsUpdate = true;
  }

  /* ---------- a chai stall by the roundabout ---------- */
  const steam: THREE.Sprite[] = [];
  if (q !== 'low') {
    const g = new THREE.Group();
    const cart = new THREE.Mesh(new RoundedBoxGeometry(5, 2.4, 3, 2, 0.3), mat('#B5865A')); cart.position.y = 1.6; g.add(cart);
    const stripe = document.createElement('canvas'); stripe.width = 64; stripe.height = 8; const sg = stripe.getContext('2d')!;
    for (let k = 0; k < 8; k++) { sg.fillStyle = k % 2 ? '#F5EEE1' : TRUCK.zam; sg.fillRect(k * 8, 0, 8, 8); }
    const awnTex = new THREE.CanvasTexture(stripe); awnTex.colorSpace = THREE.SRGBColorSpace;
    const awn = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.3, 4.2), new THREE.MeshStandardMaterial({ map: awnTex, roughness: 0.8 })); awn.position.y = 5.2; awn.rotation.z = 0.08; g.add(awn);
    for (const sx of [-2.8, 2.8]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3, 6), mat('#4A4E62')); pole.position.set(sx, 3.9, 1.6); g.add(pole); }
    const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.8, 10), mat('#C9CCD3', { metalness: 0.5, roughness: 0.35 })); kettle.position.set(1.2, 3.2, 0); g.add(kettle);
    for (let k = 0; k < 4; k++) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.3, 8), mat('#FBF7EF')); cup.position.set(-1.6 + k * 0.5, 2.95, 0.9); g.add(cup); }
    const bench = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.3, 1), mat('#8C7552')); bench.position.set(-1.2, 0.9, 3.4); g.add(bench);
    for (let k = 0; k < 2; k++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 8), mat('#8C7552')); st.position.set(-1 - k * 1.6, 0.6, 3); g.add(st); }
    g.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
    g.position.set(FORK.x + 24, 0, FORK.z - 14); g.rotation.y = 0.3; scene.add(g); bake(g);
    for (let k = 0; k < 3; k++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: 0.5 })); sp.scale.set(1.6, 1.6, 1); scene.add(sp); steam.push(sp); }
  }

  /* ---------- traffic: rickshaws, cars and a donkey cart, on roads the van doesn't use ---------- */
  const wheel = (x: number, z: number, r: number) => paint(new THREE.CylinderGeometry(r, r, 0.45, 12), '#1E2130', [x, r, z], [Math.PI / 2, 0, 0]);
  const rickGeo = merge([
    paint(new RoundedBoxGeometry(3.8, 1.5, 2.4, 2, 0.45), '#2E8B57', [0, 1.35, 0]),
    paint(new RoundedBoxGeometry(3.4, 1.6, 2.55, 2, 0.6), '#2A2F45', [-0.2, 2.85, 0]),
    paint(new THREE.BoxGeometry(3.5, 0.22, 2.62), TRUCK.kesar, [-0.2, 2.12, 0]),
    paint(new THREE.BoxGeometry(0.1, 0.9, 2.0), '#9DB4C8', [1.6, 2.6, 0]),
    paint(new THREE.BoxGeometry(0.3, 0.5, 2.2), TRUCK.pista, [1.95, 1.1, 0]),
    wheel(1.6, 0, 0.55), wheel(-1.3, 1.15, 0.55), wheel(-1.3, -1.15, 0.55),
  ]);
  const carGeo = merge([
    paint(new RoundedBoxGeometry(5.6, 1.5, 2.6, 2, 0.4), '#ffffff', [0, 1.5, 0]),
    paint(new RoundedBoxGeometry(3, 1.1, 2.3, 2, 0.35), '#3A4466', [-0.2, 2.7, 0]),
    paint(new THREE.BoxGeometry(5.7, 0.3, 2.65), '#D9D4C7', [0, 0.85, 0]),
    wheel(1.8, 1.2, 0.6), wheel(1.8, -1.2, 0.6), wheel(-1.8, 1.2, 0.6), wheel(-1.8, -1.2, 0.6),
  ]);
  const donkeyGeo = merge([
    paint(new RoundedBoxGeometry(2.2, 1.1, 0.9, 1, 0.3), '#8E8A86', [2.6, 2.0, 0]),
    paint(new RoundedBoxGeometry(0.9, 0.55, 0.5, 1, 0.15), '#7E7A76', [3.9, 2.55, 0], [0, 0, -0.5]),
    paint(new THREE.BoxGeometry(0.12, 0.5, 0.1), '#6E6A66', [3.75, 3.1, 0.15]), paint(new THREE.BoxGeometry(0.12, 0.5, 0.1), '#6E6A66', [3.75, 3.1, -0.15]),
    ...[[3.4, 0.3], [3.4, -0.3], [1.8, 0.3], [1.8, -0.3]].map(([x, z]) => paint(new THREE.BoxGeometry(0.2, 1.4, 0.2), '#7E7A76', [x!, 0.75, z!])),
    paint(new THREE.BoxGeometry(3.2, 0.3, 2.2), '#A07850', [-0.4, 1.3, 0]),
    paint(new RoundedBoxGeometry(0.8, 0.6, 0.6, 1, 0.1), TRUCK.kesar, [-0.9, 1.75, 0.5]), paint(new RoundedBoxGeometry(0.8, 0.6, 0.6, 1, 0.1), '#7FA15A', [0, 1.75, -0.4]), paint(new RoundedBoxGeometry(0.8, 0.6, 0.6, 1, 0.1), TRUCK.rose, [-1.2, 1.75, -0.3]),
    paint(new THREE.BoxGeometry(2.4, 0.1, 0.1), '#6E5A3A', [1.4, 1.5, 0.6]), paint(new THREE.BoxGeometry(2.4, 0.1, 0.1), '#6E5A3A', [1.4, 1.5, -0.6]),
    paint(new THREE.CylinderGeometry(1.0, 1.0, 0.2, 12), '#5A4630', [-0.4, 1.0, 1.25], [Math.PI / 2, 0, 0]), paint(new THREE.CylinderGeometry(1.0, 1.0, 0.2, 12), '#5A4630', [-0.4, 1.0, -1.25], [Math.PI / 2, 0, 0]),
  ]);
  type Mover = { mesh: THREE.InstancedMesh; i: number; lane: number; off: number; speed: number; ph: number };
  const movers: Mover[] = [];
  const rick = new THREE.InstancedMesh(rickGeo, vcMat({ roughness: 0.6 }), 6);
  const cars = new THREE.InstancedMesh(carGeo, vcMat({ roughness: 0.5 }), 6);
  const carts = new THREE.InstancedMesh(donkeyGeo, vcMat(), 2);
  const CAR_COLS = ['#D9D4C7', '#9E2A1F', '#4A6FA5', '#E8E2D4', '#3A3D52', '#B8862F'];
  CAR_COLS.forEach((c, k) => cars.setColorAt(k, col.set(c)));
  for (let k = 0; k < 6; k++) movers.push({ mesh: rick, i: k, lane: k % 4, off: k % 2 ? 2.8 : -2.8, speed: 0.018 + life() * 0.02, ph: life() });
  for (let k = 0; k < 6; k++) movers.push({ mesh: cars, i: k, lane: (k + 1) % 4, off: k % 2 ? -2.8 : 2.8, speed: 0.016 + life() * 0.02, ph: life() });
  for (let k = 0; k < 2; k++) movers.push({ mesh: carts, i: k, lane: k ? 2 : 0, off: k ? -4 : 4, speed: 0.006, ph: life() });
  [rick, cars, carts].forEach(noShadow);
  function moveTraffic(t: number) {
    for (const v of movers) {
      const [x0, z0, x1, z1] = LANES[v.lane]!; const a = (t * v.speed + v.ph) * Math.PI * 2, k = (Math.sin(a) + 1) / 2, dir = Math.cos(a) >= 0 ? 1 : -1;
      // keep to its side of the road for the direction it drives, changing sides smoothly at the ends
      const side = v.off * clamp(Math.cos(a) * 4, -1, 1);
      const horiz = z0 === z1, x = x0 + (x1 - x0) * k + (horiz ? 0 : side), z = z0 + (z1 - z0) * k + (horiz ? side : 0);
      tq.setFromAxisAngle(yAxis, horiz ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? -Math.PI / 2 : Math.PI / 2));
      tv.set(x, 0, z); m4.compose(tv, tq, ts3); v.mesh.setMatrixAt(v.i, m4);
    }
    rick.instanceMatrix.needsUpdate = true; cars.instanceMatrix.needsUpdate = true; carts.instanceMatrix.needsUpdate = true;
  }

  /* ---------- people on the pavements (abstract, faceless) ---------- */
  const PEOPLE = q === 'low' ? 0 : 14;
  const personGeo = merge([paint(new THREE.CapsuleGeometry(0.7, 1.9, 4, 8), '#ffffff', [0, 1.65, 0]), paint(new THREE.SphereGeometry(0.55, 10, 8), '#8C6A4F', [0, 3.35, 0]), paint(new THREE.CapsuleGeometry(0.72, 0.6, 3, 8), '#ffffff', [0, 0.75, 0], undefined, [1, 1, 1])]);
  const people = new THREE.InstancedMesh(personGeo, vcMat(), Math.max(1, PEOPLE)); people.count = PEOPLE;
  const CLOTHES = ['#F4F1EA', '#7F93D6', '#C46A8A', '#17705A', '#E8A33D', '#5E5A52', '#A7D47E', '#E9D3C2'];
  const walkers = Array.from({ length: PEOPLE }, (_, k) => { const lane = LANES[k % LANES.length]!; return { lane, side: k % 2 ? 1 : -1, ph: life(), speed: 0.004 + life() * 0.004 }; });
  walkers.forEach((_, k) => people.setColorAt(k, col.set(CLOTHES[k % CLOTHES.length]!)));
  noShadow(people);
  function movePeople(t: number) {
    walkers.forEach((p, k) => {
      const [x0, z0, x1, z1] = p.lane; const a = (t * p.speed + p.ph) * Math.PI * 2, f = (Math.sin(a) + 1) / 2, dir = Math.cos(a) >= 0 ? 1 : -1;
      const horiz = z0 === z1, off = p.side * (ROAD_W / 2 + 2.6), bob = Math.abs(Math.sin(t * 5 + k)) * 0.15;
      tv.set(x0 + (x1 - x0) * f + (horiz ? 0 : off), bob, z0 + (z1 - z0) * f + (horiz ? off : 0));
      tq.setFromAxisAngle(yAxis, horiz ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? -Math.PI / 2 : Math.PI / 2));
      m4.compose(tv, tq, ts3.set(1, 1, 1)); people.setMatrixAt(k, m4);
    });
    people.instanceMatrix.needsUpdate = true;
  }

  /* ---------- children at the school gate, walking in as the van arrives ---------- */
  const KIDS = 10;
  const kidBody = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.75, 1.5, 4, 8), mat('#F5F1E6'), KIDS);
  const kidHead = new THREE.InstancedMesh(new THREE.SphereGeometry(0.6, 10, 8), mat('#ffffff'), KIDS);
  const kidBag = new THREE.InstancedMesh(new RoundedBoxGeometry(1.1, 1.2, 0.6, 2, 0.2), mat('#ffffff'), KIDS);
  const BAGS = [TRUCK.rose, '#2F6FB5', TRUCK.kesar, TRUCK.zam, '#B04B8C'], SKIN = ['#8C6A4F', '#6E5040', '#A07A5C'];
  const kidSpots = Array.from({ length: KIDS }, (_, k) => ({ x: SCHOOL.x - 7 + (k % 5) * 3.4 + life(), z: SCHOOL.z + 13 + Math.floor(k / 5) * 3 + life(), d: life() * 0.35 }));
  kidSpots.forEach((_, k) => { kidBag.setColorAt(k, col.set(BAGS[k % BAGS.length]!)); kidHead.setColorAt(k, col.set(SKIN[k % SKIN.length]!)); });
  [kidBody, kidHead, kidBag].forEach(noShadow);
  function moveKids(school: number, t: number) {
    const on = school > 0.02; kidBody.visible = kidHead.visible = kidBag.visible = on; if (!on) return;
    kidSpots.forEach((p, k) => {
      const w2 = clamp((school - p.d) / 0.65), x = p.x + (SCHOOL.x - p.x) * w2 * 0.6, z = p.z - w2 * 18, bob = Math.abs(Math.sin(t * 6 + k)) * 0.25 * (w2 > 0 && w2 < 1 ? 1 : 0);
      const s = w2 >= 1 ? 0 : 1;
      tq.identity(); ts3.setScalar(s);
      tv.set(x, 1.5 + bob, z); m4.compose(tv, tq, ts3); kidBody.setMatrixAt(k, m4);
      tv.set(x, 3.3 + bob, z); m4.compose(tv, tq, ts3); kidHead.setMatrixAt(k, m4);
      tv.set(x, 2.2 + bob, z + 0.75); m4.compose(tv, tq, ts3); kidBag.setMatrixAt(k, m4);
    });
    ts3.set(1, 1, 1);
    for (const m of [kidBody, kidHead, kidBag]) m.instanceMatrix.needsUpdate = true;
  }

  /* ---------- crows on water tanks; one at a time hops to the next tank ---------- */
  const crowMat = new THREE.MeshStandardMaterial({ color: '#1B1E2B', roughness: 0.7 });
  const crowSpots = q === 'low' ? [] : tanksArr.filter((_, k) => k % 9 === 0).slice(0, 7).map(([x, y, z]) => new THREE.Vector3(x, y + 2.1, z));
  const CN = Math.max(1, crowSpots.length);
  const crowGeo = merge([paint(new THREE.SphereGeometry(0.5, 8, 6), '#1B1E2B', undefined, undefined, [1.5, 0.9, 0.9]), paint(new THREE.SphereGeometry(0.32, 8, 6), '#1B1E2B', [0.7, 0.35, 0]), paint(new THREE.ConeGeometry(0.12, 0.4, 6), '#3A3D52', [1.1, 0.3, 0], [0, 0, -Math.PI / 2]), paint(new THREE.BoxGeometry(0.7, 0.08, 0.4), '#1B1E2B', [-0.8, 0.1, 0], [0, 0, 0.3])]);
  const wingGeo = new THREE.PlaneGeometry(1.4, 0.6); wingGeo.rotateX(Math.PI / 2);
  const crowBody = new THREE.InstancedMesh(crowGeo, vcMat({ roughness: 0.7 }), CN), crowWing = new THREE.InstancedMesh(wingGeo, crowMat, CN * 2);
  for (const m of [crowBody, crowWing]) { m.visible = crowSpots.length > 0; noShadow(m); }
  const cp = new THREE.Vector3(), wq = new THREE.Quaternion(), xAxis = new THREE.Vector3(1, 0, 0), one = new THREE.Vector3(1, 1, 1), wo = new THREE.Vector3(), id = new THREE.Quaternion();
  function moveCrows(t: number) {
    if (!crowSpots.length) return;
    const cyc = 6, i = Math.floor(t / cyc) % crowSpots.length, k = (t % cyc) / cyc;
    crowSpots.forEach((home, j) => {
      let flap = 0;
      if (j === i && k < 0.35 && crowSpots.length > 1) { const to = crowSpots[(j + 1) % crowSpots.length]!, f = k / 0.35; cp.lerpVectors(home, to, f); cp.y += Math.sin(Math.PI * f) * 14; flap = Math.sin(t * 22) * 0.9; }
      else cp.copy(home);
      m4.compose(cp, id, one); crowBody.setMatrixAt(j, m4);
      for (const sz of [-1, 1]) { wq.setFromAxisAngle(xAxis, flap * sz); wo.set(cp.x - 0.1, cp.y + 0.25, cp.z + sz * 0.5); m4.compose(wo, wq, one); crowWing.setMatrixAt(j * 2 + (sz > 0 ? 1 : 0), m4); }
    });
    crowBody.instanceMatrix.needsUpdate = true; crowWing.instanceMatrix.needsUpdate = true;
  }

  function tick(t: number, s: { school: number }, n: number, camera: THREE.Camera) {
    moveKites(t, camera);
    steam.forEach((sp, k) => { const f = ((t * 0.5 + k / 3) % 1); sp.position.set(FORK.x + 25.2 + Math.sin(t + k) * 0.5, 4 + f * 5, FORK.z - 13.6); (sp.material as THREE.SpriteMaterial).opacity = 0.45 * (1 - f) * (1 - n * 0.5); sp.scale.setScalar(1.2 + f * 2); });
    moveTraffic(t); movePeople(t); moveKids(s.school, t); moveCrows(t);
  }
  return { tick };
}
