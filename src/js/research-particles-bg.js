// Bézier particle-stream background for the Instance Metrics research card.
// A modern-three (r169) port of Szenia Zadvorsky's "Animated Particles" pen
// (codepen qOYqGv), which used three r73 + the old THREE.BAS library. Here the
// per-particle motion is baked into instanced buffer attributes and evaluated
// in a custom vertex shader: each particle rides its own cubic-bézier curve
// from a shared origin out to a scattered endpoint, spinning as it goes, on a
// staggered loop. Colours follow the instance-diagram VIBGYOR sweep — one hue
// per particle, echoing "every instance weighted equally". WebGL (no WebGPU),
// gated to the Research section, still under reduced motion.
import * as THREE from 'https://esm.sh/three@0.169.0';

const card = document.querySelector('.research-card[data-id="instance-metrics"]');

const COUNT = 16000;
const DURATION = 20;
const PARTICLE_SIZE = 5;

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer, scene, camera, clock, points, running = false, ready = false;
let sizedW = 0, sizedH = 0;

function inResearch() {
    return document.documentElement.getAttribute('data-section') === 'research'
        || document.querySelector('#research.section.active') !== null;
}

function rand(a, b) { return a + Math.random() * (b - a); }

const vertexShader = /* glsl */`
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
        float env = sin(t * 3.14159265);           // 0 at ends, 1 at midpoint

        vec3 path = cubicBezier(aStart, aControl1, aControl2, aEnd, t);
        mat3 rot = rotationMatrix(aAxisAngle.xyz, aAxisAngle.w * t);
        vec3 prefab = rot * (position * (0.35 + 0.9 * env));

        vColor = aColor;
        vAlpha = smoothstep(0.0, 0.12, t) * smoothstep(1.0, 0.82, t);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(path + prefab, 1.0);
    }
`;

const fragmentShader = /* glsl */`
    precision mediump float;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
        gl_FragColor = vec4(vColor, vAlpha);
    }
`;

function buildParticles() {
    const base = new THREE.PlaneGeometry(PARTICLE_SIZE, PARTICLE_SIZE);

    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.setAttribute('position', base.attributes.position);

    const aStart = new Float32Array(COUNT * 3);
    const aControl1 = new Float32Array(COUNT * 3);
    const aControl2 = new Float32Array(COUNT * 3);
    const aEnd = new Float32Array(COUNT * 3);
    const aAxisAngle = new Float32Array(COUNT * 4);
    const aOffset = new Float32Array(COUNT);
    const aColor = new Float32Array(COUNT * 3);

    // The instance-diagram's pastel VIBGYOR palette — one soft hue per instance.
    const palette = [0xb8a0d8, 0x8b9bd4, 0x7cbcd4, 0x8cc8a0, 0xd4cc80, 0xd8a878, 0xd48888, 0xd4a0b8]
        .map(h => new THREE.Color(h));
    const color = new THREE.Color();
    const cA = new THREE.Color();
    const cB = new THREE.Color();
    const axis = new THREE.Vector3();

    for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3;

        // Shared origin on the left; arc up and over to a scattered endpoint.
        aStart[i3] = -320; aStart[i3 + 1] = 0; aStart[i3 + 2] = 0;

        aControl1[i3] = rand(-200, 120); aControl1[i3 + 1] = rand(120, 260); aControl1[i3 + 2] = rand(-260, 260);
        aControl2[i3] = rand(-40, 220);  aControl2[i3 + 1] = rand(-120, 120); aControl2[i3 + 2] = rand(-260, 260);
        aEnd[i3] = rand(200, 360);       aEnd[i3 + 1] = rand(-60, 60);        aEnd[i3 + 2] = rand(-220, 220);

        axis.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize();
        aAxisAngle[i * 4] = axis.x;
        aAxisAngle[i * 4 + 1] = axis.y;
        aAxisAngle[i * 4 + 2] = axis.z;
        aAxisAngle[i * 4 + 3] = rand(Math.PI * 2, Math.PI * 8);

        aOffset[i] = (i / COUNT) * DURATION;

        // Interpolate across the pastel palette so each particle gets a soft hue.
        const f = (i / COUNT) * (palette.length - 1);
        const idx = Math.min(palette.length - 2, Math.floor(f));
        cA.copy(palette[idx]);
        cB.copy(palette[idx + 1]);
        color.copy(cA).lerp(cB, f - idx);
        aColor[i3] = color.r; aColor[i3 + 1] = color.g; aColor[i3 + 2] = color.b;
    }

    geo.setAttribute('aStart', new THREE.InstancedBufferAttribute(aStart, 3));
    geo.setAttribute('aControl1', new THREE.InstancedBufferAttribute(aControl1, 3));
    geo.setAttribute('aControl2', new THREE.InstancedBufferAttribute(aControl2, 3));
    geo.setAttribute('aEnd', new THREE.InstancedBufferAttribute(aEnd, 3));
    geo.setAttribute('aAxisAngle', new THREE.InstancedBufferAttribute(aAxisAngle, 4));
    geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(aOffset, 1));
    geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(aColor, 3));
    geo.instanceCount = COUNT;

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uDuration: { value: DURATION },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
    });

    points = new THREE.Mesh(geo, material);
    points.frustumCulled = false;
    scene.add(points);
}

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
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, 1, 0.1, 5000);
    camera.position.set(0, 120, 360);
    camera.lookAt(30, 40, 0);

    clock = new THREE.Clock();
    buildParticles();

    ready = true;
    sizeToCard();
    points.material.uniforms.uTime.value = DURATION * 0.35;
    renderer.render(scene, camera); // first paint
    if (!reduceMotion) ensureRunning();

    window.addEventListener('resize', () => { if (ready) sizeToCard(); });
}

function frame() {
    if (!ready || reduceMotion || !inResearch()) { running = false; return; }
    sizeToCard();
    points.material.uniforms.uTime.value = clock.getElapsedTime() % DURATION;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
}

function ensureRunning() {
    if (running || !ready || reduceMotion || !inResearch()) return;
    running = true;
    requestAnimationFrame(frame);
}

if (card) {
    const canvas = document.createElement('canvas');
    canvas.className = 'research-card-bg-canvas research-card-particles';
    canvas.setAttribute('aria-hidden', 'true');
    card.insertBefore(canvas, card.firstChild);
    card.classList.add('research-card--bg');
    init(canvas);

    const observer = new MutationObserver(ensureRunning);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-section'] });
}
