// Pastel rainbow link colors
const pastelColors = [
    '#e8a0bf', '#f0b8a8', '#f2cc8f', '#b5d99c',
    '#a8d8ea', '#b8b8f0', '#d4a5e5', '#f5a8a8',
    '#a8e0c8', '#c4b8e8', '#e8c8a0', '#a0c8e8'
];

function colorizeLinks() {
    document.querySelectorAll('main a').forEach(link => {
        const color = pastelColors[Math.floor(Math.random() * pastelColors.length)];
        link.style.color = color;
    });
}

function nextFrame(fn) {
    requestAnimationFrame(() => requestAnimationFrame(fn));
}

// Social icon highlights per section
const socialHighlights = {
    about:    { linkedin: '#0A66C2', x: null },
    research: { scholar: '#4285F4' },
    news:     { github: null, pytorch: '#EE4C2C' },
    microblog: { scholar: '#4285F4' }
};

// GitHub & X brand is black/white — just use site text color
Object.defineProperty(socialHighlights.news, 'github', {
    get() { return window.getComputedStyle(document.documentElement).getPropertyValue('--text').trim(); }
});
Object.defineProperty(socialHighlights.about, 'x', {
    get() { return window.getComputedStyle(document.documentElement).getPropertyValue('--text').trim(); }
});

function highlightSocials(sectionId) {
    const map = socialHighlights[sectionId];
    document.querySelectorAll('.social-links a[data-social]').forEach(a => {
        a.style.color = map?.[a.dataset.social] || '';
    });
}

// Rainbow footer text
const footerCity  = document.getElementById('footer-city');
const footerEmail = document.getElementById('footer-email');

function rainbowText(el) {
    const text = el.dataset.original || el.textContent;
    el.dataset.original = text;
    el.innerHTML = [...text].map((ch, i) =>
        ch === ' ' ? ' ' : `<span class="rainbow-ch" style="color:${pastelColors[i % pastelColors.length]};animation-delay:${i * 30}ms">${ch}</span>`
    ).join('');
}

function resetText(el) {
    if (el.dataset.original) {
        el.innerHTML = [...el.dataset.original].map(ch =>
            ch === ' ' ? ' ' : `<span>${ch}</span>`
        ).join('');
    }
}

function updateFooterRainbow(sectionId) {
    if (sectionId === 'gallery') { rainbowText(footerCity); } else { resetText(footerCity); }
    if (sectionId === 'research') { rainbowText(footerEmail); } else { resetText(footerEmail); }
}
