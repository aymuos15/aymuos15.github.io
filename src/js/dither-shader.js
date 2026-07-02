// Dither dissolve for the about <-> collaborators switch:
// the text itself breaks into a dot matrix and re-forms.
const aboutContentEl = document.getElementById('about-content');
const collaboratorsEl = document.getElementById('collaborators');
let running = false;

const LEVELS = 8;
const DOT_GRID = '7px 7px';

function setMask(el, coverage) {
    const mask = coverage >= 100
        ? ''
        : `radial-gradient(circle, #000 ${coverage}%, transparent ${coverage}%)`;
    el.style.maskImage = mask;
    el.style.webkitMaskImage = mask;
    el.style.maskSize = mask ? DOT_GRID : '';
    el.style.webkitMaskSize = mask ? DOT_GRID : '';
}

function animateDither(el, toVisible, duration) {
    return new Promise(resolve => {
        const start = performance.now();
        const tick = now => {
            const t = Math.min(1, (now - start) / duration);
            const progress = toVisible ? t : 1 - t;
            const quantized = Math.round(progress * LEVELS) / LEVELS;
            setMask(el, quantized * 100);
            if (t < 1) {
                requestAnimationFrame(tick);
            } else {
                resolve();
            }
        };
        requestAnimationFrame(tick);
    });
}

window.ditherTransition = async swap => {
    if (running) {
        swap();
        return;
    }
    running = true;

    const showingCollabs = collaboratorsEl.classList.contains('visible');
    const outgoing = showingCollabs ? collaboratorsEl : aboutContentEl;
    const incoming = showingCollabs ? aboutContentEl : collaboratorsEl;

    await animateDither(outgoing, false, 320);
    swap();
    await animateDither(incoming, true, 360);
    setMask(outgoing, 100);
    running = false;
};
