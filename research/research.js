// Toggle card expansion
function toggleCard(card) {
    // Close all other expanded cards
    document.querySelectorAll('.research-card.expanded').forEach(expandedCard => {
        if (expandedCard !== card) {
            expandedCard.classList.remove('expanded');
            expandedCard.querySelector('.card-content').style.opacity = '0';
            expandedCard.querySelector('.card-content').style.transform = 'translateY(10px)';
        }
    });
    
    // Toggle the clicked card
    card.classList.toggle('expanded');
    
    // Force reflow to ensure the transition works
    const content = card.querySelector('.card-content');
    if (card.classList.contains('expanded')) {
        // Small delay to allow the height transition to start
        setTimeout(() => {
            content.style.opacity = '1';
            content.style.transform = 'translateY(0)';
        }, 50);
    } else {
        content.style.opacity = '0';
        content.style.transform = 'translateY(10px)';
    }
}
