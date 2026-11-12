// Small helpers for building the city: a clay material, painting a shape one colour, merging painted
// shapes into one (so a whole rickshaw is one draw), and a material that reads one cell of a
// painted texture sheet per instance (so all shop signs are one draw).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, ...extra });

/** A copy of the shape with every vertex coloured `color` (for merged, vertex-coloured models). */
export function paint(geo: THREE.BufferGeometry, color: string, at?: [number, number, number], rot?: [number, number, number], scale?: [number, number, number]): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  if (!g.getAttribute('uv')) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((g.getAttribute('position').count) * 2), 2));
  if (scale) g.scale(...scale);
  if (rot) { g.rotateX(rot[0]); g.rotateY(rot[1]); g.rotateZ(rot[2]); }
  if (at) g.translate(...at);
  const c = new THREE.Color(color), n = g.getAttribute('position').count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.Float32BufferAttribute(a, 3));
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k);
  return g;
}
export function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const g = mergeGeometries(parts, false); if (!g) throw new Error('merge failed');
  parts.forEach((p) => p.dispose()); return g;
}
export const vcMat = (extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, ...extra });

/** A material showing cell `aCell` (an instanced attribute) of a cols × rows texture sheet. */
export function atlasMat(map: THREE.Texture, cols: number, rows: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  const m = new THREE.MeshStandardMaterial({ map, roughness: 0.85, metalness: 0, ...extra });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = 'attribute float aCell;\n' + sh.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
#ifdef USE_MAP
  vMapUv = (vMapUv + vec2(mod(aCell, ${cols}.0), ${rows - 1}.0 - floor(aCell / ${cols}.0))) / vec2(${cols}.0, ${rows}.0);
#endif`);
  };
  m.customProgramCacheKey = () => `atlas${cols}x${rows}`;
  return m;
}
export function cellAttr(geo: THREE.BufferGeometry, cells: number[]) {
  geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(new Float32Array(cells), 1));
}

/** Merge a model's still pieces into one mesh per material (same look, far fewer draws). Pieces whose
 *  material changes while running (glowing gates, lights) keep their own mesh; mark a subtree with
 *  userData.noBake to leave it alone (for example a part that moves on its own). */
export function bake(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), rel = new THREE.Matrix4();
  const buckets = new Map<string, { mat: THREE.Material; geos: THREE.BufferGeometry[]; cast: boolean; receive: boolean }>();
  const done: THREE.Mesh[] = [];
  const walk = (o: THREE.Object3D) => {
    if (o !== root && o.userData.noBake) return;
    const m = o as THREE.Mesh;
    if (m.isMesh && !(m as THREE.InstancedMesh).isInstancedMesh && !Array.isArray(m.material) && !m.userData.live && !(m.material as THREE.Material).userData.live) {
      const mt = m.material as THREE.MeshStandardMaterial;
      const key = [mt.type, mt.color?.getHexString(), mt.roughness, mt.metalness, mt.emissive?.getHexString(), mt.emissiveIntensity, mt.map?.uuid, mt.transparent, mt.opacity, mt.side, mt.flatShading, mt.vertexColors, m.castShadow, m.receiveShadow].join('|');
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k);
      if (!g.getAttribute('uv')) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.getAttribute('position').count * 2), 2));
      if (!g.getAttribute('normal')) g.computeVertexNormals();
      g.applyMatrix4(rel.multiplyMatrices(inv, m.matrixWorld));
      const b = buckets.get(key) ?? { mat: mt, geos: [], cast: m.castShadow, receive: m.receiveShadow };
      b.geos.push(g); buckets.set(key, b); done.push(m);
    }
    for (const c of [...o.children]) walk(c);
  };
  walk(root);
  done.forEach((m) => m.parent?.remove(m));
  buckets.forEach((b) => {
    // all pieces in a bucket must share the same attributes to merge
    const withColor = b.geos.some((g) => g.getAttribute('color'));
    if (withColor) b.geos = b.geos.filter((g) => g.getAttribute('color'));
    const g = mergeGeometries(b.geos, false); if (!g) return;
    const mesh = new THREE.Mesh(g, b.mat); mesh.castShadow = b.cast; mesh.receiveShadow = b.receive; root.add(mesh);
  });
}
