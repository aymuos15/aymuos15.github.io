// WebGPU ocean background for the Segmentation research card.
// Adapted from the three.js webgpu_ocean example (WaterMesh + SkyMesh on the
// WebGPU renderer, which auto-falls back to WebGL2). Stripped of the example's
// GUI, inspector, bloom and occlusion box; the camera slowly orbits so the
// water and sky drift behind the card content. Renders only while the Research
// section is showing, and holds still under reduced motion.
import * as THREE from 'https://esm.sh/three@0.169.0/webgpu';
import { WaterMesh } from 'https://esm.sh/three@0.169.0/examples/jsm/objects/WaterMesh.js';
import { SkyMesh } from 'https://esm.sh/three@0.169.0/examples/jsm/objects/SkyMesh.js';

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
    renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.35;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, 1, 1, 20000);

    const sun = new THREE.Vector3();

    // Water
    const waterNormals = new THREE.TextureLoader().load(WATER_NORMALS_URL);
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

    water = new WaterMesh(
        new THREE.PlaneGeometry(10000, 10000),
        {
            waterNormals,
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e2f,
            distortionScale: 3.7,
        }
    );
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    // Sky
    const sky = new SkyMesh();
    sky.scale.setScalar(10000);
    scene.add(sky);
    sky.turbidity.value = 10;
    sky.rayleigh.value = 2;
    sky.mieCoefficient.value = 0.005;
    sky.mieDirectionalG.value = 0.8;
    // Clouds only exist on newer builds — set them defensively.
    if (sky.cloudCoverage) sky.cloudCoverage.value = 0.4;
    if (sky.cloudDensity) sky.cloudDensity.value = 0.5;
    if (sky.cloudElevation) sky.cloudElevation.value = 0.5;

    const elevation = 3, azimuth = 175;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const sceneEnv = new THREE.Scene();

    function updateSun() {
        const phi = THREE.MathUtils.degToRad(90 - elevation);
        const theta = THREE.MathUtils.degToRad(azimuth);
        sun.setFromSphericalCoords(1, phi, theta);
        sky.sunPosition.value.copy(sun);
        water.sunDirection.value.copy(sun).normalize();

        sceneEnv.add(sky);
        const rt = pmrem.fromScene(sceneEnv);
        scene.add(sky);
        scene.environment = rt.texture;
    }

    renderer.init().then(() => {
        updateSun();
        ready = true;
        sizeToCard();
        renderer.render(scene, camera); // first paint
        ensureRunning();
    });

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
    init(canvas);

    const observer = new MutationObserver(ensureRunning);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-section'] });
}
