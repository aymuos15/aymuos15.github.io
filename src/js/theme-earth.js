// Rotating Earth ornament for the Gallery section's theme toggle.
// A WebGL take on the three.js webgpu_tsl_earth example: a day-textured
// globe whose dark side lights up with city lights, wrapped in a thin
// cloud layer and a soft atmospheric rim. Rendered into the .theme-earth
// canvas inside the theme button, so clicking it still toggles the theme
// (handled by theme.js). Runs only while Gallery is the active section.
import * as THREE from 'https://esm.sh/three@0.169.0';

const canvas = document.querySelector('.theme-earth');

// Served from the three.js repo (the npm package omits example textures).
const TEX = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r169/examples/textures/planets/';

let renderer, scene, camera, earth, clouds;
let started = false;
let running = false;

// Day/night shader: blend the daytime map into the night-lights map
// across the terminator, driven by the sun direction.
const earthVertex = /* glsl */`
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
        vUv = uv;
        vNormal = normalize( normalMatrix * normal );
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
`;

const earthFragment = /* glsl */`
    uniform sampler2D dayMap;
    uniform sampler2D nightMap;
    uniform vec3 sunDirection;
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
        float intensity = dot( normalize( vNormal ), normalize( sunDirection ) );
        float mixAmount = smoothstep( -0.3, 0.2, intensity );
        vec3 day = texture2D( dayMap, vUv ).rgb * 1.2;
        vec3 night = texture2D( nightMap, vUv ).rgb * 1.7;
        vec3 color = mix( night, day, mixAmount );
        color += 0.06; // gentle overall lift
        // Subtle rim / atmosphere glow toward the edges.
        float rim = pow( 1.0 - max( dot( normalize( vNormal ), vec3( 0.0, 0.0, 1.0 ) ), 0.0 ), 3.0 );
        color += vec3( 0.25, 0.4, 0.7 ) * rim * 0.6;
        gl_FragColor = vec4( color, 1.0 );
    }
`;

function build() {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( canvas.width, canvas.height, false );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 40, 1, 0.1, 100 );
    camera.position.set( 0, 0, 3 );
    camera.lookAt( 0, 0, 0 );

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin( 'anonymous' );
    const dayMap = loader.load( `${TEX}earth_atmos_2048.jpg` );
    const nightMap = loader.load( `${TEX}earth_lights_2048.png` );
    const cloudMap = loader.load( `${TEX}earth_clouds_1024.png` );
    dayMap.colorSpace = THREE.SRGBColorSpace;
    nightMap.colorSpace = THREE.SRGBColorSpace;

    const geometry = new THREE.SphereGeometry( 1, 48, 48 );

    const material = new THREE.ShaderMaterial({
        uniforms: {
            dayMap: { value: dayMap },
            nightMap: { value: nightMap },
            sunDirection: { value: new THREE.Vector3( 1, 0.3, 1 ).normalize() }
        },
        vertexShader: earthVertex,
        fragmentShader: earthFragment
    });

    earth = new THREE.Mesh( geometry, material );
    earth.rotation.z = 0.41; // ~23.5° axial tilt
    scene.add( earth );

    clouds = new THREE.Mesh(
        new THREE.SphereGeometry( 1.015, 48, 48 ),
        new THREE.MeshBasicMaterial({ map: cloudMap, transparent: true, opacity: 0.55, depthWrite: false })
    );
    earth.add( clouds );
}

function tick() {
    if ( !running ) return;
    earth.rotation.y += 0.0025;
    clouds.rotation.y += 0.0006;
    renderer.render( scene, camera );
    requestAnimationFrame( tick );
}

function start() {
    if ( !started ) { build(); started = true; }
    if ( running ) return;
    running = true;
    requestAnimationFrame( tick );
}

function stop() {
    running = false;
}

// Run the WebGL loop only while the Gallery section is showing.
function sync() {
    if ( document.documentElement.getAttribute('data-section') === 'gallery' ) start();
    else stop();
}

if ( canvas ) {
    const observer = new MutationObserver( sync );
    observer.observe( document.documentElement, { attributes: true, attributeFilter: ['data-section'] });
    sync();
}
