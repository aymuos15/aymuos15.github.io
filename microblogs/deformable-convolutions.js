/* eslint-disable no-undef, quotes */
// ── Deformable Convolution Entry ─────────────────────────────────────────────
microblogEntries.push({
    id: "deformable-convolutions",
    date: "Mar. '26",
    title: "Deformable Convolutions",
    tags: ["computer-vision", "convolutions"],
    diagram: "deformable-conv",
    content: `<p>Standard convolutions sample on a fixed rectangular grid, limiting for irregular shapes. Deformable Convolutions (<a href="https://arxiv.org/abs/1703.06211" target="_blank">Dai et al., ICCV 2017</a>) add learnable offsets to each sampling position so the receptive field adapts to the geometry of the content. DCNv2 (<a href="https://arxiv.org/abs/1811.11168" target="_blank">Zhu et al., CVPR 2019</a>) adds per-sample modulation scalars that control <em>how much</em> each offset position contributes. DCNv3 (<a href="https://arxiv.org/abs/2211.05778" target="_blank">Wang et al., CVPR 2023</a>) shares weights across groups and softmax-normalises the modulation, and DCNv4 (<a href="https://arxiv.org/abs/2401.06197" target="_blank">Xiong et al., CVPR 2024</a>) removes the softmax constraint and optimises memory access for faster inference.</p>`,
    links: []
});

// ── DCN Diagram Builder ──────────────────────────────────────────────────────
function buildMicroblogDiagramDCN(type) {
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
