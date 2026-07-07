// Instanced-scatter ornament for the Research section's theme toggle.
// A miniature of https://threejs.org/examples/#webgl_instancing_scatter:
// colourful blossoms scattered over a rotating torus knot via
// MeshSurfaceSampler, each growing and dying on a lifecycle curve.
// Rendered into the .theme-scatter canvas that sits inside the theme
// button, so clicking it still toggles light/dark (handled by theme.js).
import * as THREE from 'https://esm.sh/three@0.169.0';
import { MeshSurfaceSampler } from 'https://esm.sh/three@0.169.0/examples/jsm/math/MeshSurfaceSampler.js';

const canvas = document.querySelector('.theme-scatter');

const COUNT = 200;
const BLOSSOM_PALETTE = [0xf20587, 0xf2d479, 0xf2c879, 0xf2b077, 0xf24405];
const SURFACE_COLOR = { light: 0xdad7cc, dark: 0x2a2a28 };

const ages = new Float32Array(COUNT);
const scales = new Float32Array(COUNT);
const dummy = new THREE.Object3D();
const _position = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _scale = new THREE.Vector3();

// Same scaling curve as the reference example: quick growth, a long
// plateau near full scale, then a quick fade.
const easeOutCubic = (t) => (--t) * t * t + 1;
const scaleCurve = (t) => Math.abs(easeOutCubic((t > 0.5 ? 1 - t : t) * 2));

let renderer, scene, camera, surfaceMaterial, blossomMesh, sampler;
let started = false;
let running = false;
let frame = 0;

function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function resampleParticle(i) {
    sampler.sample(_position, _normal);
    _normal.add(_position);

    dummy.position.copy(_position);
    dummy.scale.setScalar(scales[i]);
    dummy.lookAt(_normal);
    dummy.updateMatrix();

    blossomMesh.setMatrixAt(i, dummy.matrix);
}

function updateParticle(i) {
    ages[i] += 0.006;

    if (ages[i] >= 1) {
        ages[i] = 0.001;
        scales[i] = scaleCurve(ages[i]);
        resampleParticle(i);
        return;
    }

    const prev = scales[i];
    scales[i] = scaleCurve(ages[i]);
    _scale.setScalar(scales[i] / prev);

    blossomMesh.getMatrixAt(i, dummy.matrix);
    dummy.matrix.scale(_scale);
    blossomMesh.setMatrixAt(i, dummy.matrix);
}

function build() {
    const surfaceGeometry = new THREE.TorusKnotGeometry(10, 3, 100, 16).toNonIndexed();
    surfaceMaterial = new THREE.MeshLambertMaterial({ color: SURFACE_COLOR[currentTheme()] });
    const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);

    const blossomGeometry = new THREE.IcosahedronGeometry(0.9, 0);
    const blossomMaterial = new THREE.MeshLambertMaterial({ vertexColors: false });
    blossomMesh = new THREE.InstancedMesh(blossomGeometry, blossomMaterial, COUNT);
    blossomMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const color = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
        color.setHex(BLOSSOM_PALETTE[Math.floor((i * 2654435761 % COUNT) / COUNT * BLOSSOM_PALETTE.length)]);
        blossomMesh.setColorAt(i, color);
    }

    sampler = new MeshSurfaceSampler(surface).build();
    for (let i = 0; i < COUNT; i++) {
        ages[i] = i / COUNT;
        scales[i] = scaleCurve(ages[i]);
        resampleParticle(i);
    }
    blossomMesh.instanceMatrix.needsUpdate = true;

    scene = new THREE.Scene();
    scene.add(surface, blossomMesh);
    scene.add(new THREE.AmbientLight(0xffffff, 2.4));
    const point = new THREE.PointLight(0xffffff, 2.2, 0, 0);
    point.position.set(30, -20, 45);
    scene.add(point);

    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(26, 26, 26);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.width, canvas.height, false);
}

function tick() {
    if (!running) return;
    frame++;
    const t = frame * 0.016;
    scene.rotation.x = Math.sin(t / 4);
    scene.rotation.y = Math.sin(t / 2);

    for (let i = 0; i < COUNT; i++) updateParticle(i);
    blossomMesh.instanceMatrix.needsUpdate = true;
    blossomMesh.computeBoundingSphere();

    surfaceMaterial.color.setHex(SURFACE_COLOR[currentTheme()]);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
}

function start() {
    if (!started) { build(); started = true; }
    if (running) return;
    running = true;
    requestAnimationFrame(tick);
}

function stop() {
    running = false;
}

// Run the WebGL loop only while the Research section is showing.
function sync() {
    if (document.documentElement.getAttribute('data-section') === 'research') start();
    else stop();
}

if (canvas) {
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-section'] });
    sync();
}
