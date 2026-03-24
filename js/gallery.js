/* eslint-disable no-undef */
// Gallery image cycling
const extraImages = [
    'gallery/isbi.jpeg',
    'gallery/pupil.jpeg'
];

// Preload gallery images
extraImages.forEach(src => {
    const img = new Image();
    img.src = src;
});

const imagePositions = {
    'pupil.jpeg': 'center top',
    'isbi.jpeg': 'center bottom'
};

const slideDirections = [
    { enter: 'translateX(100%)', exit: 'translateX(-100%)' },
    { enter: 'translateX(-100%)', exit: 'translateX(100%)' },
    { enter: 'translateY(100%)', exit: 'translateY(-100%)' },
    { enter: 'translateY(-100%)', exit: 'translateY(100%)' }
];

function applyImagePosition(img, src) {
    const filename = src.split('/').pop();
    img.style.objectPosition = imagePositions[filename] || 'center center';
}

document.querySelectorAll('.image-grid-cell').forEach(cell => {
    let currentImg = cell.querySelector('img');
    let isAnimating = false;
    applyImagePosition(currentImg, currentImg.src);

    cell.addEventListener('click', () => {
        if (!isAnimating) {
            isAnimating = true;
            const oldSrc = currentImg.src;
            const newSrc = extraImages.shift();
            const dir = slideDirections[Math.floor(Math.random() * slideDirections.length)];

            const nextImg = document.createElement('img');
            nextImg.src = newSrc;
            applyImagePosition(nextImg, newSrc);
            nextImg.style.transition = 'none';
            nextImg.style.transform = dir.enter;
            cell.appendChild(nextImg);

            nextFrame(() => {
                nextImg.style.transition = '';
                nextImg.style.transform = 'translate(0, 0)';
                currentImg.style.transform = dir.exit;
            });

            setTimeout(() => {
                currentImg.remove();
                currentImg = nextImg;
                isAnimating = false;
            }, 1550);

            const oldPath = 'gallery/' + oldSrc.split('/gallery/')[1];
            extraImages.push(oldPath);
        }
    });
});
