// The school van (v18): a Karachi school van in neel with hand-painted truck-art trim (chamak patti
// along the skirts and under the windows), a kesar SCHOOL VAN / اسکول وین plate, a painted back panel
// with Pohnch's line for the drivers behind, the kesar star on the roof and both sides, chrome hubcaps,
// a roof rack with school bags, children's silhouettes behind the glass, and mirror-work glints that
// catch the light as it turns. The headlights, brake lights and night beams are as before.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { bake, mat } from './kit';
import { TRUCK, backPanelTex, bandTex, plateTex, radial, sparkleTex, type WorldWords } from './textures';
import type { Quality } from './types';

function starShape(r1: number, r2: number) {
  const sh = new THREE.Shape();
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, r = k % 2 ? r2 : r1; const px = Math.cos(a) * r, py = Math.sin(a) * r; if (k) sh.lineTo(px, py); else sh.moveTo(px, py); }
  return sh;
}

export function buildVan(scene: THREE.Scene, q: Quality, words: WorldWords) {
  const van = new THREE.Group(), vanBody = new THREE.Group();
  const brakeMat = new THREE.MeshStandardMaterial({ color: '#B83A2A', emissive: '#FF5A3C', emissiveIntensity: 0.2 });
  const headMat = new THREE.MeshStandardMaterial({ color: '#FFF6E0', emissive: '#FFE9B0', emissiveIntensity: 0.2 });
  brakeMat.userData.live = true; headMat.userData.live = true;
  const neel = new THREE.MeshStandardMaterial({ color: TRUCK.neel, roughness: 0.34, metalness: 0.2 });
  const glass = new THREE.MeshStandardMaterial({ color: '#2A3556', roughness: 0.08, metalness: 0.5, transparent: true, opacity: 0.72 });
  const chrome = new THREE.MeshStandardMaterial({ color: '#E6E8EE', roughness: 0.18, metalness: 0.95 });
  const kesar = mat(TRUCK.kesar, { roughness: 0.45, emissive: TRUCK.kesar, emissiveIntensity: 0.12 });
  const add = (m: THREE.Mesh, x: number, y: number, z: number) => { m.position.set(x, y, z); vanBody.add(m); return m; };

  // body: a lower box, a glass band, a roof; window pillars
  add(new THREE.Mesh(new RoundedBoxGeometry(10, 2.5, 4.4, 4, 0.7), neel), 0, 2.15, 0);
  add(new THREE.Mesh(new RoundedBoxGeometry(9.7, 2.0, 4.25, 3, 0.45), glass), -0.1, 4.2, 0);
  add(new THREE.Mesh(new RoundedBoxGeometry(9.9, 0.55, 4.45, 3, 0.25), neel), -0.1, 5.35, 0);
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) add(new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.0, 0.08), neel), -4.3 + k * 2.15, 4.2, s * 2.14);
  for (const x of [-4.9, 4.75]) add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.0, 0.5), neel), x, 4.2, 0);

  // truck-art trim: painted bands on both sides, under the windows and along the skirts
  const band = bandTex(5); band.repeat.set(5, 1);
  const bandMat = new THREE.MeshStandardMaterial({ map: band, roughness: 0.5 });
  const skirt = bandTex(9); skirt.repeat.set(6, 1);
  const skirtMat = new THREE.MeshStandardMaterial({ map: skirt, roughness: 0.5 });
  for (const s of [-1, 1]) {
    const b1 = add(new THREE.Mesh(new THREE.PlaneGeometry(9.4, 0.5), bandMat), 0, 3.05, s * 2.215); b1.rotation.y = s > 0 ? 0 : Math.PI;
    const b2 = add(new THREE.Mesh(new THREE.PlaneGeometry(9.4, 0.62), skirtMat), 0, 1.25, s * 2.215); b2.rotation.y = s > 0 ? 0 : Math.PI;
    // the kesar star on both sides
    const st = add(new THREE.Mesh(new THREE.ShapeGeometry(starShape(0.62, 0.3)), kesar), 2.6, 2.1, s * 2.222); st.rotation.y = s > 0 ? 0 : Math.PI;
  }
  // front: a painted grille band, the plate, headlights; back: the painted panel and brake lights
  const fb = add(new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.5), bandMat), 5.012, 3.05, 0); fb.rotation.y = Math.PI / 2;
  const plate = plateTex(words);
  const pm = new THREE.MeshStandardMaterial({ map: plate, roughness: 0.5 });
  const pf = add(new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.58), pm), 5.02, 1.6, 0); pf.rotation.y = Math.PI / 2;
  const pr = add(new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.58), pm), -5.02, 1.25, 0); pr.rotation.y = -Math.PI / 2;
  const back = add(new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.7), new THREE.MeshStandardMaterial({ map: backPanelTex(words), roughness: 0.55 })), -5.012, 4.15, 0); back.rotation.y = -Math.PI / 2;
  for (const s of [-1, 1]) {
    add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.9), headMat), 5.02, 2.35, s * 1.5);
    add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 0.6), brakeMat), -5.02, 2.5, s * 1.7);
    // side mirrors on stalks
    add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.08), mat('#2A2F45')), 4.9, 3.6, s * 2.45);
    add(new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.7, 0.45, 1, 0.06), chrome), 4.7, 3.6, s * 2.72);
  }
  for (const x of [5.15, -5.15]) add(new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.55, 4.5, 2, 0.2), chrome), x, 0.95, 0);

  // the star on the roof
  const roofStar = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(1.5, 0.75), { depth: 0.25, bevelEnabled: false }), kesar);
  roofStar.rotation.x = -Math.PI / 2; add(roofStar, 1.2, 5.64, 0);
  // the roof rack with a few school bags
  { const rail = mat('#2A2F45', { metalness: 0.4, roughness: 0.4 });
    for (const s of [-1, 1]) add(new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.14, 0.14), rail), -2.3, 6.0, s * 1.85);
    for (let k = 0; k < 4; k++) add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 3.8), rail), -4.3 + k * 1.35, 6.0, 0);
    const BAGS = [TRUCK.rose, TRUCK.zam, '#7F93D6', TRUCK.kesar];
    BAGS.forEach((c, k) => { const b = add(new THREE.Mesh(new RoundedBoxGeometry(0.95, 0.75, 0.6, 2, 0.18), mat(c)), -4 + k * 1.1, 6.45, (k % 2 ? 0.7 : -0.6)); b.rotation.y = k * 0.4; }); }
  // children's silhouettes behind the glass
  { const heads = [[-3.2, 0.9], [-1.1, -0.8], [1.0, 0.9], [-2.2, -0.7]] as const;
    heads.forEach(([x, z], k) => { add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), mat(k % 2 ? '#3B2A20' : '#5A3E2C')), x, 4.15, z); add(new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.3, 3, 8), mat(['#F4F1EA', '#7F93D6', '#F4F1EA', '#E8A33D'][k]!)), x, 3.35, z); }); }

  // wheels: tyre, chrome hubcap, and a painted kesar ring
  { const wheel = new THREE.CylinderGeometry(0.95, 0.95, 0.7, 18), cap = new THREE.CylinderGeometry(0.5, 0.5, 0.74, 14), ring = new THREE.TorusGeometry(0.66, 0.07, 6, 18);
    const tyre = mat('#1E2130', { roughness: 0.8 });
    for (const [x, z] of [[3.2, 2.05], [3.2, -2.05], [-3.2, 2.05], [-3.2, -2.05]] as const) {
      const w = new THREE.Mesh(wheel, tyre); w.rotation.x = Math.PI / 2; w.position.set(x, 0.95, z); van.add(w);
      const c = new THREE.Mesh(cap, chrome); c.rotation.x = Math.PI / 2; c.position.set(x, 0.95, z); van.add(c);
      const r = new THREE.Mesh(ring, kesar); r.position.set(x, 0.95, z + Math.sign(z) * 0.37); van.add(r);
    } }
  vanBody.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = false; });
  van.add(vanBody); scene.add(van);
  // merge the still pieces: the body (it sways on its own) and the wheels separately
  vanBody.userData.noBake = true; bake(vanBody); bake(van);

  // a soft blob shadow instead of a real one, so the city's shadow map never needs redrawing for the van
  { const blob = new THREE.Mesh(new THREE.PlaneGeometry(15, 9), new THREE.MeshBasicMaterial({ map: radial('16,22,47', 0.55, 4), transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.set(1.2, 0.36, 1.2); van.add(blob); }
  // headlight beams at night (additive glow on the ground)
  const beamMat = new THREE.MeshBasicMaterial({ map: radial('255,214,150'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(22, 12), beamMat); beam.rotation.x = -Math.PI / 2; beam.position.set(14, 0.35, 0); van.add(beam);

  // mirror-work glints on the painted trim: each one flashes as the van turns past its angle
  const glints: { s: THREE.Sprite; ph: number }[] = [];
  if (q !== 'low') {
    const tex = sparkleTex();
    const spots: [number, number, number][] = [];
    for (const s of [-1, 1]) for (let k = 0; k < 5; k++) spots.push([-4 + k * 2, 3.05, s * 2.26]);
    spots.push([5.06, 3.05, 1.2], [5.06, 3.05, -1.2], [-5.06, 5.2, 0.9], [-5.06, 5.2, -0.9]);
    spots.forEach(([x, y, z], k) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); s.scale.setScalar(0.9); s.position.set(x, y, z); vanBody.add(s); glints.push({ s, ph: k * 1.7 }); });
  }
  /** Per frame: the glints follow the van's heading and the time; dimmer in the grey "before" scenes. */
  function tick(t: number, heading: number, n: number, grey: number) {
    for (const g of glints) {
      const f = Math.max(0, Math.sin(heading * 3 + g.ph + t * 1.3)) ** 14;
      (g.s.material as THREE.SpriteMaterial).opacity = f * (0.95 - grey * 0.8) * (1 - n * 0.4);
      g.s.scale.setScalar(0.6 + f * 1.1);
    }
  }
  function setNight(n: number) { headMat.emissiveIntensity = 0.2 + 2 * n; beamMat.opacity = 0.5 * n; }
  return { van, vanBody, brakeMat, beamMat, tick, setNight };
}
