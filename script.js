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
    });
});

// Section switching
let isTransitioning = false;

function switchSection(targetId) {
    if (isTransitioning) return;

    const current = document.querySelector('.section.active');
    const next = document.getElementById(targetId);

    if (!next || current === next) return;

    isTransitioning = true;

    // Update nav
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    const navLink = document.querySelector(`.nav-links a[href="#${targetId}"]`);
    if (navLink) navLink.classList.add('active');

    // Fade out current
    current.classList.remove('active');
    current.classList.add('leaving');

    setTimeout(() => {
        current.classList.remove('leaving');
        next.classList.add('active');
        isTransitioning = false;
    }, 300);
}

// Nav click handlers
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
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

function renderUpdates(category, animate) {
    const list = document.getElementById('updates-list');
    const filtered = category === 'all'
        ? updates.filter(u => u.category !== 'pr')
        : updates.filter(u => u.category === category);
    list.innerHTML = filtered.map((u, i) =>
        `<div class="update-item" style="animation-delay: ${i * 30}ms"><span class="update-date">${u.date}</span><span class="update-desc">${u.description}</span></div>`
    ).join('');

    if (animate) {
        list.scrollTop = 0;
    }
}

renderUpdates('all', false);

// Tab click handlers
let tabSwitching = false;

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        if (tabSwitching || tab.classList.contains('active')) return;
        tabSwitching = true;

        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const list = document.getElementById('updates-list');
        list.classList.add('fading');

        setTimeout(() => {
            renderUpdates(tab.dataset.category, true);
            list.classList.remove('fading');
            tabSwitching = false;
        }, 300);
    });
});

// Name click - toggle pronunciation
document.querySelector('.name-link').addEventListener('click', () => {
    document.getElementById('pronunciation').classList.toggle('visible');
});

// Research link - toggle collaborators
document.querySelector('.research-link').addEventListener('click', () => {
    document.getElementById('about-content').style.display = 'none';
    document.getElementById('collaborators').classList.add('visible');
});

document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('collaborators').classList.remove('visible');
    document.getElementById('about-content').style.display = '';
});

// Pastel rainbow link colors
const pastelColors = [
    '#e8a0bf', '#f0b8a8', '#f2cc8f', '#b5d99c',
    '#a8d8ea', '#b8b8f0', '#d4a5e5', '#f5a8a8',
    '#a8e0c8', '#c4b8e8', '#e8c8a0', '#a0c8e8'
];

function colorizeLinks() {
    document.querySelectorAll('main a, .update-desc a').forEach(link => {
        const color = pastelColors[Math.floor(Math.random() * pastelColors.length)];
        link.style.color = color;
    });
}

colorizeLinks();

// Re-colorize after tab switch and section change
const origRender = renderUpdates;
renderUpdates = function (category, animate) {
    origRender(category, animate);
    colorizeLinks();
};

const origSwitch = switchSection;
switchSection = function (targetId) {
    origSwitch(targetId);
    setTimeout(colorizeLinks, 350);
};

// Gallery image cycling
const extraImages = [
    'gallery/isbi.jpeg',
    'gallery/pupil.jpeg'
];

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

function applyImagePosition(img) {
    const filename = img.src.split('/').pop();
    img.style.objectPosition = imagePositions[filename] || 'center center';
}

document.querySelectorAll('.image-grid-cell').forEach(cell => {
    let currentImg = cell.querySelector('img');
    let isAnimating = false;
    applyImagePosition(currentImg);

    cell.addEventListener('click', () => {
        if (extraImages.length > 0 && !isAnimating) {
            isAnimating = true;
            const oldSrc = currentImg.src;
            const newSrc = extraImages.shift();
            const dir = slideDirections[Math.floor(Math.random() * slideDirections.length)];

            const nextImg = document.createElement('img');
            nextImg.src = newSrc;
            applyImagePosition(nextImg);
            nextImg.style.transition = 'none';
            nextImg.style.transform = dir.enter;
            cell.appendChild(nextImg);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    nextImg.style.transition = '';
                    nextImg.style.transform = 'translate(0, 0)';
                    currentImg.style.transform = dir.exit;
                });
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
