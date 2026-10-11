// Live orbs and backgrounds ported from src-minimal: a drifting field of
// unequal lesions behind Instance Metrics, beads riding a transport plan
// between two rings on Optimal Transport, and a 4x4x4 tile block over a
// tiled-matrix sweep on CUDA Kernels. Also exposes the Sinkhorn demo to
// research.js (a classic script) for the Optimal Transport modal.
// Rendering runs only while the Research section is showing and the tab is
// visible, and holds still under reduced motion.
import * as THREE from "https://esm.sh/three@0.169.0";
import { buildSinkhornDemo } from "./sinkhorn-demo.js";

window.buildSinkhornDemo = buildSinkhornDemo;

const HEX_RGB = /#(..)(..)(..)/;

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

function mount(card, extraClass) {
  const canvas = document.createElement("canvas");
  canvas.className = `research-card-bg-canvas ${extraClass}`;
  canvas.setAttribute("aria-hidden", "true");
  card.insertBefore(canvas, card.firstChild);
  card.classList.add("research-card--bg");
  return canvas;
}

// ── Transport orb: beads travel between a source ring and a target ring ─────
function transportOrb(canvas, tint = "#7cbcd4") {
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
function tilesOrb(canvas, tint = "#8cc8a0") {
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

// ── Tiles background: thread blocks sweeping a tiled matrix in a wavefront ──
function tilesBg(card, tint = "#8cc8a0") {
  const canvas = mount(card, "research-card-tiles");
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

const rand = (a, b) => a + Math.random() * (b - a);

// ── Instances background: a field of lesions of very unequal size, each in
// its own pastel hue, drifting and breathing. Echoes the instance diagram. ──
function instancesBg(card) {
  const canvas = mount(card, "research-card-instances");
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

function inResearch() {
  return (
    document.documentElement.getAttribute("data-section") === "research" ||
    document.querySelector("#research.section.active") !== null
  );
}

const live = [];
const transportCanvas = document.querySelector(".research-card-orb-transport");
if (transportCanvas) {
  live.push(transportOrb(transportCanvas, "#7cbcd4"));
}
const tilesCanvas = document.querySelector(".research-card-orb-tiles");
if (tilesCanvas) {
  live.push(tilesOrb(tilesCanvas, "#8cc8a0"));
}
const instanceCard = document.querySelector(
  '.research-card[data-id="instance-metrics"]'
);
if (instanceCard) {
  live.push(instancesBg(instanceCard));
}
const cudaCard = document.querySelector(
  '.research-card[data-id="cuda-kernels"]'
);
if (cudaCard) {
  live.push(tilesBg(cudaCard, "#8cc8a0"));
}

function sync() {
  for (const o of live) {
    if (document.hidden || !inResearch()) {
      o.stop();
    } else {
      o.start();
    }
  }
}
sync();
document.addEventListener("visibilitychange", sync);
new MutationObserver(sync).observe(document.documentElement, {
  attributeFilter: ["data-section"],
  attributes: true,
});
