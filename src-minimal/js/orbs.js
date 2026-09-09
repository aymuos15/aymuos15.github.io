// Live 3D orbs for the project cards, ported from the main site:
// a scanned-head CT volume that scrubs through its slices, and a
// phyllotaxis dotted sphere that ripples as it turns. These keep the main
// site's original colours, and pause when the tab is hidden or the user
// prefers reduced motion.
// biome-ignore lint/performance/noNamespaceImport: three.js namespace from a CDN URL module
import * as THREE from "https://esm.sh/three@0.169.0";
import { unzipSync } from "https://esm.sh/three@0.169.0/examples/jsm/libs/fflate.module.js";

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// ── Scanned head ────────────────────────────────────────────────────────────
const VOLUME_URL =
  "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r169/examples/textures/3d/head256x256x109.zip";
const DEPTH_MIN = 28;
const DEPTH_MAX = 88;
const DEPTH_MID = (DEPTH_MIN + DEPTH_MAX) / 2;
const DEPTH_AMP = (DEPTH_MAX - DEPTH_MIN) / 2;
const PLANE = 50;

const headVertex = /* glsl */ `
  uniform vec2 size;
  out vec2 vUv;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vUv.xy = position.xy / size + 0.5;
    vUv.y = 1.0 - vUv.y;
  }
`;
const headFragment = /* glsl */ `
  precision highp float;
  precision highp int;
  precision highp sampler2DArray;
  uniform sampler2DArray diffuse;
  uniform float depth;
  in vec2 vUv;
  out vec4 outColor;
  void main() {
    float v = texture( diffuse, vec3( vUv, depth ) ).r;
    // Head opaque and near-white, air transparent, so it floats on the card.
    outColor = vec4( vec3( v * 1.75 ), smoothstep( 0.04, 0.24, v ) );
  }
`;

export function headOrb(canvas) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(canvas.width, canvas.height, false);
  renderer.setClearColor(0x00_00_00, 0);
  const scene = new THREE.Scene();
  const h = PLANE / 2;
  const camera = new THREE.OrthographicCamera(-h, h, h, -h, 0.1, 1000);
  camera.position.z = 100;
  let material = null;
  let phase = 0;
  let running = false;

  const render = () => renderer.render(scene, camera);
  const tick = () => {
    if (!running) {
      return;
    }
    phase += 0.006;
    material.uniforms.depth.value = DEPTH_MID + DEPTH_AMP * Math.sin(phase);
    render();
    requestAnimationFrame(tick);
  };
  const api = {
    retheme() {
      /* nothing to retheme: this orb uses fixed colours */
    },
    start() {
      if (running || !material || reduceMotion) {
        return;
      }
      running = true;
      requestAnimationFrame(tick);
    },
    stop() {
      running = false;
    },
  };

  new THREE.FileLoader()
    .setResponseType("arraybuffer")
    .load(VOLUME_URL, (data) => {
      const zip = unzipSync(new Uint8Array(data));
      const array = new Uint8Array(zip.head256x256x109.buffer);
      const texture = new THREE.DataArrayTexture(array, 256, 256, 109);
      texture.format = THREE.RedFormat;
      texture.needsUpdate = true;
      material = new THREE.ShaderMaterial({
        fragmentShader: headFragment,
        glslVersion: THREE.GLSL3,
        transparent: true,
        uniforms: {
          depth: { value: DEPTH_MID },
          diffuse: { value: texture },
          size: { value: new THREE.Vector2(PLANE, PLANE) },
        },
        vertexShader: headVertex,
      });
      scene.add(
        new THREE.Mesh(new THREE.PlaneGeometry(PLANE, PLANE), material)
      );
      render();
      api.start();
    });
  return api;
}

// ── Dotted sphere ───────────────────────────────────────────────────────────
const DOTS = 620;
const DOT_R = 0.052;
const WAVE_AMP = 0.11;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

export function sphereOrb(canvas) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.width, canvas.height, false);
  renderer.setClearColor(0x00_00_00, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 3.5);
  scene.add(new THREE.AmbientLight(0xff_ff_ff, 1.6));
  const key = new THREE.PointLight(0xff_ff_ff, 40, 0, 2);
  key.position.set(2.5, 3, 4);
  scene.add(key);
  const group = new THREE.Group();
  scene.add(group);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xde_de_de,
    metalness: 0,
    roughness: 0.75,
  });
  const rim = new THREE.PointLight(0xff_ff_ff, 12, 0, 2);
  rim.position.set(-3, -1, -2);
  scene.add(rim);
  const mesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(DOT_R, 8, 8),
    mat,
    DOTS
  );
  group.add(mesh);
  const dummy = new THREE.Object3D();
  const dirs = [];
  const phis = [];
  for (let i = 0; i < DOTS; i += 1) {
    const y = 1 - (i / (DOTS - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * GOLDEN;
    dirs.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
    phis.push(Math.acos(y));
  }
  const update = (t) => {
    for (let i = 0; i < DOTS; i += 1) {
      const w = Math.sin(t * 1.6 - phis[i] * 6.5);
      const d = 1 + WAVE_AMP * w;
      const p = dirs[i];
      dummy.position.set(p.x * d, p.y * d, p.z * d);
      dummy.scale.setScalar(0.8 + 0.5 * (0.5 + 0.5 * w));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  const clock = new THREE.Clock();
  let running = false;
  const render = () => renderer.render(scene, camera);
  const frame = () => {
    if (!running) {
      return;
    }
    const t = clock.getElapsedTime();
    update(t);
    group.rotation.y = t * 0.35;
    group.rotation.x = Math.sin(t * 0.2) * 0.25;
    render();
    requestAnimationFrame(frame);
  };
  update(0);
  group.rotation.x = 0.2;
  render();
  const api = {
    retheme() {
      /* nothing to retheme: this orb uses fixed colours */
    },
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
  return api;
}

// ── Transport orb: beads travel between a source ring and a target ring ─────
export function transportOrb(canvas, tint = "#7cbcd4") {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.width, canvas.height, false);
  renderer.setClearColor(0x00_00_00, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.9, 3.4);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xff_ff_ff, 1.4));
  const key = new THREE.PointLight(0xff_ff_ff, 30, 0, 2);
  key.position.set(2, 3, 3);
  scene.add(key);
  const group = new THREE.Group();
  scene.add(group);

  const N = 12; // points per side
  const R = 0.95;
  const color = new THREE.Color(tint);
  const src = [];
  const dst = [];
  for (let i = 0; i < N; i += 1) {
    const a = (i / N) * Math.PI * 2;
    src.push(new THREE.Vector3(Math.cos(a) * R, -0.55, Math.sin(a) * R));
    dst.push(
      new THREE.Vector3(
        Math.cos(a + 0.9) * R * 0.7,
        0.55,
        Math.sin(a + 0.9) * R * 0.7
      )
    );
  }
  const dotGeo = new THREE.SphereGeometry(0.045, 8, 8);
  const dotMat = new THREE.MeshStandardMaterial({
    color: 0xde_de_de,
    roughness: 0.8,
  });
  const dots = new THREE.InstancedMesh(dotGeo, dotMat, N * 2);
  const dummy = new THREE.Object3D();
  [...src, ...dst].forEach((p, i) => {
    dummy.position.copy(p);
    dummy.updateMatrix();
    dots.setMatrixAt(i, dummy.matrix);
  });
  group.add(dots);

  // Chords of the transport plan: each source sends to two targets.
  const pairs = [];
  for (let i = 0; i < N; i += 1) {
    pairs.push([i, (i + 2) % N]);
    pairs.push([i, (i + 5) % N]);
  }
  const lineGeo = new THREE.BufferGeometry();
  const linePos = new Float32Array(pairs.length * 6);
  pairs.forEach(([a, b], k) => {
    linePos.set(
      [src[a].x, src[a].y, src[a].z, dst[b].x, dst[b].y, dst[b].z],
      k * 6
    );
  });
  lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
  group.add(
    new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({ color, opacity: 0.35, transparent: true })
    )
  );

  const BEADS = pairs.length;
  const beads = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.035, 8, 8),
    new THREE.MeshStandardMaterial({ color, roughness: 0.5 }),
    BEADS
  );
  group.add(beads);
  const offsets = pairs.map((_, k) => (k / BEADS) * 1.0);
  const tmp = new THREE.Vector3();
  const update = (t) => {
    pairs.forEach(([a, b], k) => {
      const u = (t * 0.25 + offsets[k]) % 1;
      tmp.lerpVectors(src[a], dst[b], u);
      dummy.position.copy(tmp);
      dummy.scale.setScalar(0.7 + 0.6 * Math.sin(u * Math.PI));
      dummy.updateMatrix();
      beads.setMatrixAt(k, dummy.matrix);
    });
    beads.instanceMatrix.needsUpdate = true;
  };
  const clock = new THREE.Clock();
  let running = false;
  const render = () => renderer.render(scene, camera);
  const frame = () => {
    if (!running) {
      return;
    }
    const t = clock.getElapsedTime();
    update(t);
    group.rotation.y = t * 0.3;
    render();
    requestAnimationFrame(frame);
  };
  update(0);
  render();
  const api = {
    retheme() {
      /* nothing to retheme: this orb uses fixed colours */
    },
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
  return api;
}

// ── Tiles orb: a 4x4x4 block of tiles lighting up in wavefronts ─────────────
export function tilesOrb(canvas, tint = "#8cc8a0") {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.width, canvas.height, false);
  renderer.setClearColor(0x00_00_00, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(2.6, 2.2, 2.6);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xff_ff_ff, 1.2));
  const key = new THREE.DirectionalLight(0xff_ff_ff, 2.2);
  key.position.set(3, 4, 2);
  scene.add(key);
  const group = new THREE.Group();
  scene.add(group);
  const S = 4;
  const step = 0.42;
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.3),
    new THREE.MeshStandardMaterial({ metalness: 0.05, roughness: 0.7 }),
    S * S * S
  );
  const dummy = new THREE.Object3D();
  const base = new THREE.Color(0xd8_d8_d8);
  const lit = new THREE.Color(tint);
  const c = new THREE.Color();
  const cells = [];
  let k = 0;
  for (let x = 0; x < S; x += 1) {
    for (let y = 0; y < S; y += 1) {
      for (let z = 0; z < S; z += 1) {
        dummy.position.set(
          (x - 1.5) * step,
          (y - 1.5) * step,
          (z - 1.5) * step
        );
        dummy.updateMatrix();
        mesh.setMatrixAt(k, dummy.matrix);
        cells.push(x + y + z);
        k += 1;
      }
    }
  }
  group.add(mesh);
  const update = (t) => {
    for (let i = 0; i < cells.length; i += 1) {
      const w = 0.5 + 0.5 * Math.sin(t * 2.2 - cells[i] * 0.7);
      c.copy(base).lerp(lit, w * w);
      mesh.setColorAt(i, c);
    }
    mesh.instanceColor.needsUpdate = true;
  };
  const clock = new THREE.Clock();
  let running = false;
  const render = () => renderer.render(scene, camera);
  const frame = () => {
    if (!running) {
      return;
    }
    const t = clock.getElapsedTime();
    update(t);
    group.rotation.y = t * 0.25;
    render();
    requestAnimationFrame(frame);
  };
  update(0);
  render();
  const api = {
    retheme() {
      /* nothing to retheme: this orb uses fixed colours */
    },
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
  return api;
}
