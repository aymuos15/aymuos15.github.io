// WebGL ocean background for the Segmentation research card.
// Adapted from the three.js webgl_shaders_ocean example (classic Water + Sky on
// the WebGL renderer). We deliberately avoid the WebGPU renderer here: pairing
// WebGPURenderer with the example WaterMesh/SkyMesh pulls in a second Three.js
// instance whose node materials never bind to the renderer, and on many
// GPU/driver combos (e.g. Mesa Intel) WebGPU reports an adapter yet paints
// nothing — so the card silently came up blank. Plain WebGL is the same
// single-instance path the Instance Metrics card already uses reliably.
// The camera slowly orbits so the water and sky drift behind the card content.
// Renders only while the Research section is showing, and holds still under
// reduced motion.
import * as THREE from 'https://esm.sh/three@0.169.0';
import { Water } from 'https://esm.sh/three@0.169.0/examples/jsm/objects/Water.js';
import { Sky } from 'https://esm.sh/three@0.169.0/examples/jsm/objects/Sky.js';

const card = document.querySelector('.research-card[data-id="segmentation"]');
const WATER_NORMALS_URL = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r169/examples/textures/waternormals.jpg';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer, scene, camera, water, running = false, ready = false;

function inResearch() {
    return document.documentElement.getAttribute('data-section') === 'research'
        || document.querySelector('#research.section.active') !== null;
}

let sizedW = 0, sizedH = 0;

function sizeToCard() {
    const w = Math.max(1, card.clientWidth);
    const h = Math.max(1, card.clientHeight);
    if (w === sizedW && h === sizedH) return;
    sizedW = w; sizedH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}

function init(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.35;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, 1, 1, 20000);

    const sun = new THREE.Vector3();

    // Water
    const waterNormals = new THREE.TextureLoader().load(WATER_NORMALS_URL);
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

    water = new Water(
        new THREE.PlaneGeometry(10000, 10000),
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals,
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e2f,
            distortionScale: 3.7,
            fog: false,
        }
    );
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    // Sky
    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);
    const skyU = sky.material.uniforms;
    skyU.turbidity.value = 10;
    skyU.rayleigh.value = 2;
    skyU.mieCoefficient.value = 0.005;
    skyU.mieDirectionalG.value = 0.8;

    const elevation = 3, azimuth = 175;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const sceneEnv = new THREE.Scene();
    let renderTarget;

    function updateSun() {
        const phi = THREE.MathUtils.degToRad(90 - elevation);
        const theta = THREE.MathUtils.degToRad(azimuth);
        sun.setFromSphericalCoords(1, phi, theta);
        skyU.sunPosition.value.copy(sun);
        water.material.uniforms.sunDirection.value.copy(sun).normalize();

        if (renderTarget) renderTarget.dispose();
        sceneEnv.add(sky);
        renderTarget = pmrem.fromScene(sceneEnv);
        scene.add(sky);
        scene.environment = renderTarget.texture;
    }

    updateSun();
    ready = true;
    sizeToCard();
    // First paint runs at the card's tiny home-section size; don't let a hiccup
    // here abort init (and with it the section-switch observer set up below).
    try { renderer.render(scene, camera); } catch { /* the loop paints properly once Research is shown */ }
    ensureRunning();

    window.addEventListener('resize', () => { if (ready) sizeToCard(); });
}

function frame() {
    if (!ready || !inResearch()) { running = false; return; }
    sizeToCard(); // card has real dimensions once its section is visible
    const t = performance.now() * 0.001;
    const ang = reduceMotion ? 2.6 : t * 0.04;
    const radius = 120;
    camera.position.set(Math.cos(ang) * radius, 22, Math.sin(ang) * radius);
    camera.lookAt(0, 6, 0);
    water.material.uniforms.time.value = reduceMotion ? 0 : t;
    renderer.render(scene, camera);
    if (reduceMotion) { running = false; return; }
    requestAnimationFrame(frame);
}

function ensureRunning() {
    if (running || !ready || !inResearch()) return;
    running = true;
    requestAnimationFrame(frame);
}

if (card) {
    const canvas = document.createElement('canvas');
    canvas.className = 'research-card-bg-canvas research-card-ocean';
    canvas.setAttribute('aria-hidden', 'true');
    card.insertBefore(canvas, card.firstChild);
    card.classList.add('research-card--bg');

    // Register the section-switch observer *before* init so the render loop can
    // still be kicked off even if init throws partway through.
    const observer = new MutationObserver(ensureRunning);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-section'] });

    init(canvas);
}
