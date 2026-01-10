// Theme toggle with localStorage persistence
(function initTheme() {
    const saved = localStorage.getItem('theme-preference') || 'light';
    applyTheme(saved);
})();

function applyTheme(preference) {
    if (preference === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', systemDark ? 'dark' : 'light');
    } else {
        document.documentElement.setAttribute('data-theme', preference);
    }
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (localStorage.getItem('theme-preference') === 'system') {
        applyTheme('system');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.theme-toggle button');
    const saved = localStorage.getItem('theme-preference') || 'light';

    // Set initial active state
    buttons.forEach(btn => {
        if (btn.dataset.themeOption === saved) {
            btn.classList.add('active');
        }
    });

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const preference = btn.dataset.themeOption;
            localStorage.setItem('theme-preference', preference);
            applyTheme(preference);

            // Update active state
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
});

// Updates rendering
let updates = [];

function renderUpdates(category) {
    const list = document.getElementById('updates-list');
    const filtered = category === 'all'
        ? updates.filter(u => u.category !== 'pr')
        : updates.filter(u => u.category === category);
    list.innerHTML = filtered.map(u =>
        `<div class="update-item"><span class="update-date">${u.date}</span><span class="update-desc">${u.description}</span></div>`
    ).join('');
}

// Load updates from JSON
fetch('updates.json')
    .then(response => response.json())
    .then(data => {
        updates = data;
        renderUpdates('all');
    });

// Tab click handlers
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderUpdates(tab.dataset.category);
    });
});

// Name click handler - shows pronunciation
document.querySelector('.name-link').addEventListener('click', () => {
    const pronunciation = document.getElementById('pronunciation');
    pronunciation.classList.toggle('visible');
});

// Research link click handler - shows collaborators with fade animation
const collaboratorsText = '<p>In no particular order, Everyone at CAI4CAI: Lorena Macias, Aaron Kujawa, Theo Barfoot, Marina Ivory, Navodini Wijethilake, Meng Wei, Oluwatosin Alabi and Martin Huber. Along with: Pooja Ganesh (SEL), Rakshit Naidu (GaTech), Aarsh Chaube (Edinburgh), Mona Furukawa (Oxford), Yang Li (KCL), Feng He (KCL), and Ruoyang Liu (KCL).</p>';

const originalDesktopText = `<p>My MSc was with <a href="https://webspace.eecs.qmul.ac.uk/g.slabaugh/" target="_blank">Greg Slabaugh</a> and Vineet Batta at QMUL. Did my UG with <a href="https://www.srmist.edu.in/faculty/dr-s-dhanalakshmi/" target="_blank">Dhanalakshmi Samiappan</a> and Debashis Nandi (NIT-D) at SRM.</p>
                <p>I am always exploring London's food scene or breaking down complex rhyme schemes in rap. In school, I represented my country in futsal and debated nationally.</p>
                <p>I regularly mentor students (see In2Stem!) and researchers. Please reach out! There are many who have supported my <span class="research-link">research</span>.</p>
                <button class="back-btn" id="back-btn-desktop" style="display: none;"></button>`;

const originalMobileText = `<p>My MSc was with <a href="https://webspace.eecs.qmul.ac.uk/g.slabaugh/" target="_blank">Greg Slabaugh</a> and Vineet Batta at QMUL. Did my UG with <a href="https://www.srmist.edu.in/faculty/dr-s-dhanalakshmi/" target="_blank">Dhanalakshmi Samiappan</a> and Debashis Nandi (NIT-D) at SRM.</p>
            <p>I am always exploring London's food scene or breaking down complex rhyme schemes in rap. In school, I represented my country in futsal and debated nationally.</p>
            <p>I regularly mentor students (see In2Stem!) and researchers. Please reach out! There are many who have supported my <span class="research-link">research</span>.</p>
            <button class="back-btn" id="back-btn-mobile" style="display: none;"></button>`;

function animateContentChange(desktopText, mobileText, newDesktopContent, newMobileContent, callback) {
    // Store current heights and lock them with explicit height
    const startDesktopHeight = desktopText ? desktopText.offsetHeight : 0;
    const startMobileHeight = mobileText ? mobileText.offsetHeight : 0;

    if (desktopText) desktopText.style.height = startDesktopHeight + 'px';
    if (mobileText) mobileText.style.height = startMobileHeight + 'px';

    // Use double rAF to ensure styles are committed
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // Fade out text
            if (desktopText) desktopText.classList.add('fade-out');
            if (mobileText) mobileText.classList.add('fade-out');

            // After fade out, change content and resize to new height
            setTimeout(() => {
                // Change content
                if (desktopText) desktopText.innerHTML = newDesktopContent;
                if (mobileText) mobileText.innerHTML = newMobileContent;

                // Measure new heights (temporarily set height to auto)
                let newDesktopHeight = 0;
                let newMobileHeight = 0;

                if (desktopText) {
                    desktopText.style.height = 'auto';
                    newDesktopHeight = desktopText.offsetHeight;
                    desktopText.style.height = startDesktopHeight + 'px';
                }
                if (mobileText) {
                    mobileText.style.height = 'auto';
                    newMobileHeight = mobileText.offsetHeight;
                    mobileText.style.height = startMobileHeight + 'px';
                }

                // Animate to new heights
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (desktopText) desktopText.style.height = newDesktopHeight + 'px';
                        if (mobileText) mobileText.style.height = newMobileHeight + 'px';

                        // After resize, fade in
                        setTimeout(() => {
                            if (desktopText) desktopText.classList.remove('fade-out');
                            if (mobileText) mobileText.classList.remove('fade-out');

                            // Clean up height after animation
                            setTimeout(() => {
                                if (desktopText) desktopText.style.height = '';
                                if (mobileText) mobileText.style.height = '';
                                if (callback) callback();
                            }, 400);
                        }, 800);
                    });
                });
            }, 400);
        });
    });
}

function attachResearchLinkHandlers() {
    document.querySelectorAll('.research-link').forEach(link => {
        link.addEventListener('click', () => {
            const desktopText = document.getElementById('text-2-desktop');
            const mobileText = document.getElementById('text-2-mobile');

            const newDesktopContent = collaboratorsText + '<button class="back-btn" id="back-btn-desktop"></button>';
            const newMobileContent = collaboratorsText + '<button class="back-btn" id="back-btn-mobile"></button>';

            animateContentChange(desktopText, mobileText, newDesktopContent, newMobileContent, () => {
                attachBackBtnHandler('back-btn-desktop', desktopText, mobileText);
                attachBackBtnHandler('back-btn-mobile', desktopText, mobileText);
            });
        });
    });
}

function attachBackBtnHandler(btnId, desktopText, mobileText) {
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.addEventListener('click', () => {
            animateContentChange(desktopText, mobileText, originalDesktopText, originalMobileText, () => {
                attachResearchLinkHandlers();
            });
        });
    }
}

attachResearchLinkHandlers();

// Image grid click to cycle through extra images
const extraImages = [
    'gallery/isbi.jpeg',
    'gallery/pupil.jpeg'
];

// Custom object-position for specific images
const imagePositions = {
    'pupil.jpeg': 'center top',
    'isbi.jpeg': 'center bottom'
};

function applyImagePosition(img) {
    const filename = img.src.split('/').pop();
    img.style.objectPosition = imagePositions[filename] || 'center center';
}

document.querySelectorAll('.image-grid-cell').forEach(cell => {
    const wrapper = cell.querySelector('.slide-wrapper');
    let currentImg = wrapper.querySelector('img');
    let isAnimating = false;
    applyImagePosition(currentImg);

    cell.addEventListener('click', () => {
        if (extraImages.length > 0 && !isAnimating) {
            isAnimating = true;
            const oldSrc = currentImg.src;
            const newSrc = extraImages.shift();

            // Create next image and add to wrapper
            const nextImg = document.createElement('img');
            nextImg.src = newSrc;
            applyImagePosition(nextImg);
            wrapper.appendChild(nextImg);

            // Slide the wrapper
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    wrapper.classList.add('sliding');
                });
            });

            // After slide, clean up and reset
            setTimeout(() => {
                currentImg.remove();
                wrapper.classList.remove('sliding');
                wrapper.style.transition = 'none';
                wrapper.style.transform = '';
                requestAnimationFrame(() => {
                    wrapper.style.transition = '';
                });
                currentImg = nextImg;
                isAnimating = false;
            }, 1500);

            // Add old image to queue
            const oldPath = 'gallery/' + oldSrc.split('/gallery/')[1];
            extraImages.push(oldPath);
        }
    });
});

// Mobile nav toggle - Home link expands/collapses dropdown
const navHome = document.querySelector('.nav-home');
const navLinks = document.querySelector('.nav-links');
const navDropdown = document.querySelector('.nav-dropdown');
const isMobile = () => window.innerWidth <= 768;

if (navHome && navLinks && navDropdown) {
    // Close menu when clicking dropdown links
    navDropdown.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (isMobile()) {
                navLinks.classList.remove('open');
            }
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (isMobile() && !navLinks.contains(e.target)) {
            navLinks.classList.remove('open');
        }
    });
}

// Smooth scroll navigation
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        const isHome = link.classList.contains('nav-home');

        // Handle Home link on mobile
        if (isHome && isMobile()) {
            e.preventDefault();
            if (navLinks.classList.contains('open')) {
                // Close dropdown and scroll to home
                navLinks.classList.remove('open');
                smoothScrollTo('home');
            } else {
                // Just open dropdown
                navLinks.classList.add('open');
            }
            return;
        }

        e.preventDefault();
        const targetId = link.getAttribute('href').slice(1);
        smoothScrollTo(targetId);
    });
});

function smoothScrollTo(targetId) {
    const target = document.getElementById(targetId);
    if (target) {
        const targetPosition = target.offsetTop - 80;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 1500;
        let start = null;

        function animation(currentTime) {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const progress = Math.min(timeElapsed / duration, 1);
            const ease = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            window.scrollTo(0, startPosition + distance * ease);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }
        requestAnimationFrame(animation);
    }
}

// Mock IDE file switching
document.querySelectorAll('.ide-file[data-file]').forEach(file => {
    file.addEventListener('click', () => {
        const fileType = file.dataset.file;

        // Update sidebar active state
        document.querySelectorAll('.ide-file').forEach(f => f.classList.remove('active'));
        file.classList.add('active');

        // Update the ">" indicator
        document.querySelectorAll('.ide-file[data-file]').forEach(f => {
            f.textContent = f.textContent.replace('> ', '');
        });
        file.textContent = '> ' + file.textContent;

        // Find the currently active tab
        const activeTab = document.querySelector('.ide-tab.active');
        const paneNum = activeTab ? activeTab.textContent.charAt(0) : '1';

        // Switch content in the active pane
        const pane = document.querySelector(`[data-pane="${paneNum}"]`);
        pane.querySelectorAll('.ide-code').forEach(code => code.style.display = 'none');
        const paneCode = document.getElementById(`pane${paneNum}-` + fileType);
        if (paneCode) paneCode.style.display = 'block';
        pane.dataset.showing = fileType;

        // Update the active tab
        if (activeTab) {
            activeTab.dataset.file = fileType;
            activeTab.textContent = paneNum + ':' + file.textContent.replace('> ', '');
        }
    });
});

// Tab click switching
document.querySelectorAll('.ide-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const fileType = tab.dataset.file;
        const paneNum = tab.textContent.charAt(0);

        // Update tab active state
        document.querySelectorAll('.ide-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Switch to corresponding pane content
        const pane = document.querySelector(`[data-pane="${paneNum}"]`);
        if (pane) {
            pane.querySelectorAll('.ide-code').forEach(code => code.style.display = 'none');
            const paneCode = document.getElementById(`pane${paneNum}-${fileType}`);
            if (paneCode) paneCode.style.display = 'block';
        }
    });
});

// p5.js Perlin Noise Cloud Animation (binary 0/1 style)
const cloudSketch = (p) => {
    const cloudPixelScale = 6;
    const cloudCutOff = 0.6;
    const panSpeed = 10;
    const cloudEvolutionSpeed = 3;

    p.setup = () => {
        const container = document.getElementById('p5-container');
        const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
        canvas.parent('p5-container');
    };

    p.draw = () => {
        // Theme-aware background
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            p.background(30, 58, 95); // #1e3a5f
        } else {
            p.background(135, 206, 235); // #87CEEB
        }

        for (let x = 0; x <= p.width; x += cloudPixelScale) {
            for (let y = 0; y <= p.height; y += cloudPixelScale) {
                let tinyTimeOffset = p.millis() / 100000;
                let noiseScale = 0.01;

                let n = p.noise(
                    x * noiseScale + tinyTimeOffset * panSpeed,
                    y * noiseScale + tinyTimeOffset * 0.25 * panSpeed,
                    tinyTimeOffset * cloudEvolutionSpeed
                );

                if (n < cloudCutOff) continue;

                let alpha = p.map(n, cloudCutOff, 0.65, 10, 255);
                p.fill(255, alpha);
                p.textSize(cloudPixelScale * 1.15);
                p.text(getLetterForCoordinate(x, y), x, y);
            }
        }
    };

    p.windowResized = () => {
        const container = document.getElementById('p5-container');
        if (container) {
            p.resizeCanvas(container.offsetWidth, container.offsetHeight);
        }
    };

    function getLetterForCoordinate(x, y) {
        let hash = (x + y) * Math.sin(x * y);
        let bit = Math.abs(Math.floor(hash * 1000)) % 2;
        return bit.toString();
    }
};

// Initialize the p5 sketch
if (document.getElementById('p5-container')) {
    new p5(cloudSketch);
}
