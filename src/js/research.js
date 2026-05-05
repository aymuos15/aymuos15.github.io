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
    btnD.textContent = 'Dice Metric';
    btnD.addEventListener('click', () => setMode('dice'));

    const btnI = document.createElement('button');
    btnI.className = 'diagram-btn';
    btnI.textContent = 'Instance-Aware Dice Metric';
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
            ? 'With the standard Dice Score, the largest instance owns 48.5% of the metric. The 3 smallest share just 3.2%. Missing them barely changes the score.'
            : 'Instance-aware: every instance contributes 12.5% to the score, regardless of size. Small lesions are weighted equally.';
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
