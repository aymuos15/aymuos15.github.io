// Grain gradient shader background, Reviews tab
// https://shaders.paper.design/grain-gradient
import {
    ShaderMount,
    grainGradientFragmentShader,
    getShaderColorFromString,
    getShaderNoiseTexture,
    GrainGradientShapes,
    ShaderFitOptions
} from 'https://esm.sh/@paper-design/shaders@0.0.76';

// Pastel palettes kept close to the theme background in luminance,
// so the theme's text colour stays readable over every band.
const PALETTES = {
    light: {
        back: '#fafaf5',
        colors: ['#f2cfcf', '#cfdff2', '#d4ecd8']
    },
    dark: {
        back: '#111110',
        colors: ['#5e5276', '#465e73', '#735a64']
    }
};

const grainShader = document.getElementById('grain-shader');
const grainShaderMount = document.getElementById('grain-shader-mount');
const grainUpdatesList = document.getElementById('updates-list');
let shader = null;
let noiseTexture = null;

function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function buildUniforms(theme) {
    const palette = PALETTES[theme];
    return {
        u_colorBack: getShaderColorFromString(palette.back),
        u_colors: palette.colors.map(getShaderColorFromString),
        u_colorsCount: palette.colors.length,
        u_softness: 0.7,
        u_intensity: 0.15,
        u_noise: 0.5,
        u_shape: GrainGradientShapes.wave,
        u_noiseTexture: noiseTexture,
        u_fit: ShaderFitOptions.none,
        u_scale: 0.6,
        u_rotation: 0,
        u_offsetX: 0,
        u_offsetY: 0,
        u_originX: 0.5,
        u_originY: 0.5,
        u_worldWidth: 0,
        u_worldHeight: 0
    };
}

async function createShader() {
    noiseTexture = getShaderNoiseTexture();
    await noiseTexture.decode();
    return new ShaderMount(grainShaderMount, grainGradientFragmentShader, buildUniforms(currentTheme()), undefined, 1);
}

new MutationObserver(() => {
    if (shader) shader.setUniforms(buildUniforms(currentTheme()));
}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

window.showGrainShader = async () => {
    grainShader.classList.add('visible');
    grainUpdatesList.classList.add('on-shader');
    if (shader) {
        shader.setSpeed(1);
    } else {
        shader = await createShader();
        if (!grainShader.classList.contains('visible')) shader.setSpeed(0);
    }
};

window.hideGrainShader = () => {
    grainShader.classList.remove('visible');
    grainUpdatesList.classList.remove('on-shader');
    if (shader) shader.setSpeed(0);
};
