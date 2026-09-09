// Live canvas backgrounds for the project cards, ported from the main site:
// a WebGL ocean and sky (three.js webgl_shaders_ocean) behind Segmentation,
// a bezier particle stream in the instance-diagram palette behind Optimal
// Transport, a drifting lesion field behind Instance Metrics, and a tile
// sweep behind CUDA Kernels. Each fills its card, sits under a scrim, pauses when the
// tab is hidden, and holds still under reduced motion.
// biome-ignore lint/performance/noNamespaceImport: three.js namespace from a CDN URL module
import * as THREE from "https://esm.sh/three@0.169.0";
import { Sky } from "https://esm.sh/three@0.169.0/examples/jsm/objects/Sky.js";
import { Water } from "https://esm.sh/three@0.169.0/examples/jsm/objects/Water.js";

const HEX_RGB = /#(..)(..)(..)/;

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;
const WATER_NORMALS_URL =
  "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r169/examples/textures/waternormals.jpg";

function mount(card, extraClass) {
  const canvas = document.createElement("canvas");
  canvas.className = `deck-bg ${extraClass}`;
  canvas.setAttribute("aria-hidden", "true");
  card.insertBefore(canvas, card.firstChild);
  card.classList.add("deck-card--bg");
  return canvas;
}

function sizer(card, renderer, camera) {
  let w0 = 0;
  let h0 = 0;
  return () => {
    const w = Math.max(1, card.clientWidth);
    const h = Math.max(1, card.clientHeight);
    if (w === w0 && h === h0) {
      return;
    }
    w0 = w;
    h0 = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
}

// ── Ocean ───────────────────────────────────────────────────────────────────
export function oceanBg(card) {
  const canvas = mount(card, "deck-bg--ocean");
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.35;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 1, 20_000);

  const waterNormals = new THREE.TextureLoader().load(WATER_NORMALS_URL);
  waterNormals.wrapS = THREE.RepeatWrapping;
  waterNormals.wrapT = THREE.RepeatWrapping;
  const water = new Water(new THREE.PlaneGeometry(10_000, 10_000), {
    distortionScale: 3.7,
    fog: false,
    sunColor: 0xff_ff_ff,
    sunDirection: new THREE.Vector3(),
    textureHeight: 512,
    textureWidth: 512,
    waterColor: 0x00_1e_2f,
    waterNormals,
  });
  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  const sky = new Sky();
  sky.scale.setScalar(10_000);
  scene.add(sky);
  const u = sky.material.uniforms;
  u.turbidity.value = 10;
  u.rayleigh.value = 2;
  u.mieCoefficient.value = 0.005;
  u.mieDirectionalG.value = 0.8;
  const sun = new THREE.Vector3().setFromSphericalCoords(
    1,
    THREE.MathUtils.degToRad(90 - 3),
    THREE.MathUtils.degToRad(175)
  );
  u.sunPosition.value.copy(sun);
  water.material.uniforms.sunDirection.value.copy(sun).normalize();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(sky);
  scene.environment = pmrem.fromScene(envScene).texture;
  scene.add(sky);

  const fit = sizer(card, renderer, camera);
  let running = false;
  const draw = () => {
    fit();
    const t = performance.now() * 0.001;
    const ang = reduceMotion ? 2.6 : t * 0.04;
    camera.position.set(Math.cos(ang) * 120, 22, Math.sin(ang) * 120);
    camera.lookAt(0, 6, 0);
    water.material.uniforms.time.value = reduceMotion ? 0 : t;
    renderer.render(scene, camera);
  };
  const frame = () => {
    if (!running) {
      return;
    }
    draw();
    requestAnimationFrame(frame);
  };
  const api = {
    start() {
      if (running || reduceMotion) {
        return;
      }
      running = true;
      requestAnimationFrame(frame);
    },
    stop() {
      running = false;
    },
  };
  draw();
  api.start();
  window.addEventListener("resize", fit);
  return api;
}

// ── Particles ───────────────────────────────────────────────────────────────
const COUNT = 16_000;
const DURATION = 20;
const PARTICLE_SIZE = 5;
const rand = (a, b) => a + Math.random() * (b - a);

const particleVertex = /* glsl */ `
  uniform float uTime;
  uniform float uDuration;
  attribute vec3 aStart;
  attribute vec3 aControl1;
  attribute vec3 aControl2;
  attribute vec3 aEnd;
  attribute vec4 aAxisAngle;
  attribute float aOffset;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  vec3 cubicBezier(vec3 p0, vec3 c1, vec3 c2, vec3 p3, float t) {
    float u = 1.0 - t;
    return u*u*u*p0 + 3.0*u*u*t*c1 + 3.0*u*t*t*c2 + t*t*t*p3;
  }
  mat3 rotationMatrix(vec3 axis, float angle) {
    vec3 a = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float o = 1.0 - c;
    return mat3(
      o*a.x*a.x + c,      o*a.x*a.y - a.z*s,  o*a.x*a.z + a.y*s,
      o*a.x*a.y + a.z*s,  o*a.y*a.y + c,      o*a.y*a.z - a.x*s,
      o*a.x*a.z - a.y*s,  o*a.y*a.z + a.x*s,  o*a.z*a.z + c
    );
  }
  void main() {
    float t = mod(uTime + aOffset, uDuration) / uDuration;
    float env = sin(t * 3.14159265);
    vec3 path = cubicBezier(aStart, aControl1, aControl2, aEnd, t);
    mat3 rot = rotationMatrix(aAxisAngle.xyz, aAxisAngle.w * t);
    vec3 prefab = rot * (position * (0.35 + 0.9 * env));
    vColor = aColor;
    vAlpha = smoothstep(0.0, 0.12, t) * smoothstep(1.0, 0.82, t);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(path + prefab, 1.0);
  }
`;
const particleFragment = /* glsl */ `
  precision mediump float;
  varying vec3 vColor;
  varying float vAlpha;
  void main() { gl_FragColor = vec4(vColor, vAlpha); }
`;

function buildParticles() {
  const base = new THREE.PlaneGeometry(PARTICLE_SIZE, PARTICLE_SIZE);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.setAttribute("position", base.attributes.position);
  const aStart = new Float32Array(COUNT * 3);
  const aC1 = new Float32Array(COUNT * 3);
  const aC2 = new Float32Array(COUNT * 3);
  const aEnd = new Float32Array(COUNT * 3);
  const aAxis = new Float32Array(COUNT * 4);
  const aOffset = new Float32Array(COUNT);
  const aColor = new Float32Array(COUNT * 3);
  const palette = [
    0xb8_a0_d8, 0x8b_9b_d4, 0x7c_bc_d4, 0x8c_c8_a0, 0xd4_cc_80, 0xd8_a8_78,
    0xd4_88_88, 0xd4_a0_b8,
  ].map((h) => new THREE.Color(h));
  const color = new THREE.Color();
  const axis = new THREE.Vector3();
  for (let i = 0; i < COUNT; i += 1) {
    const i3 = i * 3;
    aStart[i3] = -320;
    aC1[i3] = rand(-200, 120);
    aC1[i3 + 1] = rand(120, 260);
    aC1[i3 + 2] = rand(-260, 260);
    aC2[i3] = rand(-40, 220);
    aC2[i3 + 1] = rand(-120, 120);
    aC2[i3 + 2] = rand(-260, 260);
    aEnd[i3] = rand(200, 360);
    aEnd[i3 + 1] = rand(-60, 60);
    aEnd[i3 + 2] = rand(-220, 220);
    axis.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize();
    aAxis.set([axis.x, axis.y, axis.z, rand(Math.PI * 2, Math.PI * 8)], i * 4);
    aOffset[i] = (i / COUNT) * DURATION;
    const f = (i / COUNT) * (palette.length - 1);
    const idx = Math.min(palette.length - 2, Math.floor(f));
    color.copy(palette[idx]).lerp(palette[idx + 1], f - idx);
    aColor.set([color.r, color.g, color.b], i3);
  }
  geo.setAttribute("aStart", new THREE.InstancedBufferAttribute(aStart, 3));
  geo.setAttribute("aControl1", new THREE.InstancedBufferAttribute(aC1, 3));
  geo.setAttribute("aControl2", new THREE.InstancedBufferAttribute(aC2, 3));
  geo.setAttribute("aEnd", new THREE.InstancedBufferAttribute(aEnd, 3));
  geo.setAttribute("aAxisAngle", new THREE.InstancedBufferAttribute(aAxis, 4));
  geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(aOffset, 1));
  geo.setAttribute("aColor", new THREE.InstancedBufferAttribute(aColor, 3));
  geo.instanceCount = COUNT;
  const material = new THREE.ShaderMaterial({
    depthWrite: false,
    fragmentShader: particleFragment,
    side: THREE.DoubleSide,
    transparent: true,
    uniforms: { uDuration: { value: DURATION }, uTime: { value: 0 } },
    vertexShader: particleVertex,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  return mesh;
}

export function particlesBg(card) {
  const canvas = mount(card, "deck-bg--particles");
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x00_00_00, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 5000);
  camera.position.set(0, 120, 360);
  camera.lookAt(30, 40, 0);
  const points = buildParticles();
  scene.add(points);
  const clock = new THREE.Clock();
  const fit = sizer(card, renderer, camera);
  let running = false;
  const frame = () => {
    if (!running) {
      return;
    }
    fit();
    points.material.uniforms.uTime.value = clock.getElapsedTime() % DURATION;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };
  const api = {
    start() {
      if (running || reduceMotion) {
        return;
      }
      running = true;
      requestAnimationFrame(frame);
    },
    stop() {
      running = false;
    },
  };
  fit();
  points.material.uniforms.uTime.value = DURATION * 0.35;
  renderer.render(scene, camera);
  api.start();
  window.addEventListener("resize", fit);
  return api;
}

// ── Instances background: a field of lesions of very unequal size, each in
// its own pastel hue, drifting and breathing. Echoes the instance diagram. ──
export function instancesBg(card) {
  const canvas = mount(card, "deck-bg--instances");
  const ctx = canvas.getContext("2d");
  const hues = [
    "#b8a0d8",
    "#8b9bd4",
    "#7cbcd4",
    "#8cc8a0",
    "#d4cc80",
    "#d8a878",
    "#d48888",
    "#d4a0b8",
  ];
  const rgb = (hex) =>
    hex
      .match(HEX_RGB)
      .slice(1)
      .map((h) => Number.parseInt(h, 16));
  const blobs = [];
  // One big instance, a few medium, many tiny: the imbalance is the point.
  const radii = [
    0.19, 0.11, 0.08, 0.06, 0.045, 0.035, 0.03, 0.025, 0.02, 0.018, 0.015,
    0.013,
  ];
  radii.forEach((r, i) => {
    blobs.push({
      c: rgb(hues[i % hues.length]),
      p: Math.random() * Math.PI * 2,
      r,
      vx: rand(-0.012, 0.012),
      vy: rand(-0.008, 0.008),
      x: rand(0.12, 0.88),
      y: rand(0.1, 0.62),
    });
  });
  let last = performance.now();
  const draw = (dt) => {
    const w = Math.max(1, card.clientWidth);
    const h = Math.max(1, card.clientHeight);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.clearRect(0, 0, w, h);
    const s = Math.min(w, h);
    for (const b of blobs) {
      if (!reduceMotion) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < 0.05 || b.x > 0.95) {
          b.vx *= -1;
        }
        if (b.y < 0.05 || b.y > 0.7) {
          b.vy *= -1;
        }
        b.p += dt * 0.9;
      }
      const pulse = 1 + 0.06 * Math.sin(b.p);
      const R = b.r * s * pulse;
      const [cr, cg, cb] = b.c;
      const g = ctx.createRadialGradient(
        b.x * w - R * 0.3,
        b.y * h - R * 0.3,
        R * 0.1,
        b.x * w,
        b.y * h,
        R
      );
      g.addColorStop(0, `rgba(${cr},${cg},${cb},0.85)`);
      g.addColorStop(1, `rgba(${cr},${cg},${cb},0.35)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x * w, b.y * h, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${0.35 + 0.3 * Math.sin(b.p + 1)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(b.x * w, b.y * h, R + 3 + 2 * Math.sin(b.p), 0, Math.PI * 2);
      ctx.stroke();
    }
  };
  let running = false;
  const frame = () => {
    if (!running) {
      return;
    }
    const now = performance.now();
    draw((now - last) / 1000);
    last = now;
    requestAnimationFrame(frame);
  };
  draw(0);
  const api = {
    start() {
      if (running || reduceMotion) {
        return;
      }
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    },
    stop() {
      running = false;
    },
  };
  api.start();
  window.addEventListener("resize", () => draw(0));
  return api;
}

// ── Tiles background: thread blocks sweeping a tiled matrix in a wavefront ──
export function tilesBg(card, tint = "#8cc8a0") {
  const canvas = mount(card, "deck-bg--tiles");
  const ctx = canvas.getContext("2d");
  const cols = 9;
  const rows = 12;
  const tintRgb = (() => {
    const m = tint.match(HEX_RGB);
    return m ? m.slice(1).map((h) => Number.parseInt(h, 16)) : [140, 200, 160];
  })();
  const draw = (t) => {
    const w = Math.max(1, card.clientWidth);
    const h = Math.max(1, card.clientHeight);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.clearRect(0, 0, w, h);
    const cw = w / cols;
    const ch = h / rows;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const phase = (r + c) * 0.45 - t * 1.6;
        const a = 0.5 + 0.5 * Math.sin(phase);
        const lit = a * a;
        ctx.fillStyle = `rgba(${tintRgb[0]},${tintRgb[1]},${tintRgb[2]},${0.05 + 0.75 * lit})`;
        ctx.fillRect(c * cw + 1, r * ch + 1, cw - 2, ch - 2);
      }
    }
  };
  let running = false;
  const t0 = performance.now();
  const frame = () => {
    if (!running) {
      return;
    }
    draw((performance.now() - t0) / 1000);
    requestAnimationFrame(frame);
  };
  draw(0);
  const api = {
    start() {
      if (running || reduceMotion) {
        return;
      }
      running = true;
      requestAnimationFrame(frame);
    },
    stop() {
      running = false;
    },
  };
  api.start();
  window.addEventListener("resize", () =>
    draw((performance.now() - t0) / 1000)
  );
  return api;
}
