// Névoa em camadas (04/11, sugestão do Eduardo a partir do AiTelly): 3 planos translúcidos de ruído (fbm) a distâncias
// diferentes da câmera (perto / meio / fundo), sempre de frente para ela, derivando com velocidades diferentes. A paralaxe entre
// as camadas dá profundidade e câmera viva; é determinística em t e, por estar no 3D, ganha profundidade, névoa e motion blur.
import * as THREE from 'three';

const FRAG = /* glsl */ `uniform float uT; uniform float uAmt; uniform float uVel; uniform float uEsc; uniform vec3 uCor; uniform float uSeed; varying vec2 vUv;
  float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
  float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * n2(p); p = p * 2.02 + 1.7; a *= 0.5; } return s; }
  void main(){
    vec2 p = vUv * uEsc + vec2(uT * uVel + uSeed, uT * uVel * 0.18);
    float d = fbm(p + 0.6 * fbm(p * 0.7 - uT * uVel * 0.3));
    float m = smoothstep(0.42, 0.85, d);
    float borda = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x) * smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
    gl_FragColor = vec4(uCor, m * borda * uAmt);
  }`;
const VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

// [distância da câmera (m), largura do plano (múltiplo do campo de visão), velocidade, escala do ruído, opacidade relativa]
const CAMADAS = [[9, 1.6, 0.05, 2.2, 0.55], [70, 1.8, 0.025, 2.8, 0.7], [220, 2.0, 0.012, 3.4, 0.9]];

export function buildNevoa(scene) {
  const planos = CAMADAS.map(([dist, larg, vel, esc, rel], i) => {
    const mat = new THREE.ShaderMaterial({vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, fog: false,
      uniforms: {uT: {value: 0}, uAmt: {value: 0}, uVel: {value: vel}, uEsc: {value: esc}, uCor: {value: new THREE.Color('#c9d1d8')}, uSeed: {value: i * 13.7}}});
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    m.renderOrder = 5 - i; m.frustumCulled = false;
    m.userData = {dist, larg, rel};
    scene.add(m);
    return m;
  });
  const v = new THREE.Vector3();
  // amt 0..1 por take; cor da névoa acompanha o clima (claro no céu, cinza-azulado no palco)
  const set = (cam, t, amt, cor = '#c9d1d8') => {
    cam.getWorldDirection(v);
    for (const m of planos) {
      const {dist, larg, rel} = m.userData;
      const h = 2 * dist * Math.tan((cam.fov * Math.PI) / 360) * larg;
      m.position.copy(cam.position).addScaledVector(v, dist);
      m.quaternion.copy(cam.quaternion);
      m.scale.set(h * cam.aspect, h, 1);
      m.material.uniforms.uT.value = t;
      m.material.uniforms.uAmt.value = amt * rel;
      m.material.uniforms.uCor.value.set(cor);
      m.visible = amt > 0.001;
    }
  };
  return {set};
}
