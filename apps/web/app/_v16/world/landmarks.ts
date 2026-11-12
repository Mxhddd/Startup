// The far edge of the model (v18): the sea beyond a sandy shore (Clifton), its surface shimmering,
// and two white landmarks against the haze: Mazar-e-Quaid (square, with tall pointed arches and the
// great dome) and a slim minaret. They sit beyond the last street, so the fog softens them.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { bake, mat } from './kit';
import { SHORE_Z } from './map';
import { waterTex } from './textures';
import type { Quality } from './types';

function pointedArch(w: number, h: number) {
  const s = new THREE.Shape(), sh = h - w * 0.7;
  s.moveTo(-w / 2, 0); s.lineTo(-w / 2, sh);
  s.quadraticCurveTo(-w / 2, sh + (h - sh) * 0.7, 0, h);
  s.quadraticCurveTo(w / 2, sh + (h - sh) * 0.7, w / 2, sh);
  s.lineTo(w / 2, 0); s.closePath();
  return new THREE.ShapeGeometry(s, 10);
}

export function buildLandmarks(scene: THREE.Scene, q: Quality) {
  // sand and sea
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(900, 24), mat('#EAD9B5')); sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.04, SHORE_Z + 8); sand.receiveShadow = true; scene.add(sand);
  const water = waterTex(); water.repeat.set(30, 20);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(1400, 700), new THREE.MeshStandardMaterial({ map: water, color: '#ffffff', roughness: 0.35, metalness: 0.1 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.08, SHORE_Z - 350); scene.add(sea);
  // a line of surf at the shore
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(900, 1.6), new THREE.MeshBasicMaterial({ color: '#F7F4EC', transparent: true, opacity: 0.8 })); surf.rotation.x = -Math.PI / 2; surf.position.set(0, 0.12, SHORE_Z - 0.6); scene.add(surf);

  // Mazar-e-Quaid: a white square on a raised platform, pointed arches on each face, the great dome
  { const g = new THREE.Group(), white = mat('#F8F6F0', { roughness: 0.7 }), shade = mat('#BDB7AA', { side: THREE.DoubleSide });
    const plat = new THREE.Mesh(new THREE.BoxGeometry(44, 2.4, 44), mat('#E9E2D2')); plat.position.y = 1.2; g.add(plat);
    const steps = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 6), mat('#E9E2D2')); steps.position.set(0, 0.6, 24); g.add(steps);
    const base = new THREE.Mesh(new RoundedBoxGeometry(26, 16, 26, 2, 0.4), white); base.position.y = 10.4; g.add(base);
    const arch = pointedArch(9, 13);
    for (let f = 0; f < 4; f++) { const a = new THREE.Mesh(arch, shade); const ang = (f * Math.PI) / 2; a.position.set(Math.sin(ang) * 13.05, 2.6, Math.cos(ang) * 13.05); a.rotation.y = ang; g.add(a); }
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(11.5, 12.5, 2.2, 32), white); drum.position.y = 19.5; g.add(drum);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(11.5, 32, 18, 0, Math.PI * 2, 0, Math.PI / 2), white); dome.scale.y = 1.12; dome.position.y = 20.6; g.add(dome);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3, 8), mat('#D8D2C4')); fin.position.y = 34.8; g.add(fin);
    g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = q !== 'low'; o.receiveShadow = true; } });
    g.position.set(-40, 0, -200); g.rotation.y = 0.15; scene.add(g); bake(g); }

  // a slim minaret further east
  { const g = new THREE.Group(), white = mat('#F5F0E6');
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.0, 38, 12), white); shaft.position.y = 19; g.add(shaft);
    for (const y of [16, 28]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.2, 0.9, 12), white); b.position.y = y; g.add(b); }
    const lan = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 3, 10), white); lan.position.y = 39.5; g.add(lan);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#CFE0D8')); cap.scale.y = 1.7; cap.position.y = 41; g.add(cap);
    g.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = q !== 'low'; });
    g.position.set(150, 0, -196); scene.add(g); bake(g); }

  /** The sea's shimmer slides slowly. */
  function tick(t: number) { water.offset.set(t * 0.006, t * 0.003); }
  return { tick };
}
