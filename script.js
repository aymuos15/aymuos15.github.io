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

document.querySelectorAll('.research-link').forEach(link => {
    link.addEventListener('click', () => {
        const desktopText = document.getElementById('text-2-desktop');
        const mobileText = document.getElementById('text-2-mobile');

        // Fade out
        if (desktopText) desktopText.classList.add('fade-out');
        if (mobileText) mobileText.classList.add('fade-out');

        // After fade out, change content and fade back in
        setTimeout(() => {
            if (desktopText) desktopText.innerHTML = collaboratorsText;
            if (mobileText) mobileText.innerHTML = collaboratorsText;

            setTimeout(() => {
                if (desktopText) desktopText.classList.remove('fade-out');
                if (mobileText) mobileText.classList.remove('fade-out');
            }, 50);
        }, 500);
    });
});

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
