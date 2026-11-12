// Light and colour through the day: dawn (0), day (1), dusk (2), night (3).
import * as THREE from 'three';
import { clamp, lerp } from '../hour';

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
