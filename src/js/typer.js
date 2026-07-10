// Typer — a character-by-character text reveal where each glyph ripples through a
// pool of randomized visual states (filled pill, inverse, accent, outlined pill…)
// before settling into plain text. Adjacent same-state chars merge into one
// rounded bar (that corner-merging is pure CSS, see components/typer.css).
// Ported to plain JS (classic script) from the standalone TS source.

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

const roundToStep = (v, step) => Math.round(v / step) * step;

const remap = (v, inLo, inHi, outLo, outHi) =>
    ((v - inLo) * (outHi - outLo)) / (inHi - inLo) + outLo;

// solve a cubic bezier easing y for a given x; endpoints fixed at (0,0)(1,1).
function bezierEase(x, x1, y1, x2, y2, eps = 1e-6) {
    const bx = t => 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t ** 2 * x2 + t ** 3;
    const by = t => 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3;
    const bxDeriv = t =>
        3 * (1 - t) ** 2 * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t ** 2 * (1 - x2);

    let t = x;
    for (let i = 0; i < 8; i++) {
        const dx = bx(t) - x;
        if (Math.abs(dx) < eps) return by(t);
        const d = bxDeriv(t);
        if (Math.abs(d) < 1e-6) break;
        t -= dx / d;
    }
    let lo = 0, hi = 1;
    t = x;
    while (lo < hi) {
        const cx = bx(t);
        if (Math.abs(cx - x) < eps) return by(t);
        if (cx < x) lo = t; else hi = t;
        t = (lo + hi) / 2;
    }
    return by(t);
}

const ALL_VARIATIONS = [
    'charFill',
    'charInverse',
    'charAccent',
    'charAccentInverse',
    'charAccentFill',
    'charBorder',
];

class Typer {
    constructor(element, opts = {}) {
        this.element = element;
        this.source = element.textContent || '';
        this.length = this.source.replace(/\s/g, '').length;
        this.fps = opts.fps ?? 20;
        this.cycles = opts.cycles ?? 3;
        this.cycleLength = opts.cycleLength ?? 0.5;
        this.frames = this.length ? this.fps * (1 + this.length * 0.01) : 0;
        this.frame = 0;
        this.loop = null;
        this.delay = opts.delay ?? 0;
        this.delayTimer = null;
        this.charNodes = [];
        this.type = 'initial';
        this.divisor = this.length > 1 ? this.length - 1 : 1;
        this.denominator = this.frames - this.frames * this.cycleLength || 1;
        this.variations = (opts.variations ?? [...ALL_VARIATIONS]).slice();
        this.shuffle();
        this.initVisible = opts.initVisible ?? false;

        if (this.length) {
            this.build();
            if (this.initVisible) {
                this.charNodes.forEach(n => this.setClass(n, 'char'));
                this.type = 'done';
                this.element.dataset.typerType = 'done';
            } else {
                this.applyFrame();
                this.element.dataset.typerType = 'initial';
            }
        }
    }

    build() {
        this.element.innerHTML = '';
        this.charNodes = [];
        const parts = this.source.split(/(\s+)/);
        let i = 0;
        for (const part of parts) {
            if (part.trim() === '') {
                this.element.append(document.createTextNode(part));
                continue;
            }
            const word = document.createElement('span');
            word.className = 'word';
            for (const ch of part.split('')) {
                const pos = i / this.divisor;
                const cp = roundToStep(bezierEase(pos, 0, 0.75, 0.75, 0), 0.05);
                const span = document.createElement('span');
                span.className = 'char charInit';
                span.textContent = ch || ' ';
                // Give each glyph its own pastel from the site palette so the ripple
                // reads as the semi-rainbow theme instead of a knockout white.
                span.style.setProperty(
                    '--char-color',
                    window.pastelColors[Math.floor(Math.random() * window.pastelColors.length)],
                );
                this.charNodes.push({ el: span, cp, currentClass: 'char charInit' });
                i += 1;
                word.appendChild(span);
            }
            this.element.appendChild(word);
        }
    }

    in() { this.setType('in'); }

    setType(t) {
        if (t === this.type) return;
        this.type = t;
        this.element.dataset.typerType = t;
        this.stopLoop();
        this.frame = 0;
        this.applyFrame();
        if (t !== 'initial' && this.charNodes.length) this.startLoop();
    }

    startLoop() {
        if (this.loop || this.delayTimer || !this.charNodes.length) return;
        if (this.type === 'initial') return;
        this.shuffle();
        const begin = () => {
            this.delayTimer = null;
            if (this.loop || this.type === 'initial') return;
            this.applyFrame();
            this.loop = window.setInterval(() => this.tick(), 1000 / this.fps);
        };
        if (this.delay > 0) {
            this.delayTimer = window.setTimeout(begin, this.delay * 1000);
        } else {
            begin();
        }
    }

    stopLoop() {
        if (this.delayTimer) {
            window.clearTimeout(this.delayTimer);
            this.delayTimer = null;
        }
        if (this.loop) {
            window.clearInterval(this.loop);
            this.loop = null;
        }
    }

    tick() {
        this.frame += 1;
        this.frame = clamp(this.frame, 0, this.frames);
        this.applyFrame();
        if (this.frame >= this.frames) {
            this.stopLoop();
            this.type = 'done';
            this.element.dataset.typerType = 'done';
        }
    }

    applyFrame() {
        if (!this.length || !this.charNodes.length) return;
        if (this.type === 'initial') {
            this.charNodes.forEach(n => this.setClass(n, 'char charInit'));
            return;
        }
        const progress = this.frame / this.denominator;

        for (const node of this.charNodes) {
            let p = progress - node.cp;
            p = roundToStep(p, 0.1);
            p = clamp(p, 0, 1);

            let variation = 'charInit';
            if (p > 0) {
                const idx = Math.round(remap(p, 0, 1, 0, this.cycles));
                variation = this.variations[idx % this.variations.length];
            }
            if (p >= 1) variation = '';
            const midClass = variation ? `char ${variation}` : 'char';
            const cls = p <= 0 ? 'char charInit' : p >= 1 ? 'char' : midClass;
            this.setClass(node, cls);
        }
    }

    setClass(node, cls) {
        if (cls === node.currentClass) return;
        node.currentClass = cls;
        node.el.className = cls;
    }

    shuffle() {
        this.variations.sort(() => 0.5 - Math.random());
    }
}

// Expose so updates.js (the name-click handler) can drive it.
window.Typer = Typer;
