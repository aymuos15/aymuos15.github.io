 
// Binary click burst — vanilla port of the ClickBinary React component.
// Spawns a spray of monospace 0/1 glyphs from the click point that fan out
// and fade. Colour follows the active theme's --text variable.

(function () {
    const CONFIG = {
        fontSize: 12,
        particleCount: 10,
        spreadRadius: 60,
        duration: 800,
        chars: ['0', '1'],
    };

    // ease-out: t * (2 - t)
    const easeOut = (t) => t * (2 - t);

    const canvas = document.createElement('canvas');
    canvas.style.cssText =
        'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    function syncSize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    syncSize();
    window.addEventListener('resize', syncSize);

    let particles = [];

    function textColor() {
        return getComputedStyle(document.documentElement)
            .getPropertyValue('--text').trim() || '#fff';
    }

    function draw(timestamp) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${CONFIG.fontSize}px monospace`;
        ctx.fillStyle = textColor();

        particles = particles.filter((p) => {
            const elapsed = timestamp - p.startTime;
            if (elapsed >= CONFIG.duration) return false;

            const progress = elapsed / CONFIG.duration;
            const eased = easeOut(progress);

            const x = p.originX + Math.cos(p.angle) * eased * p.distance;
            const y = p.originY + Math.sin(p.angle) * eased * p.distance
                - eased * CONFIG.spreadRadius * 0.3;

            const alpha = progress < 0.5 ? 1 : 1 - (progress - 0.5) * 2;

            ctx.globalAlpha = Math.max(0, alpha);
            ctx.fillText(p.char, x, y);
            return true;
        });

        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);

    function burst(clientX, clientY) {
        const now = performance.now();
        for (let i = 0; i < CONFIG.particleCount; i++) {
            particles.push({
                originX: clientX,
                originY: clientY,
                char: CONFIG.chars[Math.floor(Math.random() * CONFIG.chars.length)],
                angle: Math.random() * Math.PI * 2,
                distance: CONFIG.spreadRadius * (0.4 + Math.random() * 0.6),
                startTime: now,
            });
        }
    }

    // Fire only when clicking the nav, and only while News is the active view.
    const newsSection = document.getElementById('news');
    const nav = document.querySelector('nav');
    nav?.addEventListener('click', (e) => {
        if (!newsSection?.classList.contains('active')) return;
        burst(e.clientX, e.clientY);
    });
})();
