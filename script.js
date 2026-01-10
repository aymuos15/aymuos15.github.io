// Updates rendering
let updates = [];

function renderUpdates(category) {
    const list = document.getElementById('updates-list');
    const filtered = category === 'all' ? updates : updates.filter(u => u.category === category);
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
const collaboratorsText = `<p>In no particular order, Everyone at CAI4CAI: Lorena Macias, Aaron Kujawa, Theo Barfoot, Marina Ivory, Navodini Wijethilake, Meng Wei, Oluwatosin Alabi and Martin Huber. Along with: Pooja Ganesh (SEL), Rakshit Naidu (GaTech), Aarsh Chaube (Edinburgh), Mona Furukawa (Oxford), Yang Li (KCL), Feng He (KCL), and Ruoyang Liu (KCL).</p>`;

const originalDesktopText = `<p>My MSc was with <a href="https://webspace.eecs.qmul.ac.uk/g.slabaugh/" target="_blank">Greg Slabaugh</a> and Vineet Batta at QMUL. Did my UG with <a href="https://www.srmist.edu.in/faculty/dr-s-dhanalakshmi/" target="_blank">Dhanalakshmi Samiappan</a> and Debashis Nandi (NIT-D) at SRM.</p>
                <p>I am always exploring London's food scene or breaking down complex rhyme schemes in rap. In school, I represented my country in futsal and debated nationally.</p>
                <p>I regularly mentor students (see In2Stem!) and researchers. Please reach out! There are many who have supported my <span class="research-link">research</span>.</p>
                <button class="back-btn" id="back-btn-desktop" style="display: none;"></button>`;

const originalMobileText = `<p>My MSc was with <a href="https://webspace.eecs.qmul.ac.uk/g.slabaugh/" target="_blank">Greg Slabaugh</a> and Vineet Batta at QMUL. Did my UG with <a href="https://www.srmist.edu.in/faculty/dr-s-dhanalakshmi/" target="_blank">Dhanalakshmi Samiappan</a> and Debashis Nandi (NIT-D) at SRM.</p>
            <p>I am always exploring London's food scene or breaking down complex rhyme schemes in rap. In school, I represented my country in futsal and debated nationally.</p>
            <p>I regularly mentor students (see In2Stem!) and researchers. Please reach out! There are many who have supported my <span class="research-link">research</span>.</p>
            <button class="back-btn" id="back-btn-mobile" style="display: none;"></button>`;

function attachResearchLinkHandlers() {
    document.querySelectorAll('.research-link').forEach(link => {
        link.addEventListener('click', () => {
            const desktopText = document.getElementById('text-2-desktop');
            const mobileText = document.getElementById('text-2-mobile');

            // Fade out
            if (desktopText) desktopText.classList.add('fade-out');
            if (mobileText) mobileText.classList.add('fade-out');

            // After fade out, change content and fade back in
            setTimeout(() => {
                if (desktopText) {
                    desktopText.innerHTML = collaboratorsText + '<button class="back-btn" id="back-btn-desktop"></button>';
                    attachBackBtnHandler('back-btn-desktop', desktopText, mobileText);
                }
                if (mobileText) {
                    mobileText.innerHTML = collaboratorsText + '<button class="back-btn" id="back-btn-mobile"></button>';
                    attachBackBtnHandler('back-btn-mobile', desktopText, mobileText);
                }

                setTimeout(() => {
                    if (desktopText) desktopText.classList.remove('fade-out');
                    if (mobileText) mobileText.classList.remove('fade-out');
                }, 50);
            }, 500);
        });
    });
}

function attachBackBtnHandler(btnId, desktopText, mobileText) {
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.addEventListener('click', () => {
            // Fade out
            if (desktopText) desktopText.classList.add('fade-out');
            if (mobileText) mobileText.classList.add('fade-out');

            // After fade out, restore original content and fade back in
            setTimeout(() => {
                if (desktopText) desktopText.innerHTML = originalDesktopText;
                if (mobileText) mobileText.innerHTML = originalMobileText;
                attachResearchLinkHandlers();

                setTimeout(() => {
                    if (desktopText) desktopText.classList.remove('fade-out');
                    if (mobileText) mobileText.classList.remove('fade-out');
                }, 50);
            }, 500);
        });
    }
}

attachResearchLinkHandlers();

// Smooth scroll navigation
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').slice(1);
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
    });
});

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

        // Switch content in pane 1
        const pane1 = document.querySelector('[data-pane="1"]');
        pane1.querySelectorAll('.ide-code').forEach(code => code.style.display = 'none');
        const pane1Code = document.getElementById('pane1-' + fileType);
        if (pane1Code) pane1Code.style.display = 'block';
        pane1.dataset.showing = fileType;

        // Update tabs
        const tabs = document.querySelectorAll('.ide-tab');
        tabs[0].dataset.file = fileType;
        tabs[0].textContent = '1:' + file.textContent.replace('> ', '');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
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
        // Sky blue background
        p.background(135, 206, 235);

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
