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

function _renderCanvas(animate) {
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

    // precompute target heights
    const targets = [];
    for (let row = 0; row < nR; row++) {
        targets[row] = [];
        for (let col = 0; col < nC; col++) {
            const day   = _weeks[col]?.[row];
            const count = day?.count ?? 0;
            targets[row][col] = count > 0 ? MIN_H + (count / maxN) * (MAX_H - MIN_H) : MIN_H;
        }
    }

    function drawFrame(progress) {
        const ctx = contribCanvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);

        const hits = [];
        for (let row = 0; row < nR; row++) {
            for (let col = 0; col < nC; col++) {
                const day   = _weeks[col]?.[row];
                const level = day?.level ?? 0;
                const targetH = targets[row][col];

                // stagger: each column starts slightly later
                const delay = col / nC * 0.5;
                const local = Math.max(0, Math.min(1, (progress - delay) / (1 - 0.5)));
                // ease out cubic
                const ease = 1 - Math.pow(1 - local, 3);
                const h = MIN_H + (targetH - MIN_H) * ease;

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

    if (!animate) { drawFrame(1); return; }

    const duration = 800;
    const start = performance.now();
    function tick(now) {
        const progress = Math.min(1, (now - start) / duration);
        drawFrame(progress);
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
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

// Prefetch contrib data at load time so it's ready when the PRs tab is opened
_loadContribs().then(w => { _weeks = w; _graphReady = true; })
    .catch(err => console.warn('Contrib graph prefetch:', err));

function showContribGraph() {
    contribGraph.classList.add('visible');
    if (_graphReady) { _renderCanvas(true); return; }
    _loadContribs().then(w => { _weeks = w; _graphReady = true; _renderCanvas(true); })
        .catch(err => console.warn('Contrib graph:', err));
}
function hideContribGraph() {
    contribGraph.classList.remove('visible');
    contribTip.style.display = 'none';
}

const spotifyEmbed = document.getElementById('spotify-embed');
function showSpotify() { spotifyEmbed.classList.add('visible'); }
function hideSpotify() { spotifyEmbed.classList.remove('visible'); }

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
    { "date": "Mar. '26", "description": "Graduate TA for Image and Signal Processing with <a href=\"https://kclpure.kcl.ac.uk/portal/en/persons/richard.housden\">Prof. James Housden</a>", "category": "teaching" },
    { "date": "Mar. '26", "description": "Graduate TA for Python with <a href=\"https://www.kcl.ac.uk/people/marc-modat\">Prof. Marc Modat</a> and <a href=\"https://cai4cai.ml/author/jonathan-shapey/\">Dr. Jonathan Shapey</a>", "category": "teaching" },
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
    { "date": "Oct. '25", "description": "Will be supervising the BSc thesis of Yingfan Tao", "category": "teaching" },
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
        hideSpotify();

        setTimeout(() => {
            renderUpdates(tab.dataset.category, true);
            updatesList.classList.remove('fading');
            colorizeLinks();
            tabSwitching = false;
            if (tab.dataset.category === 'pr') showContribGraph();
            if (tab.dataset.category === 'misc') showSpotify();
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

// ── Microblog ────────────────────────────────────────────────────────────────
/* eslint-disable quotes */
const microblogEntries = [
    {
        id: "(Git) worktrees-vs-branches",
        date: "Mar. '26",
        title: "(Git) Worktrees vs Branches",
        tags: ["git", "workflow"],
        diagram: "worktree",
        content: `<p>A <strong>branch</strong> is just a pointer to a commit. Switching branches swaps files in your single working directory. Which forces one on stashing uncommitted work. A <strong>worktree</strong> (<code>git worktree add</code>) gives each branch its own directory, all backed by the same <code>.git</code> object store. Thus, no stashing required, a personal ick only tbh.</p>
<p>The agentic advantage: worktrees let you run coding agents in parallel. Each agent gets its own isolated checkout while sharing the same repo. <a href="https://github.com/jj-vcs/jj" target="_blank">Jujutsu (jj)</a> is an open-source alternative that bakes this kind of parallel workflow into the VCS itself. Find a better deep dive into other alternatives <a href="https://blog.ezyang.com/2026/03/parallel-agents-heart-sapling/" target="_blank">here</a>.</p>`,
        links: []
    },
    {
        id: "deformable-convolutions",
        date: "Mar. '26",
        title: "Deformable Convolutions",
        tags: ["computer-vision", "convolutions"],
        diagram: "deformable-conv",
        content: `<p>Standard convolutions sample on a fixed rectangular grid, limiting for irregular shapes. Deformable Convolutions (<a href="https://arxiv.org/abs/1703.06211" target="_blank">Dai et al., ICCV 2017</a>) add learnable offsets to each sampling position so the receptive field adapts to the geometry of the content. DCNv2 (<a href="https://arxiv.org/abs/1811.11168" target="_blank">Zhu et al., CVPR 2019</a>) adds per-sample modulation scalars that control <em>how much</em> each offset position contributes. DCNv3 (<a href="https://arxiv.org/abs/2211.05778" target="_blank">Wang et al., CVPR 2023</a>) shares weights across groups and softmax-normalises the modulation, and DCNv4 (<a href="https://arxiv.org/abs/2401.06197" target="_blank">Xiong et al., CVPR 2024</a>) removes the softmax constraint and optimises memory access for faster inference.</p>`,
        links: []
    }
];
/* eslint-enable quotes */

const microblogCards = document.getElementById('microblog-cards');
const microblogTagsEl = document.getElementById('microblog-tags');
const microblogList = document.getElementById('microblog-list');
const microblogDetail = document.getElementById('microblog-detail');
let microblogTagSwitching = false;

// ── Worktree vs Branches Diagram ─────────────────────────────────────────────
function buildWorktreeDiagram() {
    const container = document.getElementById('microblog-diagram-worktree');
    if (!container) return;

    let mode = 'branch';

    // Shared geometry — larger viewBox so SVG text renders at readable sizes
    const W = 440, H = 220;
    const gitX = W / 2, gitY = 32, gitRx = 44, gitRy = 18;

    const branchLayout = {
        boxes: [{ x: W / 2, y: 130 }],
        labels: [
            { x: 62,  y: 130, text: 'main',   dim: true },
            { x: W / 2, y: 190, text: 'feat-A', dim: false },
            { x: 378, y: 130, text: 'fix-B',  dim: true }
        ],
        connectors: [[gitX, gitY + gitRy, W / 2, 130 - 22]],
        footnote: 'stash \u2192 checkout \u2192 switch'
    };

    const worktreeLayout = {
        boxes: [
            { x: W / 2 - 95, y: 130 },
            { x: W / 2 + 95, y: 130 }
        ],
        labels: [],
        connectors: [
            [gitX - 16, gitY + gitRy, W / 2 - 95, 130 - 22],
            [gitX + 16, gitY + gitRy, W / 2 + 95, 130 - 22]
        ],
        footnote: 'parallel \u2014 no stashing needed'
    };

    function buildSvg(layout) {
        const bw = 130, bh = 44;
        let s = `<svg viewBox="0 0 ${W} ${H}" class="wt-svg" xmlns="http://www.w3.org/2000/svg">`;

        // .git ellipse
        s += `<ellipse cx="${gitX}" cy="${gitY}" rx="${gitRx}" ry="${gitRy}"
            fill="none" stroke="var(--text-secondary)" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.55"/>`;
        s += `<text x="${gitX}" y="${gitY + 5}" text-anchor="middle"
            font-family="var(--font-mono)" font-size="13" fill="var(--text-secondary)">.git</text>`;

        // Connectors (dashed lines from .git to boxes)
        layout.connectors.forEach(([x1, y1, x2, y2]) => {
            s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
                stroke="var(--text-secondary)" stroke-width="0.9" stroke-dasharray="4 3" opacity="0.45"/>`;
        });

        // Boxes
        layout.boxes.forEach((b, i) => {
            const col = layout.boxes.length > 1
                ? (i === 0 ? 'var(--link)' : 'var(--text)')
                : 'var(--text)';
            s += `<rect x="${b.x - bw/2}" y="${b.y - bh/2}" width="${bw}" height="${bh}"
                rx="4" fill="none" stroke="${col}" stroke-width="1.2"/>`;
            const inner = layout.boxes.length === 1 ? 'working dir' : (i === 0 ? 'feat-A/' : 'fix-B/');
            s += `<text x="${b.x}" y="${b.y + 5}" text-anchor="middle"
                font-family="var(--font-mono)" font-size="12" fill="${col}">${inner}</text>`;
        });

        // Branch labels (only in branch mode)
        layout.labels.forEach(l => {
            const col = l.dim ? 'var(--text-secondary)' : 'var(--link)';
            const op = l.dim ? '0.4' : '1';
            s += `<text x="${l.x}" y="${l.y + 5}" text-anchor="middle"
                font-family="var(--font-mono)" font-size="11" fill="${col}" opacity="${op}">${l.text}</text>`;
            if (!l.dim && layout.boxes.length === 1) {
                const bx = layout.boxes[0].x;
                s += `<line x1="${l.x}" y1="${l.y - 5}" x2="${bx}" y2="${layout.boxes[0].y + bh/2}"
                    stroke="var(--link)" stroke-width="0.7" stroke-dasharray="3 2" opacity="0.45"/>`;
            }
        });

        // Footnote
        s += `<text x="${W / 2}" y="${H - 6}" text-anchor="middle"
            font-family="var(--font-mono)" font-size="10" fill="var(--text-secondary)" opacity="0.5">${layout.footnote}</text>`;

        s += '</svg>';
        return s;
    }

    function render() {
        const layout = mode === 'branch' ? branchLayout : worktreeLayout;
        container.querySelector('.wt-diagram-area').innerHTML = buildSvg(layout);
    }

    // Toggle buttons (reuse dcn-toggle / dcn-btn styles)
    const toggle = document.createElement('div');
    toggle.className = 'dcn-toggle';

    const btnBr = document.createElement('button');
    btnBr.className = 'dcn-btn active';
    btnBr.textContent = 'Branches';

    const btnWt = document.createElement('button');
    btnWt.className = 'dcn-btn';
    btnWt.textContent = 'Worktrees';

    function setMode(m) {
        if (m === mode) return;
        mode = m;
        btnBr.classList.toggle('active', mode === 'branch');
        btnWt.classList.toggle('active', mode === 'worktree');
        const area = container.querySelector('.wt-diagram-area');
        area.classList.add('wt-fading');
        setTimeout(() => {
            render();
            area.classList.remove('wt-fading');
        }, 200);
    }

    btnBr.addEventListener('click', () => setMode('branch'));
    btnWt.addEventListener('click', () => setMode('worktree'));

    toggle.appendChild(btnBr);
    toggle.appendChild(btnWt);

    const area = document.createElement('div');
    area.className = 'wt-diagram-area';

    const caption = document.createElement('p');
    caption.className = 'dcn-caption';
    caption.textContent = 'Click to compare single-directory branching with parallel worktrees.';

    container.appendChild(toggle);
    container.appendChild(area);
    container.appendChild(caption);
    render();
}

// ── Deformable Convolution Diagram ───────────────────────────────────────────
function buildMicroblogDiagram(type) {
    if (type === 'worktree') { buildWorktreeDiagram(); return; }
    if (type !== 'deformable-conv') return;
    const container = document.getElementById('microblog-diagram-deformable-conv');
    if (!container) return;

    // 3x3 kernel positions on a normalised grid
    const gridPts = [];
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            gridPts.push({ x: 25 + c * 25, y: 25 + r * 25 });
        }
    }

    // Deformed offsets — points that hug the ellipse boundary (cx=50, cy=50, rx=34, ry=28, rot=-12deg)
    const deformedPts = [
        { x: 20, y: 28 }, { x: 50, y: 20 }, { x: 80, y: 26 },
        { x: 16, y: 50 }, { x: 50, y: 50 }, { x: 84, y: 48 },
        { x: 22, y: 72 }, { x: 50, y: 78 }, { x: 78, y: 72 }
    ];

    let mode = 'standard';
    const currentPts = gridPts.map(p => ({ x: p.x, y: p.y }));

    // Blob shape (irregular region the kernel adapts to)
    const blobSvg = `<ellipse cx="50" cy="50" rx="34" ry="28"
        transform="rotate(-12 50 50)"
        fill="none" stroke="var(--border)" stroke-width="1.2"
        stroke-dasharray="4 3" opacity="0.6"/>`;

    // Build SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '5 12 90 80');
    svg.setAttribute('class', 'dcn-svg');
    svg.innerHTML = blobSvg;

    // Connection lines (grid edges)
    const lines = [];
    const lineIdxPairs = [
        [0,1],[1,2],[3,4],[4,5],[6,7],[7,8],
        [0,3],[3,6],[1,4],[4,7],[2,5],[5,8]
    ];
    lineIdxPairs.forEach(([a, b]) => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'dcn-line');
        svg.appendChild(line);
        lines.push({ el: line, a, b });
    });

    // Sample points
    const dots = [];
    gridPts.forEach(() => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', '2.8');
        circle.setAttribute('class', 'dcn-dot');
        svg.appendChild(circle);
        dots.push(circle);
    });

    // Offset arrows (only visible in deformable mode)
    const arrows = [];
    gridPts.forEach(() => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'dcn-arrow');
        svg.appendChild(line);
        arrows.push(line);
    });

    function updatePositions() {
        dots.forEach((dot, i) => {
            dot.setAttribute('cx', currentPts[i].x);
            dot.setAttribute('cy', currentPts[i].y);
        });
        lines.forEach(({ el, a, b }) => {
            el.setAttribute('x1', currentPts[a].x);
            el.setAttribute('y1', currentPts[a].y);
            el.setAttribute('x2', currentPts[b].x);
            el.setAttribute('y2', currentPts[b].y);
        });
        arrows.forEach((arrow, i) => {
            arrow.setAttribute('x1', gridPts[i].x);
            arrow.setAttribute('y1', gridPts[i].y);
            arrow.setAttribute('x2', currentPts[i].x);
            arrow.setAttribute('y2', currentPts[i].y);
        });
    }

    function animateTo(targetPts) {
        const startPts = currentPts.map(p => ({ x: p.x, y: p.y }));
        const duration = 500;
        const start = performance.now();
        function tick(now) {
            const t = Math.min(1, (now - start) / duration);
            const ease = 1 - Math.pow(1 - t, 3);
            currentPts.forEach((p, i) => {
                p.x = startPts[i].x + (targetPts[i].x - startPts[i].x) * ease;
                p.y = startPts[i].y + (targetPts[i].y - startPts[i].y) * ease;
            });
            updatePositions();
            if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // Toggle buttons
    const toggle = document.createElement('div');
    toggle.className = 'dcn-toggle';

    const btnStd = document.createElement('button');
    btnStd.className = 'dcn-btn active';
    btnStd.textContent = 'Standard';

    const btnDef = document.createElement('button');
    btnDef.className = 'dcn-btn';
    btnDef.textContent = 'Deformable';

    function setMode(m) {
        if (m === mode) return;
        mode = m;
        btnStd.classList.toggle('active', mode === 'standard');
        btnDef.classList.toggle('active', mode === 'deformable');
        svg.classList.toggle('dcn-deformable', mode === 'deformable');
        animateTo(mode === 'deformable' ? deformedPts : gridPts);
    }

    btnStd.addEventListener('click', () => setMode('standard'));
    btnDef.addEventListener('click', () => setMode('deformable'));

    toggle.appendChild(btnStd);
    toggle.appendChild(btnDef);

    // Equation panel
    const eqPanel = document.createElement('div');
    eqPanel.className = 'dcn-eq';
    eqPanel.innerHTML = `
        <div class="dcn-eq-standard dcn-eq-block active">
            <span class="dcn-eq-label">Standard</span>
            <span class="dcn-eq-formula">y(p<sub>0</sub>) = &Sigma; w(p<sub>n</sub>) &middot; x(p<sub>0</sub> + p<sub>n</sub>)</span>
        </div>
        <div class="dcn-eq-deformable dcn-eq-block">
            <span class="dcn-eq-label">Deformable</span>
            <span class="dcn-eq-formula">y(p<sub>0</sub>) = &Sigma; w(p<sub>n</sub>) &middot; x(p<sub>0</sub> + p<sub>n</sub> + <em>&Delta;p<sub>n</sub></em>)</span>
        </div>
        <div class="dcn-eq-v2 dcn-eq-block">
            <span class="dcn-eq-label">v2 / v3 / v4</span>
            <span class="dcn-eq-formula">y(p<sub>0</sub>) = &Sigma; w(p<sub>n</sub>) &middot; <em>m<sub>n</sub></em> &middot; x(p<sub>0</sub> + p<sub>n</sub> + <em>&Delta;p<sub>n</sub></em>)</span>
            <span class="dcn-eq-note">v3 &amp; v4 differ architecturally, not in the sampling formula.</span>
        </div>
    `;

    const eqBlocks = eqPanel.querySelectorAll('.dcn-eq-block');

    // Wrap SVG + equation side by side
    const body = document.createElement('div');
    body.className = 'dcn-body';
    body.appendChild(svg);
    body.appendChild(eqPanel);

    const origSetMode = setMode;
    setMode = function(m) {
        origSetMode(m);
        eqBlocks.forEach(b => b.classList.remove('active'));
        if (m === 'standard') {
            eqPanel.querySelector('.dcn-eq-standard').classList.add('active');
        } else {
            eqPanel.querySelector('.dcn-eq-deformable').classList.add('active');
            eqPanel.querySelector('.dcn-eq-v2').classList.add('active');
        }
    };

    // Caption
    const caption = document.createElement('p');
    caption.className = 'dcn-caption';
    caption.textContent = 'Click to toggle between fixed and learnable sampling positions.';

    container.appendChild(toggle);
    container.appendChild(body);
    container.appendChild(caption);
    updatePositions();
}

function renderMicroblogTags(activeTag) {
    const allTags = [...new Set(microblogEntries.flatMap(e => e.tags))];
    microblogTagsEl.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = 'microblog-tag-btn' + (activeTag === 'all' ? ' active' : '');
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', () => filterMicroblog('all'));
    microblogTagsEl.appendChild(allBtn);

    allTags.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = 'microblog-tag-btn' + (activeTag === tag ? ' active' : '');
        btn.textContent = tag;
        btn.addEventListener('click', () => filterMicroblog(tag));
        microblogTagsEl.appendChild(btn);
    });
}

function renderMicroblogList(filterTag) {
    const filtered = filterTag === 'all'
        ? microblogEntries
        : microblogEntries.filter(e => e.tags.includes(filterTag));

    microblogCards.innerHTML = filtered.map((e, i) =>
        `<div class="microblog-card" data-id="${e.id}" style="animation-delay: ${i * 30}ms">
            <span class="microblog-card-title">${e.title}</span>
            <span class="microblog-card-date">${e.date}</span>
        </div>`
    ).join('');

    microblogCards.querySelectorAll('.microblog-card').forEach(card => {
        card.addEventListener('click', () => showMicroblogPost(card.dataset.id));
    });
}

function filterMicroblog(tag) {
    if (microblogTagSwitching) return;
    microblogTagSwitching = true;

    renderMicroblogTags(tag);
    microblogCards.classList.add('fading');

    setTimeout(() => {
        renderMicroblogList(tag);
        microblogCards.classList.remove('fading');
        colorizeLinks();
        microblogTagSwitching = false;
    }, 300);
}

function showMicroblogPost(id) {
    const entry = microblogEntries.find(e => e.id === id);
    if (!entry) return;

    microblogList.classList.add('hidden');
    microblogDetail.classList.add('visible');

    const refsHtml = entry.links.length
        ? `<div class="microblog-detail-refs"><span>References</span>${entry.links.map(l => `<a href="${l.url}" target="_blank">${l.label}</a>`).join('')}</div>`
        : '';

    microblogDetail.innerHTML = `
        <button class="back-btn" id="microblog-back-btn">&larr; back</button>
        <div class="microblog-detail-title">${entry.title}</div>
        <div class="microblog-detail-meta">
            <span class="microblog-detail-date">${entry.date}</span>
            ${entry.tags.map(t => `<span class="microblog-detail-tag">${t}</span>`).join('')}
        </div>
        ${entry.diagram ? `<div class="microblog-diagram" id="microblog-diagram-${entry.diagram}"></div>` : ''}
        <div class="microblog-detail-content">${entry.content}</div>
        ${refsHtml}
    `;

    document.getElementById('microblog-back-btn').addEventListener('click', hideMicroblogPost);
    if (entry.diagram) buildMicroblogDiagram(entry.diagram);
    colorizeLinks();
}

function hideMicroblogPost() {
    microblogDetail.classList.remove('visible');
    microblogList.classList.remove('hidden');
}

// ── Notation view ────────────────────────────────────────────────────────────
const microblogNotation = document.getElementById('microblog-notation');

function showNotation() {
    microblogList.classList.add('hidden');
    microblogNotation.classList.add('visible');

    microblogNotation.innerHTML = `
        <div class="notation-content">
            <button class="back-btn" id="notation-back-btn">&larr; back</button>
            <div class="microblog-detail-title">Notations</div>
            <table class="notation-table">
                <thead>
                    <tr><th>Symbol</th><th>Meaning</th></tr>
                </thead>
                <tbody>
                    <tr><td>x</td><td>Input feature map</td></tr>
                    <tr><td>y</td><td>Output feature map</td></tr>
                    <tr><td>w(p<sub>n</sub>)</td><td>Kernel weight at grid position n</td></tr>
                    <tr><td>p<sub>0</sub></td><td>Current output spatial position</td></tr>
                    <tr><td>p<sub>n</sub></td><td>Sampling offset in the kernel grid</td></tr>
                    <tr><td>&Delta;p<sub>n</sub></td><td>Learnable offset added to each sampling position</td></tr>
                    <tr><td>m<sub>n</sub></td><td>Learnable modulation scalar per sample</td></tr>
                </tbody>
            </table>
        </div>
    `;

    document.getElementById('notation-back-btn').addEventListener('click', hideNotation);
}

function hideNotation() {
    microblogNotation.classList.remove('visible');
    microblogList.classList.remove('hidden');
}

document.getElementById('microblog-notation-link').addEventListener('click', showNotation);

renderMicroblogTags('all');
renderMicroblogList('all');

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

// ── Instance Imbalance Interactive Diagram ───────────────────────────────────
(function () {
    const container = document.getElementById('instance-diagram');
    if (!container) return;

    const blobs = [
        { x: 14, y: 40, r: 34 },
        { x: 38, y: 28, r: 24 },
        { x: 62, y: 58, r: 18 },
        { x: 28, y: 72, r: 13 },
        { x: 76, y: 32, r: 9 },
        { x: 50, y: 16, r: 6 },
        { x: 82, y: 68, r: 5 },
        { x: 90, y: 18, r: 4 },
    ];

    const totalArea = blobs.reduce((s, b) => s + b.r * b.r, 0);
    const N = blobs.length;
    blobs.forEach(b => {
        b.diceW = (b.r * b.r) / totalArea;
        b.instW = 1 / N;
    });

    // Pastel VIBGYOR instance colors
    const vibgyor = [
        '#b8a0d8', '#8b9bd4', '#7cbcd4', '#8cc8a0',
        '#d4cc80', '#d8a878', '#d48888', '#d4a0b8'
    ];

    let mode = 'dice';

    // ── Label type tabs ──
    const labels = document.createElement('div');
    labels.className = 'diagram-labels';

    const lblSem = document.createElement('button');
    lblSem.className = 'label-tab active';
    lblSem.textContent = 'Semantic Labels';
    lblSem.addEventListener('click', () => setMode('dice'));

    const lblInst = document.createElement('button');
    lblInst.className = 'label-tab';
    lblInst.textContent = 'Instance Labels';
    lblInst.addEventListener('click', () => setMode('instance'));

    labels.appendChild(lblSem);
    labels.appendChild(lblInst);

    // ── Scatter view ──
    const scatter = document.createElement('div');
    scatter.className = 'diagram-scatter';

    blobs.forEach((b, i) => {
        const el = document.createElement('div');
        el.className = 'diagram-blob';
        el.style.left = b.x + '%';
        el.style.top = b.y + '%';
        el.style.width = b.r * 2 + 'px';
        el.style.height = b.r * 2 + 'px';

        const ring = document.createElement('div');
        ring.className = 'blob-ring';
        el.appendChild(ring);

        b.el = el;
        b.ring = ring;
        scatter.appendChild(el);

        el.addEventListener('mouseenter', () => hi(i));
        el.addEventListener('mouseleave', lo);
    });

    // ── Controls row: toggle + scores ──
    const controls = document.createElement('div');
    controls.className = 'diagram-controls';

    const toggle = document.createElement('div');
    toggle.className = 'diagram-toggle';

    const btnD = document.createElement('button');
    btnD.className = 'diagram-btn active';
    btnD.textContent = 'Dice Loss';
    btnD.addEventListener('click', () => setMode('dice'));

    const btnI = document.createElement('button');
    btnI.className = 'diagram-btn';
    btnI.textContent = 'Instance-Aware Dice Loss';
    btnI.addEventListener('click', () => setMode('instance'));

    toggle.appendChild(btnD);
    toggle.appendChild(btnI);

    // ── Score cards ──
    const scores = document.createElement('div');
    scores.className = 'diagram-scores';

    function makeScoreCard(label) {
        const card = document.createElement('div');
        card.className = 'score-card';
        const lbl = document.createElement('span');
        lbl.className = 'score-label';
        lbl.textContent = label;
        const val = document.createElement('span');
        val.className = 'score-value';
        card.appendChild(lbl);
        card.appendChild(val);
        return { card, val };
    }

    const dscCard = makeScoreCard('DSC');
    const pqCard = makeScoreCard('PQ');
    scores.appendChild(dscCard.card);
    scores.appendChild(pqCard.card);

    controls.appendChild(toggle);
    controls.appendChild(scores);

    const scoreTargets = {
        dice:     { dsc: 0.95, pq: 0.38 },
        instance: { dsc: 0.88, pq: 0.76 }
    };
    let currentDsc = 0, currentPq = 0;

    // ── Vertical contribution bars ──
    const barsWrap = document.createElement('div');
    barsWrap.className = 'diagram-bars';

    blobs.forEach((b, i) => {
        const col = document.createElement('div');
        col.className = 'diagram-bar-col';

        const pct = document.createElement('span');
        pct.className = 'bar-pct';

        const track = document.createElement('div');
        track.className = 'bar-track-v';

        const fill = document.createElement('div');
        fill.className = 'bar-fill-v';
        track.appendChild(fill);

        const dot = document.createElement('div');
        dot.className = 'bar-dot';
        const dotSize = Math.max(4, Math.round(b.r * 0.45));
        dot.style.width = dotSize + 'px';
        dot.style.height = dotSize + 'px';

        col.appendChild(pct);
        col.appendChild(track);
        col.appendChild(dot);

        b.fill = fill;
        b.pct = pct;
        b.col = col;
        barsWrap.appendChild(col);

        col.addEventListener('mouseenter', () => hi(i));
        col.addEventListener('mouseleave', lo);
    });

    // ── Caption ──
    const caption = document.createElement('p');
    caption.className = 'diagram-caption';

    const top = document.createElement('div');
    top.className = 'diagram-top';
    top.appendChild(scatter);
    top.appendChild(barsWrap);

    container.appendChild(labels);
    container.appendChild(top);
    container.appendChild(controls);
    container.appendChild(caption);

    // ── Updates ──
    function setMode(m) {
        if (m === mode) return;
        mode = m;
        btnD.classList.toggle('active', mode === 'dice');
        btnI.classList.toggle('active', mode === 'instance');
        btnI.classList.toggle('rainbow', mode === 'instance');
        lblSem.classList.toggle('active', mode === 'dice');
        lblInst.classList.toggle('active', mode === 'instance');
        lblInst.classList.toggle('rainbow', mode === 'instance');
        update();
    }

    function animateScore(el, from, to, flagLow) {
        const duration = 500;
        const start = performance.now();
        function tick(now) {
            const p = Math.min(1, (now - start) / duration);
            const ease = 1 - Math.pow(1 - p, 3);
            const v = from + (to - from) * ease;
            el.textContent = v.toFixed(2);
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        el.classList.toggle('low', flagLow && to < 0.5);
        el.classList.toggle('high', flagLow && to >= 0.5);
    }

    function update() {
        const maxW = Math.max(...blobs.map(b => mode === 'dice' ? b.diceW : b.instW));

        blobs.forEach((b, i) => {
            const w = mode === 'dice' ? b.diceW : b.instW;
            const n = w / maxW;

            b.el.style.opacity = 0.12 + 0.88 * n;
            b.ring.style.transform = 'scale(' + (1 + 0.5 * n) + ')';
            b.ring.style.opacity = 0.08 + 0.72 * n;
            b.fill.style.height = (n * 100) + '%';
            b.pct.textContent = (w * 100).toFixed(1) + '%';

            if (mode === 'instance') {
                b.el.style.setProperty('--blob-color', vibgyor[i]);
                b.col.style.setProperty('--blob-color', vibgyor[i]);
            } else {
                b.el.style.removeProperty('--blob-color');
                b.col.style.removeProperty('--blob-color');
            }
        });

        const t = scoreTargets[mode];
        animateScore(dscCard.val, currentDsc, t.dsc, false);
        animateScore(pqCard.val, currentPq, t.pq, true);
        currentDsc = t.dsc;
        currentPq = t.pq;

        caption.textContent = mode === 'dice'
            ? 'With Dice loss, the largest instance owns 48.5% of the gradient. The 3 smallest share just 3.2% \u2014 the model has almost no incentive to detect them.'
            : 'Instance-aware: every instance contributes 12.5%, regardless of size. Small lesions receive equal learning signal.';
    }

    // ── Hover cross-highlighting ──
    function hi(idx) {
        container.classList.add('has-highlight');
        blobs.forEach((b, i) => {
            const on = i === idx;
            b.el.classList.toggle('highlighted', on);
            b.col.classList.toggle('highlighted', on);
        });
    }

    function lo() {
        container.classList.remove('has-highlight');
        blobs.forEach(b => {
            b.el.classList.remove('highlighted');
            b.col.classList.remove('highlighted');
        });
    }

    update();
})();
