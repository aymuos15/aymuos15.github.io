// Theme toggle with localStorage persistence
(function initTheme() {
    const saved = localStorage.getItem('theme-preference') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
})();

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.theme-toggle');

    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme-preference', next);
        if (contribGraph.classList.contains('visible')) _renderCanvas();
    });
});

// Cached DOM references
const navLinksContainer = document.querySelector('.nav-links');
const navLinks = document.querySelectorAll('.nav-links a');
const navToggle = document.querySelector('.nav-toggle');
const updatesList = document.getElementById('updates-list');
const tabs = document.querySelectorAll('.tab');
const contribGraph  = document.getElementById('contrib-graph');
const contribCanvas = document.getElementById('contrib-canvas');
const contribTip    = document.getElementById('contrib-tip');

// ── 3D isometric contribution graph ──────────────────────────────────────────
let _weeks = [], _graphReady = false;

function _colors() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return dark
        ? ['#1e1c18', '#4a3520', '#8a6530', '#c4a060', '#f0d090']
        : ['#e8e3da', '#c4a070', '#a07840', '#7a5520', '#4a3010'];
}

function _shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    return `rgb(${Math.min(255,~~(((n>>16)&255)*f))},${Math.min(255,~~(((n>>8)&255)*f))},${Math.min(255,~~((n&255)*f))})`;
}

function _renderCanvas() {
    if (!_weeks.length) return;
    const pal = _colors();
    const CW = 9, GAP = 2, PX = CW + GAP, PY = CW + GAP;
    const MAX_H = 18, MIN_H = 1, DX = 3, DY = 3;
    const nC = _weeks.length, nR = 7;
    const maxN = Math.max(1, ..._weeks.flat().filter(Boolean).map(d => d.count));

    const OX = 4, OY = MAX_H + DY + 4;
    const W  = OX + nC * PX + DX + 4;
    const H  = OY + nR * PY + 4;

    const dpr = window.devicePixelRatio || 1;
    contribCanvas.width  = Math.ceil(W * dpr);
    contribCanvas.height = Math.ceil(H * dpr);
    contribCanvas.style.width  = W + 'px';
    contribCanvas.style.height = H + 'px';

    const ctx = contribCanvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const hits = [];
    for (let row = 0; row < nR; row++) {
        for (let col = 0; col < nC; col++) {
            const day   = _weeks[col]?.[row];
            const level = day?.level ?? 0;
            const count = day?.count ?? 0;
            const h = count > 0 ? MIN_H + (count / maxN) * (MAX_H - MIN_H) : MIN_H;

            const sx = OX + col * PX;
            const by = OY + row * PY + CW;
            const ty = by - h;
            const c  = pal[level];

            // front face
            ctx.fillStyle = c;
            ctx.fillRect(sx, ty, CW, h);
            // top face
            ctx.beginPath();
            ctx.moveTo(sx, ty); ctx.lineTo(sx + CW, ty);
            ctx.lineTo(sx + CW + DX, ty - DY); ctx.lineTo(sx + DX, ty - DY);
            ctx.closePath(); ctx.fillStyle = _shade(c, 1.18); ctx.fill();
            // right face
            ctx.beginPath();
            ctx.moveTo(sx + CW, ty); ctx.lineTo(sx + CW + DX, ty - DY);
            ctx.lineTo(sx + CW + DX, by - DY); ctx.lineTo(sx + CW, by);
            ctx.closePath(); ctx.fillStyle = _shade(c, 0.65); ctx.fill();

            hits.push({ sx, ty, h, day });
        }
    }
    contribCanvas._hits = hits;
    contribCanvas._CW   = CW;
}

contribCanvas.addEventListener('mousemove', e => {
    const hits = contribCanvas._hits;
    if (!hits) return;
    const CW = contribCanvas._CW;
    const rect = contribCanvas.getBoundingClientRect();
    const sc   = (parseFloat(contribCanvas.style.width) || rect.width) / rect.width;
    const mx   = (e.clientX - rect.left) * sc;
    const my   = (e.clientY - rect.top)  * sc;

    let hit = null;
    for (let i = hits.length - 1; i >= 0; i--) {
        const { sx, ty, h } = hits[i];
        if (mx >= sx && mx < sx + CW && my >= ty && my < ty + h) { hit = hits[i]; break; }
    }

    if (hit?.day) {
        const { count, date } = hit.day;
        const label = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        contribTip.textContent = `${count || 'no'} contribution${count !== 1 ? 's' : ''} · ${label}`;
        contribTip.style.display = 'block';
        contribTip.style.left = (e.clientX + 14) + 'px';
        contribTip.style.top  = (e.clientY - 38) + 'px';
    } else {
        contribTip.style.display = 'none';
    }
});
contribCanvas.addEventListener('mouseleave', () => { contribTip.style.display = 'none'; });

async function _loadContribs() {
    const res  = await window.fetch('https://github-contributions-api.jogruber.de/v4/aymuos15?y=last');
    const days = (await res.json()).contributions || [];
    const weeks = [];
    let week = new Array(7).fill(null);
    days.forEach(day => {
        const dow = new Date(day.date + 'T12:00:00').getDay();
        if (dow === 0 && week.some(Boolean)) { weeks.push([...week]); week = new Array(7).fill(null); }
        week[dow] = day;
    });
    if (week.some(Boolean)) weeks.push(week);
    return weeks;
}

function showContribGraph() {
    contribGraph.classList.add('visible');
    if (_graphReady) { _renderCanvas(); return; }
    _loadContribs().then(w => { _weeks = w; _graphReady = true; _renderCanvas(); })
        .catch(err => console.warn('Contrib graph:', err));
}
function hideContribGraph() {
    contribGraph.classList.remove('visible');
    contribTip.style.display = 'none';
}

// Mobile nav dropdown
navToggle.addEventListener('click', () => {
    navLinksContainer.classList.toggle('open');
});

document.addEventListener('click', (e) => {
    if (!navLinksContainer.contains(e.target) && !navToggle.contains(e.target)) {
        navLinksContainer.classList.remove('open');
    }
});

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
    about:    { linkedin: '#0A66C2' },
    research: { scholar: '#4285F4' },
    news:     { github: null, pytorch: '#EE4C2C' }
};

// GitHub brand is black/white — just use site text color
Object.defineProperty(socialHighlights.news, 'github', {
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

// Section switching
let isTransitioning = false;

function switchSection(targetId) {
    if (isTransitioning) return;

    const current = document.querySelector('.section.active');
    const next = document.getElementById(targetId);

    if (!next || current === next) return;

    isTransitioning = true;

    navLinks.forEach(a => a.classList.remove('active'));
    const navLink = document.querySelector(`.nav-links a[href="#${targetId}"]`);
    if (navLink) navLink.classList.add('active');

    current.classList.remove('active');
    current.classList.add('leaving');

    highlightSocials(targetId);
    updateFooterRainbow(targetId);

    setTimeout(() => {
        current.classList.remove('leaving');
        next.classList.add('active');
        isTransitioning = false;
        colorizeLinks();
    }, 300);
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navLinksContainer.classList.remove('open');
        const targetId = link.getAttribute('href').slice(1);
        switchSection(targetId);
    });
});

// Updates data
/* eslint-disable quotes */
const updates = [
    { "date": "Feb. '26", "description": "<a href=\"https://github.com/Project-MONAI/MONAI/pull/8688\">Fix docstring typos across codebase</a> - Project-MONAI/MONAI", "category": "pr" },
    { "date": "Jan. '26", "description": "<a href=\"https://github.com/cai4cai/torchsparsegradutils/pull/67\">perf: replace torch.cat([*B]) with reshape in sparse_triangular_solve</a> - cai4cai/torchsparsegradutils", "category": "pr" },
    { "date": "Jan. '26", "description": "<a href=\"https://github.com/cai4cai/torchsparsegradutils/pull/65\">perf: replace torch.cat([*B]) with reshape in sparse_mm</a> - cai4cai/torchsparsegradutils", "category": "pr" },
    { "date": "Jan. '26", "description": "<a href=\"https://github.com/Project-MONAI/MONAI/pull/8680\">Rename NormalizeLabelsInDatasetd to RemapLabelsToSequentiald</a> - Project-MONAI/MONAI", "category": "pr" },
    { "date": "Jan. '26", "description": "<a href=\"https://github.com/google-deepmind/optax/pull/1458\">Generalize dice_loss with alpha/beta weighting</a> - google-deepmind/optax", "category": "pr" },
    { "date": "Jan. '26", "description": "<a href=\"https://github.com/cai4cai/torchsparsegradutils/pull/66\">Performance improvements for sparse operations</a> - cai4cai/torchsparsegradutils", "category": "pr" },
    { "date": "Jan. '26", "description": "<a href=\"https://github.com/cai4cai/torchsparsegradutils/pull/63\">Fix PyTorch version comparison</a> - cai4cai/torchsparsegradutils", "category": "pr" },
    { "date": "Dec. '25", "description": "<a href=\"https://github.com/sinelaw/fresh/pull/421\">Support for opening multiple files from CLI</a> - sinelaw/fresh", "category": "pr" },
    { "date": "Nov. '25", "description": "<a href=\"https://github.com/anomalyco/opentui/pull/253\">Fix TerminalConsole.resize parameters</a> - anomalyco/opentui", "category": "pr" },
    { "date": "Oct. '25", "description": "<a href=\"https://github.com/lbr-stack/roboreg/pull/88\">Fix Kabsch algorithm naming</a> - lbr-stack/roboreg", "category": "pr" },
    { "date": "Oct. '25", "description": "Will be supervising the BSc thesis of Yingfan Tao and Jiayue Liang", "category": "teaching" },
    { "date": "Sept. '25", "description": "<a href=\"https://github.com/BrainLesion/panoptica/pull/234\">Setup workflows from voronoi branch</a> - BrainLesion/panoptica", "category": "pr" },
    { "date": "Sept. '25", "description": "<a href=\"https://github.com/BrainLesion/panoptica/pull/228\">Fix voxelspacing dimension mismatch</a> - BrainLesion/panoptica", "category": "pr" },
    { "date": "Jun. '25", "description": "<a href=\"https://github.com/google-deepmind/optax/pull/1366\">Add segmentation based (dice) loss</a> - google-deepmind/optax", "category": "pr" },
    { "date": "Jun. '25", "description": "<a href=\"https://github.com/google-deepmind/optax/pull/1340\">Enable adaptive gradient clipping for high-dim tensors</a> - google-deepmind/optax", "category": "pr" },
    { "date": "May. '25", "description": "<a href=\"https://github.com/BrainLesion/panoptica/pull/204\">Making Panoptica Part Aware</a> - BrainLesion/panoptica", "category": "pr" },
    { "date": "Apr. '25", "description": "<a href=\"https://github.com/BrainLesion/panoptica/pull/196\">New Matcher Class: Hungarian Matching</a> - BrainLesion/panoptica", "category": "pr" },
    { "date": "Sept. '24", "description": "<a href=\"https://github.com/BrainImageAnalysis/instance-loss/pull/2\">Optimised connected components with gradients</a> - BrainImageAnalysis/instance-loss", "category": "pr" },
    { "date": "Jan. '23", "description": "<a href=\"https://github.com/ivy-llc/ivy/pull/9963\">Added binarizer to experimental API</a> - ivy-llc/ivy", "category": "pr" },
    { "date": "Aug. '25", "description": "Hosting 2 High School Interns via the <a href=\"https://in2scienceuk.org/our-programmes/in2stem/\">In2STEM programme</a>.", "category": "teaching" },
    { "date": "Jul. '25", "description": "Will be hosting <a href=\"https://www.linkedin.com/in/jeeezzhusss/\">Jai</a> and <a href=\"https://www.linkedin.com/in/pranav-rustagi-8a5a18253/\">Pranav</a> from LNMIIT as research interns with Yang.", "category": "teaching" },
    { "date": "Jun. '25", "description": "Starting an internship at <a href=\"https://cosine.sh/\">Cosine</a>. Machine Learning Engineering and Product.", "category": "misc" },
    { "date": "Mar. '25", "description": "Released <a href=\"https://github.com/KCL-BMEIS/UltraFlwr\">Ultraflwr</a>. Library for Federated Object Detection on the edge. Now a poster accept @MICCAI-AMAI'25!", "category": "publishing" },
    { "date": "Mar. '25", "description": "Graduate TA for Statistics with <a href=\"https://kclpure.kcl.ac.uk/portal/en/persons/richard.housden\">Prof. Richard Housden</a>", "category": "teaching" },
    { "date": "Mar. '25", "description": "Reviewing for MICCAI 2025, NeurIPS 2025 and ICML 2025.", "category": "reviewing" },
    { "date": "Feb. '25", "description": "<a href=\"https://github.com/aymuos15/Promptly-Cited\">KneeXNeT</a> accepted to MICAD'24. Congrats Nicahree!", "category": "publishing" },
    { "date": "Dec. '24", "description": "Passed my Qualifiers. Officially a PhD Student!", "category": "misc" },
    { "date": "Dec. '24", "description": "<a href=\"https://github.com/aymuos15/Cluster-Dice\">Cluster Dice</a> accepted at SPIE Medical Imaging'25.", "category": "publishing" },
    { "date": "Sept '24", "description": "Member of Technical Programme Committee for ISBI 2025.", "category": "reviewing" },
    { "date": "Sept '24", "description": "Reviewing for AISTATS 2025.", "category": "reviewing" },
    { "date": "Sept '24", "description": "<a href=\"https://github.com/aymuos15/Promptly-Cited\">Promptly-Cited</a> accepted at NeurIPS-WiML Workshop.", "category": "publishing" },
    { "date": "Sept '24", "description": "<a href=\"https://voxel51.com/computer-vision-events/visual-ai-in-healthcare-sept-19-2024/\">Talk</a> for Voxel 51 on my current Ph.D. work!", "category": "misc" },
    { "date": "Sept '24", "description": "Graduate TA for Research Club - Biomedical Engineering.", "category": "teaching" },
    { "date": "Sept '24", "description": "Reviewing for NeurIPS-WiML 2024, ICLR 2024.", "category": "reviewing" },
    { "date": "Aug. '24", "description": "Hosting 2 High School Interns via the <a href=\"https://in2scienceuk.org/our-programmes/in2stem/\">In2STEM programme</a>.", "category": "teaching" },
    { "date": "June '24", "description": "Reviewing for NeurIPS, MICCAI-FAIMI, CaPTion@MICCAI, and ICML-ML4MLS 2024.", "category": "reviewing" },
    { "date": "May. '24", "description": "Best Student Poster Award Finalist at ISBI'24.", "category": "misc" },
    { "date": "Feb. '24", "description": "<a href=\"https://github.com/aymuos15/SegPatch\">SegPatch</a> accepted at ISBI'24!", "category": "publishing" },
    { "date": "Jan. '24", "description": "Student Representative for the <a href=\"https://kcl-mrcdtp.com/about/the-team/\">KCL MRC DTP</a>.", "category": "misc" },
    { "date": "Nov. '23", "description": "Reviewing for ISBI 2024.", "category": "reviewing" },
    { "date": "Nov. '23", "description": "Top 8 Finish at Anthropic-London Hackathon.", "category": "misc" },
    { "date": "Oct. '23", "description": "Began my alignment on the <a href=\"https://www.imagingcdt.com/\">Smart Imaging CDT</a>.", "category": "misc" },
    { "date": "Sept '23", "description": "Defended my MSc Thesis and Started my PhD.", "category": "misc" }
];
/* eslint-enable quotes */

function renderUpdates(category, resetScroll) {
    const filtered = category === 'all'
        ? updates.filter(u => u.category !== 'pr')
        : updates.filter(u => u.category === category);
    updatesList.innerHTML = filtered.map((u, i) =>
        `<div class="update-item" data-category="${u.category}" style="animation-delay: ${i * 30}ms"><span class="update-date">${u.date}</span><span class="update-desc">${u.description}</span></div>`
    ).join('');

    if (resetScroll) {
        updatesList.scrollTop = 0;
    }
}

renderUpdates('all', false);

// Tab click handlers
let tabSwitching = false;

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        if (tabSwitching || tab.classList.contains('active')) return;
        tabSwitching = true;

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        updatesList.classList.add('fading');
        hideContribGraph();

        setTimeout(() => {
            renderUpdates(tab.dataset.category, true);
            updatesList.classList.remove('fading');
            colorizeLinks();
            tabSwitching = false;
            if (tab.dataset.category === 'pr') showContribGraph();
        }, 300);
    });
});

// Name click - toggle pronunciation
document.querySelector('.name-link').addEventListener('click', () => {
    document.getElementById('pronunciation').classList.toggle('visible');
});

// Research link - toggle collaborators
document.querySelector('.research-link').addEventListener('click', () => {
    document.getElementById('about-content').classList.add('hidden');
    document.getElementById('collaborators').classList.add('visible');
});

document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('collaborators').classList.remove('visible');
    document.getElementById('about-content').classList.remove('hidden');
});

colorizeLinks();

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
