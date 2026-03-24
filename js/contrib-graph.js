/* eslint-disable no-undef */
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
