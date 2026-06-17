 
// Free-floating image cloud
const photos = [
    { src: 'gallery/bhavith.jpeg',  alt: 'Bhavith',          x: -155, y:  -80, rot: -2.5, z: 2 },
    { src: 'gallery/cai4cai.jpg',   alt: 'CAI4CAI workshop',  x:   30, y:  -30, rot:  1.8, z: 5 },
    { src: 'gallery/isbi.jpeg',     alt: 'ISBI 2024',         x:  150, y:  -75, rot: -1.5, z: 3 },
    { src: 'gallery/pooja.jpeg',    alt: 'Pooja',             x: -160, y:   72, rot:  2.2, z: 2 },
    { src: 'gallery/parents.jpeg',  alt: 'Parents',           x:  -35, y:   20, rot: -2.0, z: 4 },
    { src: 'gallery/pupil.jpeg',    alt: 'Pupil study',       x:  155, y:   62, rot:  0.9, z: 1 },
    { src: 'gallery/wa1.jpeg',      alt: '',                  x:  -85, y: -145, rot: -1.2, z: 3 },
    { src: 'gallery/wa2.jpeg',      alt: '',                  x:  100, y: -140, rot:  2.8, z: 2 },
    { src: 'gallery/wa3.jpeg',      alt: '',                  x:  230, y:  -15, rot:  1.5, z: 2 },
    { src: 'gallery/wa4.jpeg',      alt: '',                  x: -230, y:   10, rot: -2.3, z: 2 },
    { src: 'gallery/wa5.jpeg',      alt: '',                  x:  115, y:  145, rot: -2.0, z: 3 },
    { src: 'gallery/wa6.jpeg',      alt: '',                  x:  -50, y:  148, rot:  3.1, z: 1 },
    { src: 'gallery/wa7.jpeg',      alt: '',                  x: -270, y: -110, rot:  2.4, z: 1 },
    { src: 'gallery/wa8.jpeg',      alt: '',                  x:  265, y:  130, rot: -1.7, z: 2 },
    { src: 'gallery/wa9.jpeg',      alt: '',                  x:  -10, y: -200, rot:  1.1, z: 1 },
    { src: 'gallery/wa10.jpeg',     alt: '',                  x:  205, y:  -150, rot: -3.0, z: 1 },
];

const cloud = document.querySelector('.image-cloud');
const universe = document.createElement('div');
universe.className = 'cloud-universe';
cloud.appendChild(universe);

// Size the canvas so it always contains every photo (which is positioned from
// the centre) plus margin — drop a new photo at any coordinate and the canvas
// grows to include it; existing photos never move. Stays at least viewport-ish
// so there is always room to pan.
const margin = 260;
const spanX = 2 * (Math.max(...photos.map(p => Math.abs(p.x))) + margin);
const spanY = 2 * (Math.max(...photos.map(p => Math.abs(p.y))) + margin);
universe.style.width = `max(${spanX}px, 140vw)`;
universe.style.height = `max(${spanY}px, 140vh)`;

let focused = null;

// Pan the viewport to the centre of the oversized canvas.
function centreCanvas(behavior) {
    cloud.scrollTo({
        left: (cloud.scrollWidth - cloud.clientWidth) / 2,
        top: (cloud.scrollHeight - cloud.clientHeight) / 2,
        behavior: behavior || 'auto',
    });
}

photos.forEach(photo => {
    const el = document.createElement('div');
    el.className = 'cloud-photo';
    el.style.setProperty('--cx', photo.x + 'px');
    el.style.setProperty('--cy', photo.y + 'px');
    el.style.setProperty('--rot', photo.rot + 'deg');
    el.style.setProperty('--z', photo.z);
    // Unique drift per photo: small random-ish offsets based on index
    const i = photos.indexOf(photo);
    const dx1 = ((i * 7 + 3) % 11) - 5 + 'px';
    const dy1 = ((i * 5 + 2) % 9)  - 4 + 'px';
    const dx2 = ((i * 3 + 8) % 11) - 5 + 'px';
    const dy2 = ((i * 9 + 1) % 9)  - 4 + 'px';
    el.style.setProperty('--dx1', dx1);
    el.style.setProperty('--dy1', dy1);
    el.style.setProperty('--dx2', dx2);
    el.style.setProperty('--dy2', dy2);
    el.style.setProperty('--dur',   (7 + (i * 1.3) % 5).toFixed(1) + 's');
    el.style.setProperty('--delay', (-(i * 1.7) % 6).toFixed(1) + 's');
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'View photo: ' + photo.alt);

    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.alt;
    img.loading = 'lazy';
    img.decoding = 'async';

    el.appendChild(img);
    universe.appendChild(el);

    el.addEventListener('click', e => {
        e.stopPropagation();
        // Ignore the click synthesised at the end of a drag-to-pan.
        if (wasDragging) return;
        if (focused === el) {
            el.classList.remove('focused');
            cloud.classList.remove('has-focus');
            focused = null;
        } else {
            if (focused) focused.classList.remove('focused');
            el.classList.add('focused');
            cloud.classList.add('has-focus');
            focused = el;
            // Bring the centred/zoomed photo into view from any pan offset.
            centreCanvas('smooth');
        }
    });

    el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            el.click();
        }
    });
});

// Dismiss on click outside or Escape
cloud.addEventListener('click', () => {
    if (focused) {
        focused.classList.remove('focused');
        cloud.classList.remove('has-focus');
        focused = null;
    }
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && focused) {
        focused.classList.remove('focused');
        cloud.classList.remove('has-focus');
        focused = null;
    }
});

// Mouse drag-to-pan. Touch/trackpad/wheel use native overflow scrolling.
// Panning only begins once the pointer moves past a threshold, so a plain
// click still reaches the photo (capturing the pointer up front would swallow
// the click and break click-to-highlight).
let wasDragging = false;
let pointerDown = false;
let panning = false;
let startX = 0, startY = 0, startLeft = 0, startTop = 0;

cloud.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    pointerDown = true;
    panning = false;
    wasDragging = false;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = cloud.scrollLeft;
    startTop = cloud.scrollTop;
});

cloud.addEventListener('pointermove', e => {
    if (!pointerDown) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!panning) {
        if (Math.abs(dx) <= 5 && Math.abs(dy) <= 5) return;
        panning = true;
        wasDragging = true;
        cloud.classList.add('is-panning');
        cloud.setPointerCapture(e.pointerId);
    }
    cloud.scrollLeft = startLeft - dx;
    cloud.scrollTop = startTop - dy;
});

function endPan(e) {
    if (!pointerDown) return;
    pointerDown = false;
    if (panning) {
        panning = false;
        cloud.classList.remove('is-panning');
        if (cloud.hasPointerCapture(e.pointerId)) cloud.releasePointerCapture(e.pointerId);
        // Clear the drag guard after the click event has fired.
        setTimeout(() => { wasDragging = false; }, 0);
    }
}

cloud.addEventListener('pointerup', endPan);
cloud.addEventListener('pointercancel', endPan);

// Frame the photo cluster whenever the gallery becomes visible. The section is
// display:none until its tab is opened, so we can't centre until it has size.
new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting && cloud.clientWidth > 0) centreCanvas();
    });
}).observe(cloud);
