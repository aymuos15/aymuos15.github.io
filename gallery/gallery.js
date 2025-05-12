document.addEventListener('DOMContentLoaded', () => {
    const currentPhoto = document.getElementById('current-photo');
    const photoCaption = document.getElementById('photo-caption');
    const thumbnailContainer = document.querySelector('.thumbnail-container');
    
    // Get all thumbnails
    const thumbnails = Array.from(document.querySelectorAll('.thumbnail'));
    
    // Keep animation running at all times
    thumbnailContainer.style.animationPlayState = 'running';
    
    // For touch devices
    let touchStartTime = 0;
    let isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    function handleThumbnailHover(thumbnail) {
        // Update active class on all thumbnails
        const currentActive = document.querySelector('.thumbnail.active');
        if (currentActive !== thumbnail) {
            thumbnails.forEach(t => t.classList.remove('active'));
            thumbnail.classList.add('active');
            
            // Update main image and caption
            const src = thumbnail.getAttribute('data-src');
            const caption = thumbnail.getAttribute('data-caption');
            
            // Fade effect
            currentPhoto.style.opacity = '0.5';
            setTimeout(() => {
                currentPhoto.src = src;
                photoCaption.textContent = caption;
                currentPhoto.style.opacity = '1';
            }, 150);
        }
    }
    
    // Add event listeners for both hover and touch
    thumbnails.forEach(thumbnail => {
        // For desktop hover
        if (!isTouchDevice) {
            thumbnail.addEventListener('mouseenter', () => handleThumbnailHover(thumbnail));
        }
        
        // For touch devices
        if (isTouchDevice) {
            thumbnail.addEventListener('touchstart', (e) => {
                touchStartTime = Date.now();
                e.preventDefault();
                handleThumbnailHover(thumbnail);
            });
            
            thumbnail.addEventListener('touchend', (e) => {
                // Only prevent default if it was a short touch (not a scroll)
                if (Date.now() - touchStartTime < 200) {
                    e.preventDefault();
                }
            }, { passive: false });
        }
    });
    
    // Make sure the active thumbnail is visible on load
    const activeThumbnail = document.querySelector('.thumbnail.active');
    if (activeThumbnail) {
        handleThumbnailHover(activeThumbnail);
    }
    
    // For touch devices, handle touch events on the container
    if (isTouchDevice) {
        let touchYStart = 0;
        let isScrolling = false;
        
        thumbnailContainer.addEventListener('touchstart', (e) => {
            touchYStart = e.touches[0].clientY;
            isScrolling = false;
        }, { passive: true });
        
        thumbnailContainer.addEventListener('touchmove', (e) => {
            // Check if user is scrolling
            const touchY = e.touches[0].clientY;
            if (Math.abs(touchY - touchYStart) > 5) {
                isScrolling = true;
            }
        }, { passive: true });
    }
});
