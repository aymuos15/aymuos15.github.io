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
