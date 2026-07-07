/* eslint-disable no-undef */
// Tile-field wordmark for the nav dropdown — only while About is the active
// section. Each menu item (HOME, ABOUT, ...) is rasterized into a dense grid of
// square tiles; a slow brand-hue colour wave wanders across them, and the cursor
// brushes a soft morphing light blob with occasional sparks. The real <a> links
// sit on top with hidden text, so navigation still works.
//
// Ported from the framework-agnostic TileField engine and adapted to sample the
// menu's own layout instead of a single centred wordmark.

(function navTilesModule() {
    const TAU = Math.PI * 2;

    // Pastel palette shared with the rest of the repo (utils.js), so the colour
    // wave and cursor light tint tiles with the same rainbow used elsewhere
    // instead of a single brand hue.
    const PASTELS = (window.pastelColors && window.pastelColors.length)
        ? window.pastelColors.slice()
        : ['#e8a0bf', '#f0b8a8', '#f2cc8f', '#b5d99c', '#a8d8ea', '#b8b8f0',
            '#d4a5e5', '#f5a8a8', '#a8e0c8', '#c4b8e8', '#e8c8a0', '#a0c8e8'];
    const NP = PASTELS.length;

    const MAXSZ = 0.9;
    const SPEED = 0.02;
    const ALPHA_STEPS = 6;

    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const smoothstep = (x, e0, e1) => {
        const t = clamp((x - e0) / (e1 - e0), 0, 1);
        return t * t * (3 - 2 * t);
    };
    function hash(x, y) {
        const r = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
        return r - Math.floor(r);
    }
    function hexToRgb(hex) {
        const h = hex.replace('#', '');
        const v = h.length === 3 ? h.split('').map(ch => ch + ch).join('') : h;
        const int = parseInt(v, 16);
        return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
    }
    const PASTEL_RGB = PASTELS.map(hexToRgb);

    class NavTileField {
        constructor(container) {
            this.container = container;
            this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            this.canvas = document.createElement('canvas');
            this.canvas.className = 'nav-tiles-canvas';
            this.ctx = this.canvas.getContext('2d');
            container.prepend(this.canvas);

            this.dpr = Math.min(2, window.devicePixelRatio || 1);
            this.viewW = 0;
            this.viewH = 0;
            this.cell = 3;
            this.time = 0;
            this.raf = 0;
            this.active = false;

            this.n = 0;
            this.px = new Float32Array(0);
            this.py = new Float32Array(0);
            this.spark = new Uint8Array(0);
            this.seed = new Float32Array(0);
            this.hueSeed = new Float32Array(0);
            this.lit = new Float32Array(0);

            this.hasPointer = false;
            this.rawX = 0;
            this.rawY = 0;
            this.lightX = 0;
            this.lightY = 0;
            this.lightSpeed = 0;

            this.rest = '#888';

            this.onMove = this.onMove.bind(this);
            this.onLeave = this.onLeave.bind(this);
            this.frame = this.frame.bind(this);
        }

        // Rasterize every menu item's text into an offscreen canvas at its real
        // on-screen position, then keep one tile per grid cell that lands on ink.
        build() {
            const rect = this.container.getBoundingClientRect();
            this.viewW = rect.width;
            this.viewH = rect.height;
            if (this.viewW < 1 || this.viewH < 1) return;
            // Base (unlit) tiles read as the theme's muted menu text colour.
            this.rest =
                getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#888';
            this.dpr = Math.min(2, window.devicePixelRatio || 1);
            // Fine tiles so each small glyph spans enough of them to read.
            const cell = Math.max(1.5, this.viewW / 52);
            this.cell = cell;

            this.canvas.style.width = `${Math.round(this.viewW)}px`;
            this.canvas.style.height = `${Math.round(this.viewH)}px`;
            this.canvas.width = Math.ceil(this.viewW * this.dpr);
            this.canvas.height = Math.ceil(this.viewH * this.dpr);
            this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            this.ctx.imageSmoothingEnabled = false;

            // Rasterize the menu text supersampled (SS×) so thin strokes are
            // captured cleanly; a tile then samples the MAX coverage across its
            // whole cell, so no stroke slips between sample points.
            const SS = 2;
            const w = Math.max(1, Math.floor(this.viewW));
            const h = Math.max(1, Math.floor(this.viewH));
            const ow = w * SS;
            const oh = h * SS;
            const sc = document.createElement('canvas');
            sc.width = ow;
            sc.height = oh;
            const s = sc.getContext('2d');
            s.scale(SS, SS);
            s.textAlign = 'right';
            s.textBaseline = 'middle';
            s.fillStyle = '#000';

            this.container.querySelectorAll('a').forEach(a => {
                const ar = a.getBoundingClientRect();
                const cs = getComputedStyle(a);
                s.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
                s.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
                const x = ar.right - rect.left;
                const y = ar.top - rect.top + ar.height / 2;
                s.fillText(a.textContent.toUpperCase(), x, y);
            });

            const data = s.getImageData(0, 0, ow, oh).data;
            const cols = Math.ceil(this.viewW / cell);
            const rows = Math.ceil(this.viewH / cell);
            const xs = [], ys = [], sp = [], sd = [], hs = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const x0 = Math.floor(c * cell * SS);
                    const x1 = Math.min(ow, Math.ceil((c * cell + cell) * SS));
                    const y0 = Math.floor(r * cell * SS);
                    const y1 = Math.min(oh, Math.ceil((r * cell + cell) * SS));
                    let maxA = 0;
                    for (let yy = y0; yy < y1; yy++) {
                        for (let xx = x0; xx < x1; xx++) {
                            const a = data[(yy * ow + xx) * 4 + 3];
                            if (a > maxA) maxA = a;
                        }
                    }
                    if (maxA <= 110) continue;
                    const gx = c * cell + cell / 2;
                    const gy = r * cell + cell / 2;
                    xs.push(gx);
                    ys.push(gy);
                    sp.push(hash(gx + 7, gy - 3) > 0.82 ? 1 : 0);
                    sd.push(hash(gx * 1.3, gy * 0.7));
                    hs.push(hash(gx * 0.7 + 11, gy * 1.9 - 5));
                }
            }

            this.n = xs.length;
            this.px = new Float32Array(xs);
            this.py = new Float32Array(ys);
            this.spark = new Uint8Array(sp);
            this.seed = new Float32Array(sd);
            this.hueSeed = new Float32Array(hs);
            this.lit = new Float32Array(this.n);
        }

        distSegSq(qx, qy, ax, ay, bx, by) {
            const dx = bx - ax, dy = by - ay;
            if (dx === 0 && dy === 0) {
                const ex = qx - ax, ey = qy - ay;
                return ex * ex + ey * ey;
            }
            const t = clamp(((qx - ax) * dx + (qy - ay) * dy) / (dx * dx + dy * dy), 0, 1);
            const ex = qx - (ax + dx * t), ey = qy - (ay + dy * t);
            return ex * ex + ey * ey;
        }

        frame(t) {
            if (!this.active) return;
            const ctx = this.ctx;
            const { viewW, viewH, cell, n, px, py, spark, lit, seed } = this;

            ctx.clearRect(0, 0, viewW, viewH);
            this.time += SPEED;
            const time = this.time;

            const prevX = this.lightX, prevY = this.lightY;
            if (this.hasPointer) {
                this.lightX += (this.rawX - this.lightX) * 0.5;
                this.lightY += (this.rawY - this.lightY) * 0.5;
            }
            const lightX = this.lightX, lightY = this.lightY;
            const stepDist = Math.hypot(lightX - prevX, lightY - prevY);
            this.lightSpeed = 0.9 * this.lightSpeed + 0.1 * stepDist;
            const lightSpeed = this.lightSpeed;
            const moving = this.hasPointer;

            const reach = clamp(viewH * 0.22 + lightSpeed * 0.9, viewH * 0.18, viewH * 0.42);
            const influence = 1.5 * reach;
            const influenceSq = influence * influence;
            const minX = Math.min(prevX, lightX) - influence;
            const maxX = Math.max(prevX, lightX) + influence;
            const minY = Math.min(prevY, lightY) - influence;
            const maxY = Math.max(prevY, lightY) + influence;

            const T = time;
            const grayP = new Path2D();
            const litList = [];
            const buckets = Array.from({ length: NP }, () =>
                Array.from({ length: ALPHA_STEPS }, () => new Path2D()));

            for (let i = 0; i < n; i++) {
                const x = px[i], y = py[i];

                let target = 0;
                if (moving && x >= minX && x <= maxX && y >= minY && y <= maxY) {
                    const dSq = this.distSegSq(x, y, prevX, prevY, lightX, lightY);
                    if (dSq <= influenceSq) {
                        const ang = Math.atan2(y - lightY, x - lightX);
                        const wobble =
                        1 +
                        0.30 * Math.sin(3 * ang + time * 1.6) +
                        0.16 * Math.sin(5 * ang - time * 1.1 + 1.3);
                        const f = clamp(1 - Math.sqrt(dSq) / (reach * wobble), 0, 1);
                        target = f * f * (3 - 2 * f);
                    }
                }

                const rate = target > lit[i] ? 0.24 : 0.02;
                lit[i] += (target - lit[i]) * rate;

                const u = x / Math.max(viewW, 1);
                const v = y / Math.max(viewH, 1);
                const flow =
                Math.sin((u * 1.6 + 0.4 * Math.sin(T * 0.3)) * TAU + T * 0.8) +
                0.7 * Math.sin((v * 2.1 - u * 0.9) * TAU - T * 0.6 + 1.7) +
                0.5 * Math.sin((u * 3.3 + v * 2.7) * TAU + T * 0.4 + 4.2) +
                0.4 * Math.cos((v * 1.3 - 1.1 * Math.sin(T * 0.2)) * TAU - T * 0.5);
                let colorAmt = smoothstep(flow, 0.1, 1.6);
                colorAmt = Math.max(colorAmt, lit[i]);

                const breathe = 0.5 + 0.5 * Math.sin(seed[i] * TAU + time * 1.3);
                // Denser base fill so the small nav glyphs stay legible; the wave
                // and cursor light still grow tiles toward MAXSZ and shift colour.
                const base = 0.6 + 0.12 * breathe;
                const sz = cell * (base + (MAXSZ - base) * colorAmt);
                const hh = sz / 2;
                grayP.rect(x - hh, y - hh, sz, sz);

                if (colorAmt > 0.04) {
                    // Stable pastel per tile (like the repo's random rainbow
                    // letters); the wave/light drive how strongly it shows.
                    const idx = Math.min(NP - 1, Math.floor(this.hueSeed[i] * NP));
                    const as = Math.min(ALPHA_STEPS - 1, Math.floor(colorAmt * ALPHA_STEPS));
                    buckets[idx][as].rect(x - hh, y - hh, sz, sz);
                }

                if (lit[i] > 0.02) litList.push(i);
            }

            ctx.fillStyle = this.rest;
            ctx.fill(grayP);

            for (let idx = 0; idx < NP; idx++) {
                ctx.fillStyle = PASTELS[idx];
                for (let as = 0; as < ALPHA_STEPS; as++) {
                    ctx.globalAlpha = (as + 1) / ALPHA_STEPS;
                    ctx.fill(buckets[idx][as]);
                }
            }
            ctx.globalAlpha = 1;

            for (const i of litList) {
                const L = lit[i];
                const x = px[i], y = py[i];
                const gsz = cell * (0.7 + (MAXSZ - 0.7) * L);
                const gh = gsz / 2;
                const [rr, gg, bb] = PASTEL_RGB[Math.min(NP - 1, Math.floor(this.hueSeed[i] * NP))];
                if (spark[i]) {
                    const ph = seed[i];
                    const tt = 0.00025 * t;
                    const amp = (0.45 + ph) * cell * 0.28;
                    const jx = x + Math.sin(0.05 * x + 1.3 * tt + ph * TAU) * amp;
                    const jy = y + Math.cos(0.04 * y - 0.9 * tt + ph * TAU) * amp;
                    ctx.fillStyle = `rgba(${rr},${gg},${bb},${(0.12 * L).toFixed(3)})`;
                    ctx.fillRect(jx - gh * 1.5, jy - gh * 1.5, gsz * 1.5, gsz * 1.5);
                    ctx.fillStyle = `rgba(${rr},${gg},${bb},${(0.7 * L).toFixed(3)})`;
                    ctx.fillRect(jx - gh, jy - gh, gsz, gsz);
                } else {
                    ctx.fillStyle = `rgba(${rr},${gg},${bb},${(0.9 * L).toFixed(3)})`;
                    ctx.fillRect(x - gh, y - gh, gsz, gsz);
                }
            }

            this.raf = requestAnimationFrame(this.frame);
        }

        renderStatic() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.viewW, this.viewH);
            const grayP = new Path2D();
            for (let i = 0; i < this.n; i++) {
                const sz = this.cell * 0.5;
                const hh = sz / 2;
                grayP.rect(this.px[i] - hh, this.py[i] - hh, sz, sz);
            }
            ctx.fillStyle = this.rest;
            ctx.fill(grayP);
        }

        activate() {
            if (this.active) return;
            // Add the class first so build() samples the enlarged tiled layout.
            this.container.classList.add('nav-tiled');
            this.build();
            if (!this.n) {
                this.container.classList.remove('nav-tiled');
                return;
            }
            this.active = true;
            if (this.reduced) {
                this.renderStatic();
                return;
            }
            window.addEventListener('pointermove', this.onMove, { passive: true });
            window.addEventListener('pointerleave', this.onLeave);
            this.raf = requestAnimationFrame(this.frame);
        }

        deactivate() {
            if (!this.active) return;
            this.active = false;
            if (this.raf) cancelAnimationFrame(this.raf);
            this.raf = 0;
            window.removeEventListener('pointermove', this.onMove);
            window.removeEventListener('pointerleave', this.onLeave);
            this.hasPointer = false;
            this.container.classList.remove('nav-tiled');
            this.ctx.clearRect(0, 0, this.viewW, this.viewH);
        }

        onResize() {
            if (this.active) this.build();
        }

        onMove(e) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            if (x >= -40 && y >= -40 && x <= rect.width + 40 && y <= rect.height + 40) {
                if (!this.hasPointer) {
                    this.hasPointer = true;
                    this.lightX = x;
                    this.lightY = y;
                    this.lightSpeed = 0;
                }
                this.rawX = x;
                this.rawY = y;
            } else {
                this.hasPointer = false;
            }
        }

        onLeave() {
            this.hasPointer = false;
        }
    }

    // Run the tile field only while the About section is active AND the dropdown is
    // open. Rebuild each time it opens so it matches the current layout/theme.
    (function initNavTiles() {
        const container = document.querySelector('.nav-links');
        const about = document.getElementById('about');
        if (!container || !about) return;

        let field = null;
        const shouldRun = () =>
            about.classList.contains('active') && container.classList.contains('open');

        const update = () => {
            if (shouldRun()) {
                if (!field) field = new NavTileField(container);
                field.activate();
            } else {
                field?.deactivate();
            }
        };

        const obs = new MutationObserver(update);
        obs.observe(about, { attributes: true, attributeFilter: ['class'] });
        obs.observe(container, { attributes: true, attributeFilter: ['class'] });
        window.addEventListener('resize', () => field?.onResize());
    })();
})();
