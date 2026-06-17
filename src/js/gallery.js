 
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
];

const cloud = document.querySelector('.image-cloud');
const universe = document.createElement('div');
universe.className = 'cloud-universe';
cloud.appendChild(universe);

let focused = null;

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
        if (focused === el) {
            el.classList.remove('focused');
            cloud.classList.remove('has-focus');
            focused = null;
        } else {
            if (focused) focused.classList.remove('focused');
            el.classList.add('focused');
            cloud.classList.add('has-focus');
            focused = el;
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
