/* eslint-disable no-undef */
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
