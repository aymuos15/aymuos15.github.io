// Phyllotaxis dotted-sphere orb for the Instance Metrics research card.
// Inspired by the "Threejs Challenge #0" dotted sphere: a Fibonacci lattice of
// small instanced spheres tiling a larger sphere, with a time-driven radial
// wave rippling out from the poles so the surface breathes as it rotates.
// Grayscale + softly lit to sit in the site's MRI-scan language. WebGL (r169),
// gated to the Research section, static under reduced motion.
import * as THREE from 'https://esm.sh/three@0.169.0';

const canvas = document.querySelector('.research-card-orb-sphere');

const DOTS = 620;
const BASE_R = 1.0;
const DOT_R = 0.052;
const WAVE_AMP = 0.11;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer, scene, camera, group, mesh, clock, running = false, ready = false;
const dummy = new THREE.Object3D();
const dirs = [];   // unit direction per dot
const phis = [];   // polar angle per dot (for the wave)

function inResearch() {
    return document.documentElement.getAttribute('data-section') === 'research'
        || document.querySelector('#research.section.active') !== null;
}

function build() {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.width, canvas.height, false);
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 3.5);

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const key = new THREE.PointLight(0xffffff, 40, 0, 2);
    key.position.set(2.5, 3, 4);
    scene.add(key);
    const rim = new THREE.PointLight(0xffffff, 12, 0, 2);
    rim.position.set(-3, -1, -2);
    scene.add(rim);

    group = new THREE.Group();
    scene.add(group);

    const geo = new THREE.SphereGeometry(DOT_R, 10, 10);
    const mat = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.75, metalness: 0.0 });
    mesh = new THREE.InstancedMesh(geo, mat, DOTS);
    group.add(mesh);

    for (let i = 0; i < DOTS; i++) {
        const y = 1 - (i / (DOTS - 1)) * 2;      // 1 → -1
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = i * GOLDEN;
        dirs.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
        phis.push(Math.acos(y));                 // 0 at top pole → π at bottom
    }

    ready = true;
}

function updateDots(time) {
    for (let i = 0; i < DOTS; i++) {
        const d = BASE_R + WAVE_AMP * Math.sin(time * 1.6 - phis[i] * 6.5);
        const p = dirs[i];
        dummy.position.set(p.x * d, p.y * d, p.z * d);
        const s = 0.8 + 0.5 * (0.5 + 0.5 * Math.sin(time * 1.6 - phis[i] * 6.5));
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
}

function frame() {
    if (!ready || reduceMotion || !inResearch()) { running = false; return; }
    const t = clock.getElapsedTime();
    updateDots(t);
    group.rotation.y = t * 0.35;
    group.rotation.x = Math.sin(t * 0.2) * 0.25;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
}

function ensureRunning() {
    if (running || !ready || reduceMotion || !inResearch()) return;
    running = true;
    requestAnimationFrame(frame);
}

if (canvas) {
    build();
    clock = new THREE.Clock();
    updateDots(0);
    group.rotation.x = 0.2;
    renderer.render(scene, camera); // first paint
    if (!reduceMotion) ensureRunning();

    const observer = new MutationObserver(ensureRunning);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-section'] });
}
