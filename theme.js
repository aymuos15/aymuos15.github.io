document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme based on user preference if available
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').checked = true;
    }

    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        }
    });

    // Cloud/Star generation
    const cloudBackground = document.getElementById('cloud-background');
    if (!cloudBackground) {
        console.error("Could not find element with ID 'cloud-background'");
        return;
    }

    const numberOfClouds = 20;
    const bodyWidth = document.body.clientWidth;
    const bodyHeight = document.body.clientHeight;

    for (let i = 0; i < numberOfClouds; i++) {
        const cloud = document.createElement('div');
        cloud.classList.add('cloud');

        // --- Randomize Cloud Properties ---
        const scale = Math.random() * 0.7 + 0.6;
        const zDepth = (Math.random() * 1000 - 500);
        const topPos = Math.random() * (bodyHeight * 1.1) - (bodyHeight * 0.1);
        const duration = Math.random() * 40 + 30;

        // Different properties for stars (night mode)
        if (document.body.classList.contains('dark-mode')) {
            // Stars are smaller, more varied
            const starSize = Math.random() * 8 + 4;
            cloud.style.setProperty('--cloud-base-width', `${starSize}px`);
            cloud.style.setProperty('--cloud-base-height', `${starSize}px`);
            cloud.style.setProperty('--cloud-blur', `${Math.random() * 2 + 1}px`);
            cloud.style.opacity = Math.max(0.7, Math.random() * 0.3 + 0.7);
        } else {
            // Normal cloud properties
            const baseW = Math.random() * 150 + 150;
            const baseH = Math.random() * 40 + 40;
            const blurAmount = Math.random() * 10 + 10;
            cloud.style.setProperty('--cloud-base-width', `${baseW}px`);
            cloud.style.setProperty('--cloud-base-height', `${baseH}px`);
            cloud.style.setProperty('--cloud-blur', `${blurAmount}px`);
        }

        // Common properties
        const baseOpacity = Math.max(0.3, 0.75 - (zDepth / 1500) + (Math.random() * 0.1 - 0.05));
        cloud.style.setProperty('--scale', scale);
        cloud.style.setProperty('--z-depth', `${zDepth}px`);
        cloud.style.setProperty('--cloud-opacity', baseOpacity);
        cloud.style.top = `${topPos}px`;
        cloud.style.animationDuration = `${duration}s`;
        cloud.style.animationDelay = `-${Math.random() * duration}s`;

        cloudBackground.appendChild(cloud);
    }

    // Regenerate clouds when switching themes
    themeToggle.addEventListener('change', () => {
        // Clear existing clouds
        while (cloudBackground.firstChild) {
            cloudBackground.removeChild(cloudBackground.firstChild);
        }

        // Generate new elements based on current theme
        for (let i = 0; i < numberOfClouds; i++) {
            const element = document.createElement('div');
            element.classList.add('cloud');

            const scale = Math.random() * 0.7 + 0.6;
            const zDepth = (Math.random() * 1000 - 500);
            const topPos = Math.random() * (bodyHeight * 1.1) - (bodyHeight * 0.1);
            const duration = Math.random() * 40 + 30;
            const baseOpacity = Math.max(0.3, 0.75 - (zDepth / 1500) + (Math.random() * 0.1 - 0.05));

            // Different properties based on current theme
            if (document.body.classList.contains('dark-mode')) {
                // Stars are smaller, more varied in night mode
                const starSize = Math.random() * 8 + 4;
                element.style.setProperty('--cloud-base-width', `${starSize}px`);
                element.style.setProperty('--cloud-base-height', `${starSize}px`);
                element.style.setProperty('--cloud-blur', `${Math.random() * 2 + 1}px`);
                element.style.opacity = Math.max(0.7, Math.random() * 0.3 + 0.7);
            } else {
                // Normal cloud properties for light mode
                const baseW = Math.random() * 150 + 150;
                const baseH = Math.random() * 40 + 40;
                const blurAmount = Math.random() * 10 + 10;
                element.style.setProperty('--cloud-base-width', `${baseW}px`);
                element.style.setProperty('--cloud-base-height', `${baseH}px`);
                element.style.setProperty('--cloud-blur', `${blurAmount}px`);
            }

            // Common properties
            element.style.setProperty('--scale', scale);
            element.style.setProperty('--z-depth', `${zDepth}px`);
            element.style.setProperty('--cloud-opacity', baseOpacity);
            element.style.top = `${topPos}px`;
            element.style.animationDuration = `${duration}s`;
            element.style.animationDelay = `-${Math.random() * duration}s`;

            cloudBackground.appendChild(element);
        }
    });

        // Add event listener for name-clickable in index.html
    document.getElementById('name-clickable')?.addEventListener('click', function() {
        const pronunciation = document.querySelector('.pronunciation');
        if (pronunciation) {
            pronunciation.style.display = pronunciation.style.display === 'none' ? 'inline' : 'none';
        }
    });

    // Initialize collaborators functionality
    const collaboratorsLink = document.getElementById('collaborators-link');
    const collaboratorsList = document.getElementById('collaborators-list');
    
    if (collaboratorsLink && collaboratorsList) {
        collaboratorsLink.addEventListener('click', function() {
            if (collaboratorsList.style.display === 'none' || !collaboratorsList.style.display) {
                collaboratorsList.style.display = 'block';
                updateCollaboratorsBorderColor();
            } else {
                collaboratorsList.style.display = 'none';
            }
        });
    }

    // Function to update border color based on theme
    function updateCollaboratorsBorderColor() {
        if (collaboratorsList && collaboratorsList.style.display !== 'none') {
            if (document.body.classList.contains('dark-mode')) {
                collaboratorsList.style.borderLeftColor = 'rgba(255, 255, 255, 0.2)';
            } else {
                collaboratorsList.style.borderLeftColor = 'rgba(0, 0, 0, 0.1)';
            }
        }
    }

    // Add border color update to existing theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('change', updateCollaboratorsBorderColor);
    }

    // Initialize updates
    initializeUpdates();
});

// Function to handle updates display and filtering
function initializeUpdates() {
    let allUpdates = [];
    let currentFilter = 'all';
    const initialDisplay = 3;
    let isExpanded = false;

    const style = document.createElement('style');
    style.textContent = `
        #updates-container.expanded {
            max-height: 400px;
            overflow-y: auto;
            padding-right: 15px;
            margin-right: -5px;
            transition: max-height 0.3s ease;
        }
        #updates-container.expanded::-webkit-scrollbar {
            width: 5px;
            display: block;
        }
        #updates-container.expanded::-webkit-scrollbar-track {
            background: transparent;
            display: block;
        }
        body.light-mode #updates-container.expanded::-webkit-scrollbar-thumb {
            background-color: rgba(0, 122, 204, 0.3);
            border-radius: 10px;
            display: block;
        }
        body.dark-mode #updates-container.expanded::-webkit-scrollbar-thumb {
            background-color: rgba(128, 212, 255, 0.3);
            border-radius: 10px;
            display: block;
        }
        #updates-container.expanded {
            scrollbar-width: thin;
            scrollbar-color: rgba(128, 128, 128, 0.3) transparent;
        }
    `;
    document.head.appendChild(style);

    fetch('/updates/updates.json')
        .then(response => response.json())
        .then(data => {
            allUpdates = data.updates;
            setupFilters();
            displayFilteredUpdates(currentFilter);
        })
        .catch(error => {
            console.error('Error loading updates:', error);
            document.getElementById('updates-container').innerHTML = '<p>Error loading updates. Please try again later.</p>';
        });

    function displayFilteredUpdates(category) {
        const container = document.getElementById('updates-container');
        container.innerHTML = '';
        container.classList.remove('expanded');
        isExpanded = false;

        const filteredUpdates = category === 'all' 
            ? allUpdates 
            : allUpdates.filter(update => update.category === category);

        const initialUpdates = filteredUpdates.slice(0, initialDisplay);

        initialUpdates.forEach(update => {
            appendUpdateItem(update, container);
        });

        if (filteredUpdates.length > initialDisplay) {
            const showMoreContainer = document.createElement('div');
            showMoreContainer.className = 'show-more-container';
            showMoreContainer.style.textAlign = 'center';
            showMoreContainer.style.marginTop = '-15px';

            const showMoreButton = document.createElement('button');
            showMoreButton.className = 'filter-button no-border';
            showMoreButton.id = 'show-more-button';
            showMoreButton.textContent = `...`;

            showMoreButton.addEventListener('click', () => {
                container.classList.add('expanded');
                showMoreContainer.remove();
                const remainingUpdates = filteredUpdates.slice(initialDisplay);
                remainingUpdates.forEach(update => {
                    appendUpdateItem(update, container);
                });
                isExpanded = true;
            });

            showMoreContainer.appendChild(showMoreButton);
            container.appendChild(showMoreContainer);
        }
    }

    function appendUpdateItem(update, container) {
        const updateItem = document.createElement('div');
        updateItem.className = `update-item ${update.category}`;
        updateItem.style.opacity = '0';

        updateItem.innerHTML = `
            <span class="update-date">${update.date}</span>
            <span class="update-description">${update.description}</span>
        `;

        container.appendChild(updateItem);

        setTimeout(() => {
            updateItem.style.opacity = '1';
        }, 10);
    }

    function setupFilters() {
        const filterButtons = document.querySelectorAll('.filter-button');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (button.classList.contains('active')) return;

                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                currentFilter = button.getAttribute('data-category');
                displayFilteredUpdates(currentFilter);
            });
        });
    }
}// Links JSON data structure
const linksData = {
    "people": [
        {"text": "Tom Vercauteren", "url": "https://cai4cai.ml/author/tom-vercauteren/", "id": "Tom Vercauteren"},
        {"text": "Jonathan Shapey", "url": "https://cai4cai.ml/author/jonathan-shapey/", "id": "Jonathan Shapey"},
        {"text": "Bartek Papiez", "url": "https://www.bdi.ox.ac.uk/Team/bartek-papiez", "id": "Bartek Papiez"},
        {"text": "Patrick de Perio", "url": "https://pdeperio.github.io/", "id": "Patrick de Perio"},
        {"text": "Akira Konaka", "url": "https://www.uvic.ca/science/physics/vispa/people/adjunct/konaka.php", "id": "Akira Konaka"},
        {"text": "Tarun Gangwar", "url": "https://sites.google.com/umn.edu/tarungangwar/home", "id": "Tarun Gangwar"},
        {"text": "Greg Slabaugh", "url": "https://eecs.qmul.ac.uk/~gslabaugh/", "id": "Greg Slabaugh"},
        {"text": "Vineet Batta", "url": "https://www.unicornmedics.com/", "id": "Vineet Batta"},
        {"text": "Dhanalakshmi Samiappan", "url": "https://www.srmist.edu.in/faculty/dr-s-dhanalakshmi/", "id": "Dhanalakshmi Samiappan"},
        {"text": "Debashis Nandi", "url": "https://nitdgp.ac.in/department/computer-science-engineering/faculty-1/debashis-nandi", "id": "Debashis Nandi"}
    ],
    "other": [
        {"text": "papers", "url": "#papers", "id": "papers"},
        {"text": "code", "url": "#work", "id": "code"},
        {"text": "me", "url": "about.html", "id": "me"},
        {"text": "Bio", "url": "index.html", "id": "bio"},
        {"text": "LinkedIn", "url": "https://www.linkedin.com/in/soumyaskundu/", "id": "linkedin"},
        {"text": "In2Stem!", "url": "https://in2stem.org", "id": "in2stem"},
        {"text": "reach out!", "url": "mailto:your-email@example.com", "id": "contact"},
        {"text": "here", "url": "path/to/your/research.html", "id": "journey"}
    ]
};

// Function to apply appropriate classes to existing links on the page
function categorizeLinks() {
    // Get all links on the page
    const links = document.querySelectorAll('a');
    
    links.forEach(link => {
        // Check if the link is for a person
        const isPerson = linksData.people.some(person => 
            person.url === link.href || link.href.endsWith(person.url));
        
        // Check if the link is an "other" type
        const isOther = linksData.other.some(other => 
            other.url === link.href || link.href.endsWith(other.url));
        
        // Apply appropriate class
        if (isPerson) {
            link.classList.add('person-link');
        } else if (isOther) {
            link.classList.add('other-link');
        }
        
        // Ensure all links have text decoration - underline
        link.style.textDecoration = 'underline';
        link.style.textDecorationThickness = '1px';
        
        // Set appropriate underline color based on theme
        if (document.body.classList.contains('dark-mode')) {
            link.style.textDecorationColor = 'rgba(255, 255, 255, 0.2)';
        } else {
            link.style.textDecorationColor = 'rgba(0, 0, 0, 0.2)';
        }
    });
}

// Function to generate a link HTML with appropriate class
function createLinkHtml(linkData, target = '_blank') {
    const className = linkData.category === 'people' ? 'person-link' : 'other-link';
    return `<a href="${linkData.url}" class="${className}" ${target ? `target="${target}"` : ''} style="text-decoration:underline;text-decoration-thickness:1px;">${linkData.text}</a>`;
}

// Function to replace placeholder with actual link
function insertLinks() {
    // Find all link placeholders
    const placeholders = document.querySelectorAll('[data-link-id]');
    
    placeholders.forEach(placeholder => {
        const linkId = placeholder.getAttribute('data-link-id');
        
        // Find in people category
        let linkData = linksData.people.find(link => link.id === linkId);
        if (linkData) {
            linkData.category = 'people';
        }
        
        // If not found in people, look in other category
        if (!linkData) {
            linkData = linksData.other.find(link => link.id === linkId);
            if (linkData) {
                linkData.category = 'other';
            }
        }
        
        // Replace placeholder with actual link if found
        if (linkData) {
            const targetAttr = placeholder.getAttribute('data-link-target') || '_blank';
            placeholder.outerHTML = createLinkHtml(linkData, targetAttr);
        }
    });
}

// Function to insert link by ID directly into an element
function insertLinkById(elementId, linkId, beforeText = '', afterText = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Find link in both categories
    let linkData = linksData.people.find(link => link.id === linkId);
    let category = 'people';
    
    if (!linkData) {
        linkData = linksData.other.find(link => link.id === linkId);
        category = 'other';
    }
    
    if (linkData) {
        linkData.category = category;
        const targetAttr = element.getAttribute('data-link-target') || '_blank';
        const linkHtml = createLinkHtml(linkData, targetAttr);
        element.innerHTML += beforeText + linkHtml + afterText;
    }
}

// Ensure all links are highlighted consistently
function highlightLinks() {
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        link.style.textDecoration = 'underline';
        link.style.textDecorationThickness = '1px';
        
        // Set appropriate underline color based on theme
        if (document.body.classList.contains('dark-mode')) {
            link.style.textDecorationColor = 'rgba(255, 255, 255, 0.2)';
        } else {
            link.style.textDecorationColor = 'rgba(0, 0, 0, 0.2)';
        }
    });
}

// Run on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    categorizeLinks();
    insertLinks();
    highlightLinks();
    
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('change', highlightLinks);
});

// Re-apply highlighting after theme changes
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            setTimeout(highlightLinks, 100); // Apply after theme change is complete
        });
    }
});

// Add event listener for categorizeLinks in about.html
document.addEventListener('DOMContentLoaded', () => {
    if (typeof categorizeLinks === 'function') {
        categorizeLinks();
    }
});
