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
    if (!navLinksContainer.contains(e.target) && !navToggle.contains(e.target)) {
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
