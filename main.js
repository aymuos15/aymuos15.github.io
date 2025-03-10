// Bouncing Brain Animation
function initBouncingBall() {
    // Start from the middle of the screen
    let posX = window.innerWidth / 2;
    let posY = window.innerHeight / 2;
    // Random velocity
    let velX = 1; // Adjust the multiplier for speed
    let velY = 1;
    const ball = document.getElementById('ball');
    
    function update() {
        posX += velX;
        posY += velY;
        if (posX < 0 || posX > window.innerWidth - ball.clientWidth) {
            velX = -velX;
        }
        if (posY < 0 || posY > window.innerHeight - ball.clientHeight) {
            velY = -velY;
        }
        ball.style.left = posX + 'px';
        ball.style.top = posY + 'px';
        requestAnimationFrame(update);
    }
    update();
}

// Updates page functionality
function loadUpdates() {
    if (document.getElementById('updates-container')) {
        fetch('updates.json')
            .then(response => response.json())
            .then(data => {
                const updatesContainer = document.getElementById('updates-container');
                let updatesHtml = '<ul>';
                data.updates.forEach(update => {
                    updatesHtml += `<li>
                        <span class="date-part">[${update.date}]</span>
                        <span class="text-part">${update.description}</span>
                    </li>`;
                });
                updatesHtml += '</ul>';
                updatesContainer.innerHTML = updatesHtml;
            })
            .catch(error => console.error('Error loading updates:', error));
    }
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    initBouncingBall();
    loadUpdates();
});
