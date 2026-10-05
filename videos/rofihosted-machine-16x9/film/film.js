// rofihosted · "The Machine" v2 · 16:9 · 33 s, cut to the supplied track (118.25 BPM, fitted grid in beats.json).
//
// The user asked for real 3D, After-Effects-style easing (keyframes with easy-ease / expo curves) and lens effects
// (vignette, parallax distance blur, bloom). This overrides the house "springs only / 2D only" rules for this film.
// · 3D: three.js (WebGL2, software-rendered by SwiftShader in the render browser). The tablet is modelled here
//   (Galaxy Tab A8 proportions, 246.8 × 161.9 × 6.9 mm): extruded aluminium body, black glass, live display texture.
// · Look: ACES tone mapping, studio environment reflections (rotated for light sweeps), warm lamp + cool rim,
//   depth of field (parallax distance blur), bloom, chromatic aberration, vignette, seeded grain.
// · Motion: every value is a keyframe track in beats with cubic-bezier easing (AE easy ease, expo in / out).
// · Type and labels are a sharp DOM layer over the WebGL canvas.
// Determinism: everything is a pure function of t (seek(t) rebuilds the whole frame); the display texture is redrawn
// from t every frame; grain is a hash of the frame index.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const { W, H, put, reg, el, scene, seg, clamp, lerp, bt, beatOf, beatAt, mulberry32 } = C;
C.fonts = ['600 100px Display', '400 40px UI', '600 40px UI', '400 30px Mono', '700 30px Mono', '500 40px Serif'];
const B = beatOf;
const LIME = '#a3e635', INK = '#14310a', BG = '#0a0b0d';

// ================================================================ After-Effects-style easing + keyframes
function bez(x1, y1, x2, y2) {
  return (x) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 10; i++) {
      const cx = 3 * x1 * u * (1 - u) ** 2 + 3 * x2 * u * u * (1 - u) + u ** 3 - x;
      const dx = 3 * x1 * (1 - u) ** 2 + 6 * (x2 - x1) * u * (1 - u) + 3 * (1 - x2) * u * u;
      if (Math.abs(cx) < 1e-7) break; if (Math.abs(dx) < 1e-7) break;
      u = clamp(u - cx / dx);
    }
    return 3 * y1 * u * (1 - u) ** 2 + 3 * y2 * u * u * (1 - u) + u ** 3;
  };
}
const E = {
  ease: bez(0.33, 0, 0.67, 1),        // AE "Easy Ease"
  out: bez(0.16, 1, 0.3, 1),          // expo out
  in: bez(0.7, 0, 0.84, 0),           // expo in
  io: bez(0.87, 0, 0.13, 1),          // expo in-out
  cine: bez(0.45, 0, 0.1, 1),         // fast start, very long settle (camera)
  lin: (x) => x,
  hold: () => 0,                      // stepped key: value jumps at the next key (a cut)
};
// keys: [[beat, value (number | array), easeToNext]] — like AE keyframes. Values interpolate per component.
function kf(t, keys) {
  const b = beatAt(t);
  if (b <= B(keys[0][0])) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const b0 = B(keys[i][0]), b1 = B(keys[i + 1][0]);
    if (b < b1) {
      const f = (E[keys[i][2] || 'ease'])(clamp((t - bt(b0)) / Math.max(1e-6, bt(b1) - bt(b0))));
      const a = keys[i][1], z = keys[i + 1][1];
      return Array.isArray(a) ? a.map((v, k) => v + (z[k] - v) * f) : a + (z - a) * f;
    }
  }
  return keys[keys.length - 1][1];
}
// a 0→1 move between two beats with an AE curve
const mv = (t, b0, b1, e = 'ease') => (E[e])(clamp((t - bt(b0)) / Math.max(1e-6, bt(b1) - bt(b0))));

// ================================================================ renderer, scene, effects
const K = 0.75, GW = Math.round(W * K), GH = Math.round(H * K);   // 3D renders at 1440×810 and is scaled up (type stays sharp at full res)
const canvas = el('canvas', { id: 'gl', width: GW, height: GH, style: `width:${W}px;height:${H}px` });
C.stage.insertBefore(canvas, C.stage.firstChild);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(GW, GH, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = false;   // the contact shadow does the grounding; a shadow pass costs a full extra render
const world = new THREE.Scene();
world.background = new THREE.Color(0x050506);
const pmrem = new THREE.PMREMGenerator(renderer);
world.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(32, W / H, 0.01, 80);

const composer = new EffectComposer(renderer);
composer.setPixelRatio(1); composer.setSize(GW, GH);
composer.addPass(new RenderPass(world, camera));
const bokeh = new BokehPass(world, camera, { focus: 3, aperture: 0.002, maxblur: 0.012 });
composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(GW, GH), 0.55, 0.55, 0.9);
composer.addPass(bloom);
const lens = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uVig: { value: 0.75 }, uCA: { value: 0.007 }, uGrain: { value: 0.035 }, uSeed: { value: 0 }, uExp: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uVig, uCA, uGrain, uSeed, uExp; varying vec2 vUv;
    float hash(vec2 p){ p = fract(p * vec2(443.897, 441.423) + uSeed); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
    void main(){
      vec2 c = vUv - 0.5; float r2 = dot(c, c);
      vec2 off = c * uCA * (0.4 + r2 * 2.0);
      vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b) * uExp;
      float v = smoothstep(0.62, 0.08, r2 * 1.35);
      col *= mix(1.0, v, uVig);
      col += (hash(floor(vUv * vec2(${GW}.0, ${GH}.0))) - 0.5) * uGrain * (0.35 + 0.65 * (1.0 - clamp(dot(col, vec3(0.33)), 0.0, 1.0)));
      gl_FragColor = vec4(col, 1.0);
    }`,
});
composer.addPass(lens);
composer.addPass(new OutputPass());

// ---------------------------------------------------------------- lights
const hemi = new THREE.HemisphereLight(0x8a96a8, 0x1a1410, 0.25); world.add(hemi);
const lamp = new THREE.SpotLight(0xffb46e, 60, 18, 0.55, 1, 1.6);
lamp.position.set(-3.2, 4.2, 2.6); lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.0004;
world.add(lamp, lamp.target);
const rim = new THREE.SpotLight(0xdfe8ff, 45, 16, 0.6, 1, 1.6); rim.position.set(3.4, 3.2, -3.0); world.add(rim, rim.target);
const spill = new THREE.PointLight(0xa3e635, 0, 4, 2); world.add(spill);

// ---------------------------------------------------------------- the desk (walnut, procedural) and the void
function woodTexture() {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 512; const g = c.getContext('2d'), r = mulberry32(77);
  g.fillStyle = '#2a1a10'; g.fillRect(0, 0, 2048, 512);
  for (let i = 0; i < 260; i++) {
    const y = r() * 512, a = 0.03 + 0.08 * r(), w = 0.6 + 3 * r();
    g.strokeStyle = r() < 0.5 ? `rgba(70,42,24,${a})` : `rgba(10,6,4,${a * 1.5})`; g.lineWidth = w; g.beginPath();
    for (let x = 0; x <= 2048; x += 32) g.lineTo(x, y + 6 * Math.sin(x / 260 + i) + 3 * Math.sin(x / 47 + i * 3));
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1); t.anisotropy = 4;
  return t;
}
const desk = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.42, metalness: 0.0 }));
desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true; world.add(desk);

// ---------------------------------------------------------------- the tablet
const TW = 2.468, TH = 1.619, TD = 0.069, TR = 0.11, BEZ = 0.085;
function rr(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
const tab = new THREE.Group(); world.add(tab);
const metal = new THREE.MeshPhysicalMaterial({ color: 0x2f3338, metalness: 1, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.2 });
const bodyGeo = new THREE.ExtrudeGeometry(rr(TW - 0.04, TH - 0.04, TR - 0.02), { depth: TD - 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 6, curveSegments: 24 });
bodyGeo.center();
const body = new THREE.Mesh(bodyGeo, metal); body.castShadow = true; tab.add(body);
// the screen stack (front): black bezel → live display → glass sheen; it lifts as one layer in the exploded view
const front = new THREE.Group(); tab.add(front);
const bezel = new THREE.Mesh(new THREE.ShapeGeometry(rr(TW - 0.02, TH - 0.02, TR - 0.01), 24), new THREE.MeshPhysicalMaterial({ color: 0x030304, roughness: 0.18, clearcoat: 0.6, clearcoatRoughness: 0.12, metalness: 0 }));
bezel.position.z = TD / 2 + 0.0008; front.add(bezel);
const UIW = 1600, UIH = Math.round(1600 * (TH - 2 * BEZ) / (TW - 2 * BEZ));
const uiCanvas = document.createElement('canvas'); uiCanvas.width = UIW; uiCanvas.height = UIH;
const ui = uiCanvas.getContext('2d');
const uiTex = new THREE.CanvasTexture(uiCanvas); uiTex.colorSpace = THREE.SRGBColorSpace; uiTex.anisotropy = 8;
const displayMat = new THREE.MeshBasicMaterial({ map: uiTex, toneMapped: false });
const display = new THREE.Mesh(new THREE.PlaneGeometry(TW - 2 * BEZ, TH - 2 * BEZ), displayMat);
display.position.z = TD / 2 + 0.0016; front.add(display);
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.06, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.1, depthWrite: false });
const glass = new THREE.Mesh(new THREE.ShapeGeometry(rr(TW - 0.02, TH - 0.02, TR - 0.01), 24), glassMat);
glass.position.z = TD / 2 + 0.0026; front.add(glass);
const cam = new THREE.Mesh(new THREE.CircleGeometry(0.009, 20), new THREE.MeshBasicMaterial({ color: 0x14171b }));
cam.position.set(0, TH / 2 - BEZ / 2, TD / 2 + 0.003); front.add(cam);
// right short edge: USB-C port and speaker holes
const port = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.086, 0.026), new THREE.MeshBasicMaterial({ color: 0x020203 }));
port.position.set(TW / 2 + 0.0005, 0, 0); tab.add(port);
const holes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.006, 0.006, 0.01, 10), new THREE.MeshBasicMaterial({ color: 0x050506 }), 24);
{ const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2));
  for (let i = 0; i < 24; i++) { const side = i < 12 ? 1 : -1, k = i % 12; m.compose(new THREE.Vector3(TW / 2 + 0.002, side * (0.28 + k * 0.022), 0), q, new THREE.Vector3(1, 1, 1)); holes.setMatrixAt(i, m); } }
tab.add(holes);
// the USB-C cable
const plug = new THREE.Group(); tab.add(plug);
{ const tip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.082, 0.024), new THREE.MeshPhysicalMaterial({ color: 0x9aa0a8, metalness: 1, roughness: 0.42 }));
  tip.position.x = 0.045; plug.add(tip);
  const boot = new THREE.Mesh(new THREE.ExtrudeGeometry(rr(0.26, 0.13, 0.05), { depth: 0.06, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 4 }), new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.7, metalness: 0 }));
  boot.geometry.center(); boot.position.x = 0.22; plug.add(boot);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 4, 20), new THREE.MeshStandardMaterial({ color: 0x101113, roughness: 0.6 }));
  cable.rotation.z = Math.PI / 2; cable.position.x = 2.35; plug.add(cable); }
// exploded-view plates (inside the body at rest)
const PLATE_LOOK = [[0x0d1a10, 0.35, 0.55], [0x101214, 0.1, 0.5], [0x0f1113, 0.1, 0.5], [0x111316, 0.1, 0.45]];
const plates = PLATE_LOOK.map(([c, m, r], i) => {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.ExtrudeGeometry(rr(TW - 0.14, TH - 0.14, TR - 0.06), { depth: 0.008, bevelEnabled: false, curveSegments: 16 }),
    new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r, emissive: new THREE.Color(LIME), emissiveIntensity: 0 }));
  g.add(p);
  const edge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(rr(TW - 0.14, TH - 0.14, TR - 0.06).getPoints(24)), new THREE.LineBasicMaterial({ color: LIME, toneMapped: false, transparent: true, opacity: 0.25 }));
  edge.position.z = 0.0085; g.add(edge);
  if (i === 0) { const chip = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.03), new THREE.MeshPhysicalMaterial({ color: 0x1a1d20, metalness: 0.6, roughness: 0.3 })); chip.position.z = 0.02; g.add(chip); }
  g.position.z = -0.02 + i * 0.008; g.visible = false; tab.add(g);
  return { g, mat: p.material, edge: edge.material };
});
// the stand
const stand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.035, 0.42), new THREE.MeshPhysicalMaterial({ color: 0x1b1d20, metalness: 1, roughness: 0.35 }));
stand.castShadow = true; stand.receiveShadow = true; world.add(stand);
// a contact shadow under the tablet (cheap, always soft)
const shadowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, 'rgba(0,0,0,.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); })();
const contact = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.9), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
contact.rotation.x = -Math.PI / 2; contact.position.y = 0.002; world.add(contact);
// the horizon arc for the end card (bloom makes it glow)
const arc = new THREE.Mesh(new THREE.TorusGeometry(9, 0.02, 8, 200), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.85, 1.3, 0.45), toneMapped: false }));
arc.position.set(0, -8.1, -4); world.add(arc);
const arcGlow = new THREE.Mesh(new THREE.PlaneGeometry(26, 6), new THREE.MeshBasicMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(256, 128, 0, 256, 128, 256); gr.addColorStop(0, 'rgba(190,242,100,.55)'); gr.addColorStop(0.5, 'rgba(163,230,53,.12)'); gr.addColorStop(1, 'rgba(163,230,53,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 128); return new THREE.CanvasTexture(c); })(), transparent: true, depthWrite: false, toneMapped: false }));
arcGlow.position.set(0, -1.6, -4.2); world.add(arcGlow);

// ================================================================ the display: the real UI, rebuilt in English, drawn from t
const REQ = 'Find 3 recent papers on edge computing. Summarize them in Word.';
const STEPS = [['WEB', 'edge computing 2025', '0.8s'], ['PAGE', 'arxiv.org · survey', '1.2s'], ['WRITE', 'Chapter 2.docx', '0.4s'], ['SANDBOX', 'gcc fcfs.c -o fcfs && ./fcfs', '1.315s']];
function rrect(x, y, w, h, r) { ui.beginPath(); ui.moveTo(x + r, y); ui.arcTo(x + w, y, x + w, y + h, r); ui.arcTo(x + w, y + h, x, y + h, r); ui.arcTo(x, y + h, x, y, r); ui.arcTo(x, y, x + w, y, r); ui.closePath(); }
function txt(s, x, y, font, color, align = 'left') { ui.font = font; ui.fillStyle = color; ui.textAlign = align; ui.textBaseline = 'alphabetic'; ui.fillText(s, x, y); }
function mark(cx, cy, s, a = 1) {                         // the real mark: lime tile, ink frame, notched status dot
  const k = s / 64; ui.save(); ui.globalAlpha = a; ui.translate(cx - s / 2, cy - s / 2);
  const g = ui.createLinearGradient(0, 0, 0, s); g.addColorStop(0, '#c8f56e'); g.addColorStop(1, '#a3e635');
  ui.fillStyle = g; rrect(0, 0, s, s, 16 * k); ui.fill();
  ui.strokeStyle = INK; ui.lineWidth = 7 * k; rrect(16 * k, 16 * k, 32 * k, 32 * k, 10 * k); ui.stroke();
  ui.fillStyle = '#b6ee4c'; ui.beginPath(); ui.arc(46 * k, 18 * k, 9.5 * k, 0, 7); ui.fill();
  ui.fillStyle = INK; ui.beginPath(); ui.arc(46 * k, 18 * k, 5 * k, 0, 7); ui.fill(); ui.restore();
}
function drawUI(t, b) {
  ui.setTransform(1, 0, 0, 1, 0, 0); ui.globalAlpha = 1;
  const on = b >= B('wake') - 0.1;
  ui.fillStyle = on ? BG : '#010102'; ui.fillRect(0, 0, UIW, UIH);
  if (!on) return 0.0;
  const cx = UIW / 2, cy = UIH / 2;
  if (b < B('drop') || (b >= B('no1') && b < B('tag'))) {                  // wake / hero: the mark blooms
    const p = mv(t, B('wake') - 0.1, B('wake') + 0.8, 'out');
    const g = ui.createRadialGradient(cx, cy - 30, 10, cx, cy - 30, 520); g.addColorStop(0, `rgba(163,230,53,${0.22 * p})`); g.addColorStop(1, 'rgba(163,230,53,0)');
    ui.fillStyle = g; ui.fillRect(0, 0, UIW, UIH);
    mark(cx, cy - 40, 200 * (0.7 + 0.3 * p), clamp(p * 3));
    const n = clamp(Math.floor((b - B('bloom')) * 2) + 1, 0, 3);
    ['● online · uptime 41d 06:12', 'gateway ok · tunnel ok · memory ok', 'ARM64 · 8 cores · 38 °C'].slice(0, n).forEach((s, i) => txt(s, cx, cy + 150 + i * 46, '400 32px Mono', i === 0 ? '#bef264' : '#686d77', 'center'));
    return 1;
  }
  if (b >= B('tag')) { mark(cx, cy - 60, 220); txt('rofihosted', cx, cy + 150, '600 84px Display', '#f7f8f8', 'center'); return 1; }
  // app chrome
  mark(70, 62, 52); txt('rofihosted', 110, 76, '600 34px UI', '#f7f8f8');
  if (b < B('night')) {
    const sent = b >= B('send');
    if (!sent) {
      const hp = mv(t, B('send') - 0.3, B('send'), 'in');
      ui.save(); ui.globalAlpha = 1 - hp;
      ui.font = '500 92px Serif'; const gw = ui.measureText('Evening, Rofi').width; mark(cx - gw / 2 - 60, 300, 84); txt('Evening, Rofi', cx + 30, 330, '500 92px Serif', '#f7f8f8', 'center');
      ui.restore();
    }
    // composer: types, then drops to the bottom as "Reply…"
    const n = b < B('work') ? 0 : Math.floor(seg(t, 'type_from', 'type_to') * REQ.length + 1e-6);
    const down = mv(t, B('send'), B('send') + 0.8, 'out'), y = lerp(420, UIH - 170, down);
    ui.fillStyle = '#15171b'; rrect(220, y, UIW - 440, 120, 60); ui.fill(); ui.strokeStyle = '#2a2d33'; ui.lineWidth = 2; ui.stroke();
    ui.fillStyle = LIME; ui.beginPath(); ui.arc(UIW - 290, y + 60, 38, 0, 7); ui.fill();
    ui.strokeStyle = INK; ui.lineWidth = 6; ui.lineCap = 'round'; ui.beginPath(); ui.moveTo(UIW - 290, y + 78); ui.lineTo(UIW - 290, y + 42); ui.moveTo(UIW - 306, y + 58); ui.lineTo(UIW - 290, y + 42); ui.lineTo(UIW - 274, y + 58); ui.stroke();
    let line = sent ? 'Reply…' : n === 0 ? 'What can I do for you?' : REQ.slice(0, n);
    ui.font = '400 38px UI'; while (ui.measureText(line).width > UIW - 640) line = '…' + line.slice(2);
    txt(line, 270, y + 73, '400 38px UI', sent || n === 0 ? '#686d77' : '#f7f8f8');
    if (!sent && n > 0 && (n < REQ.length || Math.floor(b * 2) % 2 === 0)) { ui.fillStyle = LIME; ui.fillRect(274 + ui.measureText(line).width, y + 38, 4, 46); }
    if (sent) {
      const bp = mv(t, B('send') + 0.1, B('send') + 0.9, 'out');
      ui.save(); ui.globalAlpha = clamp(bp * 3); ui.translate(0, 40 * (1 - bp));
      ui.fillStyle = '#202329'; rrect(UIW - 880, 130, 760, 140, 34); ui.fill();
      txt('Find 3 recent papers on edge computing.', UIW - 845, 190, '400 36px UI', '#f7f8f8'); txt('Summarize them in Word.', UIW - 845, 240, '400 36px UI', '#f7f8f8');
      ui.restore();
      const spark = ['✻', '✳', '✺', '✹'][Math.floor(Math.max(0, b) * 2) % 4];
      txt(spark, 160, 350, '400 34px UI', '#bef264'); txt('Simmering for', 205, 350, '400 32px UI', '#a0a4ad'); txt('Rofi…', 415, 350, '400 32px UI', '#f7f8f8');
      const op = mv(t, B('s1') - 0.5, B('s1'), 'out');
      if (op > 0) {
        ui.save(); ui.beginPath(); ui.rect(0, 385 + 140 * (1 - op), UIW, 280 * op); ui.clip();
        ui.fillStyle = '#111316'; rrect(140, 385, UIW - 280, 280, 26); ui.fill();
        STEPS.forEach(([tag, d, tm], i) => {
          const p = mv(t, B('s' + (i + 1)) - 0.1, B('s' + (i + 1)) + 0.5, 'out'); if (p <= 0) return;
          ui.save(); ui.globalAlpha = clamp(p * 3); ui.translate(0, 18 * (1 - p));
          const yy = 440 + i * 62; txt(tag, 190, yy, '700 28px Mono', '#bef264'); txt(d, 390, yy, '400 30px Mono', '#a0a4ad'); txt(tm, UIW - 190, yy, '400 28px Mono', '#686d77', 'right');
          ui.restore();
        });
        ui.restore();
      }
    }
    return 1;
  }
  if (b < B('up_from') - 0.5) {                                             // night: clock + memory tidies itself
    const hh = Math.floor(lerp(23 * 60 + 41, 30 * 60 + 58, mv(t, 'night', B('up_from') - 0.5, 'io'))) % 1440;
    txt(`${String(Math.floor(hh / 60)).padStart(2, '0')}:${String(hh % 60).padStart(2, '0')}`, cx, 360, '600 200px Display', '#f7f8f8', 'center');
    const mn = clamp(Math.floor(b - B('sleep1')) + 1, 0, 3);
    ['memory · merged 3 notes', 'memory · thesis topic: edge computing', 'memory · tidy · done'].slice(0, mn).forEach((s, i) => txt(s, cx, 520 + i * 56, '400 34px Mono', '#a0a4ad', 'center'));
    return 0.45;
  }
  // morning: status page
  txt('● All systems operational', cx, 300, '500 64px Serif', '#f7f8f8', 'center');
  txt('Checked from outside every minute · 90-day history', cx, 360, '400 30px UI', '#686d77', 'center');
  for (let i = 0; i < 45; i++) {
    const p = mv(t, B('up_from') + i * 0.04, B('up_from') + i * 0.04 + 0.6, 'out');
    ui.fillStyle = i === 22 ? '#f5b82e' : '#4ade80'; const hgt = 120 * p; rrect(180 + i * 28, 560 - hgt, 20, Math.max(1, hgt), 5); ui.fill();
  }
  txt('99.94% uptime', cx, 640, '400 32px Mono', '#a0a4ad', 'center');
  return 1;
}

// ================================================================ the shot list as keyframes (beats)
// camera: position, look-at target, fov, focus distance (DOF), aperture
const CAM = [
  // 1 macro: the top-right corner, dolly along the rim
  [-1.6, { p: [1.62, 1.92, 0.62], l: [1.05, 1.62, 0], f: 26, a: 0.006 }, 'ease'],
  [3.95, { p: [1.15, 1.98, 0.66], l: [0.62, 1.66, 0], f: 26, a: 0.006 }, 'hold'],
  // 2 macro: right edge, USB-C; slow push
  [4, { p: [2.25, 1.0, 0.95], l: [1.23, 0.87, 0], f: 24, a: 0.005 }, 'ease'],
  [11.95, { p: [1.95, 0.95, 0.7], l: [1.23, 0.88, 0], f: 24, a: 0.005 }, 'hold'],
  // 3 the reveal: crane back from the edge to the desk (fast start, long settle)
  [12, { p: [1.9, 1.05, 0.9], l: [1.1, 0.9, 0], f: 30, a: 0.002 }, 'cine'],
  [16, { p: [-0.3, 1.35, 5.5], l: [-0.95, 0.92, 0], f: 30, a: 0.0016 }, 'ease'],
  // 4 the screen wakes; push in, then fly into the display
  [22, { p: [-0.2, 1.15, 4.6], l: [-0.9, 0.92, 0], f: 30, a: 0.0018 }, 'in'],
  [23.95, { p: [0.0, 0.89, 0.12], l: [0.0, 0.89, -1], f: 30, a: 0.0 }, 'hold'],
  // 5 type over a far, defocused, slowly turning tablet
  [24, { p: [0.0, 1.3, 7.0], l: [-2.1, 0.9, 0], f: 28, a: 0.035 }, 'lin'],
  [31.95, { p: [-0.3, 1.3, 6.4], l: [-2.1, 0.9, 0], f: 28, a: 0.035 }, 'hold'],
  // 6 exploded view: high 3/4 orbit
  [32, { p: [-2.9, 4.8, 5.6], l: [-1.15, 1.25, 0.3], f: 30, a: 0.001 }, 'ease'],
  [39.4, { p: [-1.9, 5.1, 6.3], l: [-1.05, 1.3, 0.3], f: 30, a: 0.001 }, 'io'],
  [39.95, { p: [-0.4, 1.5, 5.4], l: [-1.0, 0.92, 0], f: 30, a: 0.0015 }, 'hold'],
  // 7–8 the UI at work, the night, the morning: tablet on the right third, slow push
  [40, { p: [-0.3, 1.18, 5.1], l: [-0.95, 0.92, 0], f: 30, a: 0.002 }, 'ease'],
  [48, { p: [-0.2, 1.1, 4.6], l: [-0.9, 0.92, 0], f: 30, a: 0.002 }, 'ease'],
  [56.95, { p: [-0.1, 1.05, 4.3], l: [-0.85, 0.92, 0], f: 30, a: 0.002 }, 'hold'],
  // 9 slams: three dramatic angles, each with a quick push
  [57, { p: [2.6, 0.35, 1.6], l: [0.4, 0.9, 0], f: 30, a: 0.004 }, 'out'],
  [57.95, { p: [2.3, 0.42, 1.4], l: [0.4, 0.9, 0], f: 30, a: 0.004 }, 'hold'],
  [58, { p: [0.0, 4.6, 0.9], l: [0.0, 0.9, 0], f: 32, a: 0.003 }, 'out'],
  [58.95, { p: [0.0, 4.2, 0.85], l: [0.0, 0.9, 0], f: 32, a: 0.003 }, 'hold'],
  [59, { p: [-2.7, 1.25, 1.1], l: [-0.3, 0.9, 0], f: 28, a: 0.004 }, 'out'],
  [59.95, { p: [-2.4, 1.2, 1.0], l: [-0.3, 0.9, 0], f: 28, a: 0.004 }, 'hold'],
  // 10 hero: front-on, slow push
  [60, { p: [0.0, 1.2, 6.6], l: [0.0, 0.62, 0], f: 30, a: 0.0012 }, 'ease'],
  [64, { p: [0.0, 1.15, 6.0], l: [0.0, 0.64, 0], f: 30, a: 0.0012 }, 'ease'],
];
function camAt(t) {
  const keys = CAM.map(([b, v, e]) => [b, [...v.p, ...v.l, v.f, v.a], e]);
  const v = kf(t, keys);
  return { p: v.slice(0, 3), l: v.slice(3, 6), f: v[6], a: v[7] };
}
// tablet pose: standing on its stand (leaning back), lying flat for the exploded view
const POSE = [[-2, [0, 0.9, 0, -0.17, 0], 'hold'], [31.95, [0, 0.9, 0, -0.17, 0], 'hold'], [32, [0, 0.9, 0, -1.25, 0.18], 'hold'], [39.4, [0, 0.9, 0, -1.25, 0.18], 'io'], [40, [0, 0.9, 0, -0.17, 0], 'hold']];
const B0 = (b0) => B(b0);

// ================================================================ per-frame 3D update + render
const tmp = new THREE.Vector3();
function frame3d(t) {
  const b = beatAt(t);
  // camera
  const c = camAt(t);
  camera.position.set(...c.p); camera.lookAt(...c.l); camera.fov = c.f; camera.updateProjectionMatrix();
  const focusDist = camera.position.distanceTo(new THREE.Vector3(...c.l));
  bokeh.uniforms.focus.value = b >= 24 && b < 32 ? 2.2 : focusDist; bokeh.uniforms.aperture.value = c.a; bokeh.uniforms.maxblur.value = 0.014;
  // tablet pose (+ a slow turn during the defocused type shot)
  const pose = kf(t, POSE);
  tab.position.set(pose[0], pose[1], pose[2]); tab.rotation.set(pose[3], pose[4] + (b >= 24 && b < 32 ? -0.5 + 0.35 * mv(t, 24, 32, 'lin') : 0), 0);
  // stand / desk / shadows only where the desk is in shot
  const deskShot = (b >= 12 && b < 24) || (b >= 40 && b < 57);
  desk.visible = contact.visible = stand.visible = deskShot;
  stand.position.set(0, 0.1, -0.18); stand.rotation.x = 0;
  contact.position.set(0, 0.002, 0.05);
  world.background.setHex(deskShot ? 0x070606 : 0x040405);
  // the cable: in from the right on 'plug', stays in
  const ins = mv(t, B('plug') - 0.55, B('plug'), 'out');
  plug.position.set(TW / 2 + lerp(0.9, 0.012, ins), 0, 0); plug.visible = b >= 3.2;
  // exploded view: four plates appear inside, layers lift one per label beat, collapse on 'collapse'
  const explode = b >= 32 && b < 40;
  const col = mv(t, 'collapse', 40, 'io');
  let acc = 0;
  plates.forEach((P, i) => {
    P.g.visible = explode;
    acc += 0.3 * mv(t, B('l' + (i + 1)) - 0.25, B('l' + (i + 1)) + 0.5, 'out');
    P.g.position.z = -0.02 + i * 0.008 + acc * (1 - col);
    const active = b >= B('l' + (i + 1)) - 0.25 && b < B('l' + (i + 1)) + 1;
    P.mat.emissiveIntensity = active ? 0.05 : 0; P.edge.opacity = active ? 1 : 0.25;
  });
  acc += 0.3 * mv(t, B('l5') - 0.25, B('l5') + 0.5, 'out');
  front.position.z = explode ? acc * (1 - col) + 0.012 * plates.length * (1 - col) : 0;
  // lights per shot (AE-style ramps): lamp dims for the night and returns in the morning
  const night = mv(t, 'night', B('night') + 1, 'io') * (1 - mv(t, B('up_from') - 0.5, B('up_from') + 0.5, 'io'));
  const slam = b >= B('no1') && b < B('tag');
  lamp.intensity = (deskShot ? 70 : b >= B('tag') || slam ? 5 : 20) * (1 - 0.92 * night);
  lamp.target.position.set(0.3, 0.8, 0);
  rim.intensity = (deskShot ? 18 : b >= B('tag') ? 10 : 40) * (1 - 0.5 * night); rim.target.position.set(0, 0.9, 0);
  // light sweeps: rotate the studio environment so its bright panels glide over the metal
  const sweep = kf(t, [[-2, -0.6, 'ease'], [4, 1.1, 'hold'], [4.01, -0.4, 'ease'], [12, 1.0, 'hold'], [12.01, 0.2, 'ease'], [24, 0.9, 'hold'], [24.01, 0, 'ease'], [40, 1.2, 'hold'], [40.01, 0.4, 'ease'], [64, 1.4, 'lin']]);
  world.environmentRotation.set(0.15, sweep, 0);
  world.environmentIntensity = (deskShot ? 0.32 : 0.9) * (1 - 0.7 * night);
  // the display
  const bright = drawUI(t, b);
  uiTex.needsUpdate = true;
  const dim = b >= B('night') && b < B('up_from') - 0.5 ? lerp(1, 0.45, mv(t, 'night', B('night') + 1, 'io')) : 1;
  displayMat.color.setScalar(bright > 0 ? dim : 1);
  spill.position.copy(tab.localToWorld(tmp.set(0, 0, 0.45))); spill.intensity = 0;   // a lime point light reflects as a dot in the glass; the bloom carries the screen's glow instead
  // the end card's horizon arc
  const end = mv(t, 'tag', B('tag') + 1.6, 'out');
  arc.visible = b >= B('tag') - 0.1; arcGlow.visible = false;
  arc.position.y = lerp(-9.4, -8.25, end); arcGlow.material.opacity = 0.45 * end;
  // lens: exposure ramps (the silent beat goes to black), CA + grain
  const silent = b >= B('gap') && b < B('drop');
  lens.uniforms.uExp.value = silent ? 0.0 : (b >= 24 && b < 32 ? 0.75 : slam ? 0.55 : 1) * (1 - 0.35 * night);
  lens.uniforms.uSeed.value = (Math.round(t * 60) % 997) * 0.618;
  bloom.strength = b >= B('tag') ? 0.9 : 0.6;
  composer.render();
}

// ================================================================ the type layer (DOM), AE-style
// A masked line whose words rise with an expo-out curve (+ a little blur), and leave with expo-in.
function line(parent, text, o) {
  const e = el('div', { class: 'ae display', style: `left:${o.x ?? 140}px;top:${o.y}px;font-size:${o.size}px;${o.color ? `color:${o.color};` : ''}${o.align === 'center' ? `width:${W}px;left:0;text-align:center;` : ''}` }, parent);
  const mask = el('span', { style: 'display:inline-block;overflow:hidden;padding:0.08em 0.06em 0.2em;margin:-0.08em -0.06em 0;vertical-align:top' }, e);
  const words = text.split(' ').map((w, i, a) => {
    const s = el('span', { style: 'display:inline-block' }, mask, w.replace(/&/g, '&amp;'));
    if (o.accent && o.accent.includes(i)) s.style.color = o.accColor || 'var(--accent)';
    if (i < a.length - 1) mask.appendChild(document.createTextNode(' '));
    return reg(s, { o: 0 });
  });
  reg(e);
  return { e, words, size: o.size };
}
function ae(t, L, inB, outB = null, o = {}) {
  const st = o.stagger ?? 0.09, dur = o.dur ?? 0.9, lead = 0.12;
  L.words.forEach((w, i) => {
    const b0 = (Array.isArray(inB) ? B(inB[i]) : B(inB) + i * st) - lead;
    const p = mv(t, b0, b0 + dur, 'out');
    let y = L.size * 1.1 * (1 - p), bl = 10 * (1 - p), op = clamp(p * 2.5);
    if (outB != null) { const q = mv(t, B(outB) + i * st * 0.4, B(outB) + i * st * 0.4 + 0.45, 'in'); y -= L.size * 1.1 * q; bl += 10 * q; op *= 1 - clamp(q * 1.6); }
    put(w, { y, o: op, hide: op <= 0.002, filter: bl > 0.1 ? `blur(${bl.toFixed(2)}px)` : 'none' });
  });
}

// the GL canvas is redrawn every frame from t
scene({ name: 'gl', from: 'hook', to: 'done', post: 1, cut: false, build() {}, run(t) { frame3d(t); } });

// 1–2 · "This is a tablet." / specs
const SPECS = [['8 cores.', 'Unisoc T618', 'spec1'], ['3 GB of RAM.', 'shared by nothing else', 'spec2'], ['ARM64.', 'real Linux, via Termux', 'spec3']];
scene({
  name: 'open', from: 'hook', to: 'desk',
  build(root, S) {
    S.a = line(root, 'This is', { y: 330, size: 150 }); S.b = line(root, 'a tablet.', { y: 490, size: 150, accent: [1] });
    S.specs = SPECS.map(([a, sub]) => ({ big: line(root, a, { y: 300, size: 170 }), sub: line(root, sub, { y: 500, size: 40, color: 'var(--ink-2)' }) }));
    S.specs.forEach((s) => { s.sub.e.classList.remove('display'); s.sub.e.classList.add('mono'); });
  },
  run(t, b, S) {
    ae(t, S.a, ['t1', -1.2], B('port') - 0.5); ae(t, S.b, ['t2', -0.3], B('port') - 0.45);
    SPECS.forEach(([, , m], i) => {
      const out = i < 2 ? B(SPECS[i + 1][2]) - 0.45 : B('desk') - 0.45;
      ae(t, S.specs[i].big, m, out); ae(t, S.specs[i].sub, B(m) + 0.35, out - 0.1, { stagger: 0.03 });
    });
  },
});
// 3–4 · the desk, "Look closer."
scene({
  name: 'desk', from: 'desk', to: 'itsa',
  build(root, S) {
    S.a = line(root, "On a student's", { y: 360, size: 110 }); S.b = line(root, 'desk.', { y: 490, size: 110 });
    S.c = line(root, 'Look', { y: 360, size: 140 }); S.d = line(root, 'closer.', { y: 510, size: 140, accent: [0] });
  },
  run(t, b, S) {
    ae(t, S.a, 'desk1', B('closer') - 0.45); ae(t, S.b, B('desk1') + 0.3, B('closer') - 0.4);
    ae(t, S.c, 'closer', 22.2); ae(t, S.d, B('closer') + 0.3, 22.3);
  },
});
// 5 · "It's not just a tablet." → "It's a" … (silent beat) …
scene({
  name: 'itsa', from: 'itsa', to: 'drop',
  build(root, S) {
    S.a = line(root, "It's not", { y: 330, size: 160 }); S.b = line(root, 'just a tablet.', { y: 500, size: 160, color: 'var(--ink-2)' });
    S.c = line(root, "It's a", { y: 400, size: 220 });
    S.car = reg(el('div', { class: 'ae', style: `left:760px;top:430px;width:14px;height:210px;background:${LIME}` }, root), { o: 0 });
  },
  run(t, b, S) {
    ae(t, S.a, 'itsa', B('impact1') - 0.5); ae(t, S.b, B('itsa') + 0.5, B('impact1') - 0.45);
    ae(t, S.c, 'impact1', null, { stagger: 0.12 });
    put(S.car, { o: b >= B('impact1') + 0.8 && Math.floor(b * 2) % 2 === 0 ? 1 : 0 });
    put(S.root, { s: 1 + 0.06 * mv(t, 'itsa', 'gap', 'lin'), css: { transformOrigin: '200px 520px' } });
  },
});
// 6 · "It's a real server." + exploded-view labels (anchored to the plates through the camera projection)
const LAYERS = [['Linux on ARM64', 'Termux · 24/7'], ['Isolated sandbox', 'Alpine containers'], ['Model gateway', 'Rust · OpenAI-compatible'], ['Nightly memory', 'tidied while you sleep'], ['Cloudflare Tunnel', '0 open ports']];
scene({
  name: 'stack', from: 'drop', to: 'work',
  build(root, S) {
    S.a = line(root, "It's a", { y: 90, size: 110 }); S.b = line(root, 'real server.', { y: 200, size: 110, accent: [0, 1] });
    S.svg = el('div', { class: 'ae', style: `left:0;top:0;width:${W}px;height:${H}px` }, root);
    S.svg.innerHTML = `<svg width="${W}" height="${H}" style="position:absolute;left:0;top:0">${LAYERS.map((_, i) => `<path id="ld${i}" fill="none" stroke="${LIME}" stroke-width="2"/><circle id="lc${i}" r="7" fill="${LIME}"/>`).join('')}</svg>`;
    S.paths = LAYERS.map((_, i) => reg(S.svg.querySelector('#ld' + i), { o: 0 }));
    S.dots = LAYERS.map((_, i) => reg(S.svg.querySelector('#lc' + i), { o: 0 }));
    S.labels = LAYERS.map(([a, s], i) => reg(el('div', { class: 'ae', style: `left:140px;top:${400 + i * 112}px` }, root,
      `<div style="font-family:Display;font-weight:600;font-size:48px;letter-spacing:-.02em;color:var(--ink)">${a}</div><div class="mono" style="font-size:24px;color:var(--ink-3);margin-top:4px">${s}</div>`), { o: 0 }));
  },
  run(t, b, S) {
    ae(t, S.a, B('drop') - 0.6, B('work') - 0.5); ae(t, S.b, 'drop', B('work') - 0.45, { stagger: 0.1 });
    // anchor each label to its plate's left edge in screen space (same camera as the 3D frame)
    const c = camAt(t); camera.position.set(...c.p); camera.lookAt(...c.l); camera.fov = c.f; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    const col = mv(t, 'collapse', 40, 'io');
    let acc = 0;
    LAYERS.forEach((_, i) => {
      acc += 0.3 * mv(t, B('l' + (i + 1)) - 0.25, B('l' + (i + 1)) + 0.5, 'out');
      const z = i < 4 ? -0.02 + i * 0.008 + acc * (1 - col) : acc * (1 - col) + 0.048 * (1 - col);
      tab.updateMatrixWorld();
      const v = tab.localToWorld(new THREE.Vector3(-TW / 2 + 0.1, 0, z)).project(camera);
      const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
      const p = mv(t, B('l' + (i + 1)) - 0.15, B('l' + (i + 1)) + 0.6, 'out') * (1 - mv(t, B('collapse') - 0.3, B('collapse') + 0.2, 'in'));
      const lx = 140 + 520, ly = 400 + i * 112 + 30;
      const mx = lerp(lx, x, clamp(p * 1.2));
      put(S.labels[i], { o: clamp(p * 3), hide: p <= 0.002, x: -30 * (1 - p) });
      put(S.paths[i], { o: p > 0.01 ? 1 : 0, html: '' }); S.paths[i].setAttribute('d', `M ${lx} ${ly} L ${mx.toFixed(1)} ${lerp(ly, y, clamp(p * 1.2)).toFixed(1)}`);
      put(S.dots[i], { o: p > 0.6 ? 1 : 0 }); S.dots[i].setAttribute('cx', x.toFixed(1)); S.dots[i].setAttribute('cy', y.toFixed(1));
    });
  },
});
// 7–8 · captions for the UI, the night, the morning
scene({
  name: 'work', from: 'work', to: 'no1',
  build(root, S) {
    S.caps = [['It reads.', 's1'], ['It writes.', 's3'], ['It runs code.', 's4']].map(([c, m]) => ({ L: line(root, c, { y: 430, size: 96 }), m }));
    S.n1 = line(root, 'While you sleep,', { y: 400, size: 84 }); S.n2 = line(root, 'it tidies its memory.', { y: 500, size: 84, color: 'var(--ink-2)' });
    S.pct = reg(el('div', { class: 'ae display', style: 'left:140px;top:360px;font-size:170px;color:var(--ink)' }, root), { o: 0 });
    S.pl = line(root, 'uptime · 90 days', { y: 570, size: 36, color: 'var(--ink-2)' }); S.pl.e.classList.remove('display'); S.pl.e.classList.add('mono');
  },
  run(t, b, S) {
    S.caps.forEach(({ L, m }, i) => ae(t, L, m, i < 2 ? B(S.caps[i + 1].m) - 0.45 : B('night') - 0.4));
    ae(t, S.n1, 'sleep1', B('up_from') - 0.6); ae(t, S.n2, 'sleep2', B('up_from') - 0.55);
    const p = mv(t, B('up_from') - 0.1, B('up_from') + 0.8, 'out');
    const v = 90 + 9.94 * mv(t, 'up_from', 'up_to', 'out');
    put(S.pct, { o: clamp(p * 2.5), hide: p <= 0.002, y: 60 * (1 - p), filter: p < 0.99 ? `blur(${(10 * (1 - p)).toFixed(2)}px)` : 'none', text: v.toFixed(2) + '%' });
    ae(t, S.pl, B('up_from') + 0.4, null, { stagger: 0.05 });
  },
});
// 9 · slams on the track's stutter hits (the 3D cuts to a new angle behind each)
[['no1', 'No subscription.', null, '#f7f8f8'], ['no2', 'No telemetry.', LIME, INK], ['no3', 'Just yours.', null, LIME]].forEach(([m, text, bg, fg], i, A) => scene({
  name: m, from: m, to: i < 2 ? A[i + 1][0] : 'tag',
  build(root, S) {
    if (bg) S.bg = reg(el('div', { class: 'ae', style: `left:0;top:0;width:${W}px;height:${H}px;background:${bg}` }, root));
    S.L = line(root, text, { y: 410, size: 200, color: fg, align: 'center' });
  },
  run(t, b, S) {
    ae(t, S.L, B(m) - 0.02, null, { stagger: 0.04, dur: 0.6 });
    put(S.root, { s: 1.04 - 0.04 * mv(t, B(m) - 0.1, B(m) + 0.9, 'out'), css: { transformOrigin: '960px 540px' } });
  },
}));
// 10 · tagline, lockup, URL
scene({
  name: 'end', from: 'tag', to: 'done', post: 1,
  build(root, S) {
    S.t = line(root, 'One tablet. A real server.', { y: 70, size: 96, align: 'center', accent: [2, 3, 4] });
    S.lock = reg(el('div', { class: 'ae', style: `left:0;top:840px;width:${W}px;height:120px;display:flex;justify-content:center;align-items:center;gap:30px` }, root));
    S.mk = reg(el('span', { style: 'width:96px;height:96px;display:inline-block' }, S.lock,
      `<svg viewBox="0 0 64 64" width="100%" height="100%"><defs><mask id="mkend" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64"><rect width="64" height="64" fill="#fff"/><circle cx="46" cy="18" r="9.5" fill="#000"/></mask></defs><rect width="64" height="64" rx="16" fill="${LIME}"/><rect x="16" y="16" width="32" height="32" rx="10" fill="none" stroke="${INK}" stroke-width="7" mask="url(#mkend)"/><circle cx="46" cy="18" r="5" fill="${INK}"/></svg>`), { o: 0 });
    S.wm = reg(el('img', { src: '../assets/brand/wordmark-white.svg', style: `width:${Math.round(64 * 157 / 41.6)}px;height:64px` }, S.lock), { o: 0 });
    S.url = reg(el('div', { class: 'ae mono', style: `left:0;top:975px;width:${W}px;text-align:center;font-size:44px;color:var(--lime-1);white-space:pre` }, root));
  },
  run(t, b, S) {
    ae(t, S.t, B('tag') - 0.1, null, { stagger: 0.08 });
    const mp = mv(t, B('lockup') - 0.12, B('lockup') + 0.7, 'out');
    put(S.mk, { o: clamp(mp * 3), s: 0.6 + 0.4 * mp, hide: mp <= 0.002 });
    const wp = mv(t, B('lockup') + 0.1, B('lockup') + 1.0, 'out');
    put(S.wm, { o: clamp(wp * 3), x: -40 * (1 - wp), clip: C.inset(0, 100 - 100 * wp, 0, 0), hide: wp <= 0.002 });
    const U = 'rofihosted.space', n = Math.floor(seg(t, 'url', B('url') + 1.5) * U.length + 1e-6);
    const car = b >= B('url') - 0.3 && (n < U.length || Math.floor(b * 2) % 2 === 0) ? '<span class="caret"></span>' : '';
    put(S.url, { html: U.slice(0, n) + car + `<span class="ghost">${U.slice(n)}</span>` });
  },
});

C.start();
