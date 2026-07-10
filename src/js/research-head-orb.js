// Live scanned-head volume for the Segmentation research card.
// Reuses the three.js webgl_texture2darray example (256x256x109 CT volume,
// WebGL2 sampler2DArray) — the same volume as the corner head-scan ornament —
// but here it floats on the card's tinted disc and slowly scrubs through the
// slice stack so it reads as an active scan. Renders only while the Research
// section is showing; a single static slice under reduced-motion.
import * as THREE from 'https://esm.sh/three@0.169.0';
import { unzipSync } from 'https://esm.sh/three@0.169.0/examples/jsm/libs/fflate.module.js';

const canvas = document.querySelector('.research-card-orb-scan');

const VOLUME_URL = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r169/examples/textures/3d/head256x256x109.zip';

// Scrub through the anatomically rich middle of the 109-slice stack.
const DEPTH_MIN = 28;
const DEPTH_MAX = 88;
const DEPTH_MID = (DEPTH_MIN + DEPTH_MAX) / 2;
const DEPTH_AMP = (DEPTH_MAX - DEPTH_MIN) / 2;
const SCRUB_SPEED = 0.006; // radians/frame — a slow, calm sweep

const PLANE = 50;

const vertexShader = /* glsl */`
    uniform vec2 size;
    out vec2 vUv;
    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        vUv.xy = position.xy / size + 0.5;
        vUv.y = 1.0 - vUv.y; // source data is upside down
    }
`;

const fragmentShader = /* glsl */`
    precision highp float;
    precision highp int;
    precision highp sampler2DArray;

    uniform sampler2DArray diffuse;
    uniform float depth;
    in vec2 vUv;
    out vec4 outColor;

    void main() {
        float v = texture( diffuse, vec3( vUv, depth ) ).r;
        // Head opaque and near-white, air transparent, so it floats on the disc.
        outColor = vec4( vec3( v * 1.75 ), smoothstep( 0.04, 0.24, v ) );
    }
`;

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer, scene, camera, mesh;
let ready = false;
let running = false;
let phase = 0;

function inResearch() {
    return document.documentElement.getAttribute('data-section') === 'research'
        || document.querySelector('#research.section.active') !== null;
}

function build() {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(1);
    renderer.setSize(canvas.width, canvas.height, false);
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();

    const h = PLANE / 2;
    camera = new THREE.OrthographicCamera(-h, h, h, -h, 0.1, 1000);
    camera.position.z = 100;

    new THREE.FileLoader()
        .setResponseType('arraybuffer')
        .load(VOLUME_URL, (data) => {
            const zip = unzipSync(new Uint8Array(data));
            const array = new Uint8Array(zip['head256x256x109'].buffer);

            const texture = new THREE.DataArrayTexture(array, 256, 256, 109);
            texture.format = THREE.RedFormat;
            texture.needsUpdate = true;

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    diffuse: { value: texture },
                    depth: { value: DEPTH_MID },
                    size: { value: new THREE.Vector2(PLANE, PLANE) }
                },
                vertexShader,
                fragmentShader,
                glslVersion: THREE.GLSL3,
                transparent: true
            });

            mesh = new THREE.Mesh(new THREE.PlaneGeometry(PLANE, PLANE), material);
            scene.add(mesh);
            ready = true;

            renderer.render(scene, camera); // first paint at the mid slice
            if (!reduceMotion) ensureRunning();
        });
}

function tick() {
    if (!ready || reduceMotion || !inResearch()) { running = false; return; }
    phase += SCRUB_SPEED;
    mesh.material.uniforms.depth.value = DEPTH_MID + DEPTH_AMP * Math.sin(phase);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
}

function ensureRunning() {
    if (running || !ready || reduceMotion || !inResearch()) return;
    running = true;
    requestAnimationFrame(tick);
}

if (canvas) {
    build();
    const observer = new MutationObserver(ensureRunning);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-section'] });
}
