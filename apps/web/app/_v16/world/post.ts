// The one post-processing pass (desktop): tilt-shift blur around the subject, the grey "before
// Pohnch" grade, and a soft vignette that deepens at night.
import * as THREE from 'three';

export const PostShader = {
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
