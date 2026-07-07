/* eslint-disable no-undef */
// Cached DOM references
const navLinksContainer = document.querySelector('.nav-links');
const navLinks = document.querySelectorAll('.nav-links a');
const navToggle = document.querySelector('.nav-toggle');
const updatesList = document.getElementById('updates-list');
const tabs = document.querySelectorAll('.tab');
const contribGraph  = document.getElementById('contrib-graph');
const contribCanvas = document.getElementById('contrib-canvas');
const contribTip    = document.getElementById('contrib-tip');

// Mobile nav dropdown
navToggle.addEventListener('click', () => {
    navLinksContainer.classList.toggle('open');
});

document.addEventListener('click', (e) => {
    // Keep the dropdown open when toggling the theme, so the tile-field menu
    // doesn't get dismissed mid-look on a light/dark switch.
    if (
        !navLinksContainer.contains(e.target) &&
        !navToggle.contains(e.target) &&
        !e.target.closest('.theme-toggle')
    ) {
        navLinksContainer.classList.remove('open');
    }
});

const spotifyEmbed = document.getElementById('spotify-embed');
function showSpotify() { spotifyEmbed.classList.add('visible'); }
function hideSpotify() { spotifyEmbed.classList.remove('visible'); }

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

    // Expose the active section on <html> so CSS/JS (e.g. the Research
    // theme-scatter ornament) can react to which section is showing.
    document.documentElement.setAttribute('data-section', targetId);

    highlightSocials(targetId);
    updateFooterRainbow(targetId);

    setTimeout(() => {
        current.classList.remove('leaving');
        next.classList.add('active');
        isTransitioning = false;
        colorizeLinks();
    }, 300);
}

// Reflect the initial active section on <html> at load.
const initialSection = document.querySelector('.section.active');
if (initialSection) {
    document.documentElement.setAttribute('data-section', initialSection.id);
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navLinksContainer.classList.remove('open');
        const targetId = link.getAttribute('href').slice(1);
        switchSection(targetId);
    });
});
