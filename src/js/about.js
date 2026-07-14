// About accordion: one row open at a time. Every row header carries its own
// dithering shader, tinted with the site's shared pastel rainbow.
// https://shaders.paper.design/dithering
import {
    ShaderMount,
    ditheringFragmentShader,
    getShaderColorFromString,
    DitheringShapes,
    DitheringTypes,
    ShaderFitOptions
} from 'https://esm.sh/@paper-design/shaders@0.0.76';

const rows = [...document.querySelectorAll('#about-accordion .about-row')];

// Spread across window.pastelColors (utils.js) so the rows read as a rainbow.
const INKS = ['#e8a0bf', '#f2cc8f', '#b5d99c', '#a8d8ea'];

function uniformsFor(ink) {
    return {
        u_colorBack: [0, 0, 0, 0],
        u_colorFront: getShaderColorFromString(ink),
        // A full-field pattern, not `sphere`: a row is a thin strip, and a
        // centred shape would fall outside it entirely.
        u_shape: DitheringShapes.warp,
        u_type: DitheringTypes['4x4'],
        u_pxSize: 2,
        u_fit: ShaderFitOptions.none,
        u_scale: 0.5,
        u_rotation: 0,
        u_offsetX: 0,
        u_offsetY: 0,
        u_originX: 0.5,
        u_originY: 0.5,
        u_worldWidth: 0,
        u_worldHeight: 0
    };
}

rows.forEach((row, i) => {
    const head = row.querySelector('.about-row__head');
    const layer = row.querySelector('.about-row__dither');
    new ShaderMount(layer, ditheringFragmentShader, uniformsFor(INKS[i % INKS.length]), undefined, 1);

    // Keep the shader to the header band; the expanded body stays clean.
    new ResizeObserver(() => {
        row.style.setProperty('--head-height', `${head.offsetHeight}px`);
    }).observe(head);

    head.addEventListener('click', () => {
        const willOpen = !row.classList.contains('open');
        rows.forEach(other => {
            other.classList.remove('open');
            other.querySelector('.about-row__head').setAttribute('aria-expanded', 'false');
        });
        row.classList.toggle('open', willOpen);
        head.setAttribute('aria-expanded', String(willOpen));
    });
});
