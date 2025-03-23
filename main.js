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

// For the updates page
document.addEventListener('DOMContentLoaded', function() {
    // Fetch updates from JSON file
    fetch('updates.json')
        .then(response => response.json())
        .then(data => {
            const updatesContainer = document.getElementById('updates-container');
            const filterButtons = document.querySelectorAll('.filter-button');
            
            // Display all updates initially
            displayUpdates(data.updates, updatesContainer);
            
            // Add event listeners to filter buttons
            filterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const category = this.getAttribute('data-category');
                    
                    // Toggle active class
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Filter updates based on category
                    if (category === 'all') {
                        displayUpdates(data.updates, updatesContainer);
                    } else {
                        const filteredUpdates = data.updates.filter(update => update.category === category);
                        displayUpdates(filteredUpdates, updatesContainer);
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error fetching updates:', error);
        });
});

function displayUpdates(updates, container) {
    container.innerHTML = '';
    
    if (updates.length === 0) {
        container.innerHTML = '<p>No updates found in this category.</p>';
        return;
    }
    
    updates.forEach(update => {
        const updateElement = document.createElement('div');
        updateElement.className = 'update-item';
        
        // Create the update HTML with proper formatting to prevent text overflow
        updateElement.innerHTML = `
            <div style="display: flex; margin-bottom: 10px;">
                <div style="min-width: 100px; font-weight: bold; margin-right: -20px;">
                    ${update.date}
                </div>
                <div style="flex: 1;">
                    ${update.description}
                </div>
            </div>
        `;
        
        container.appendChild(updateElement);
    });
}