/* eslint-disable no-undef */
/* Auto-hide the header + footer.

   They show as a pair when the visitor enters the site or switches sections,
   linger briefly, then fade away. They return only when the visitor clicks
   something or brings the pointer up to the top edge of the viewport — after
   which they fade out again once things go quiet. */
(function () {
    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer');
    if (!header || !footer) return;

    const navLinksContainer = document.querySelector('.nav-links');

    // How long the chrome lingers after being summoned before fading out.
    const HIDE_DELAY = 2200;
    // How close (px) the pointer must get to the top edge to summon the chrome.
    const TOP_EDGE = 80;

    let hideTimer = null;

    function hide() {
        // Never fade out from under an open nav dropdown — wait it out instead.
        if (navLinksContainer && navLinksContainer.classList.contains('open')) {
            scheduleHide();
            return;
        }
        header.classList.add('chrome--hidden');
        footer.classList.add('chrome--hidden');
    }

    function scheduleHide() {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(hide, HIDE_DELAY);
    }

    function reveal() {
        header.classList.remove('chrome--hidden');
        footer.classList.remove('chrome--hidden');
        scheduleHide();
    }

    // Show once on arrival, then fade out.
    reveal();

    // A click anywhere brings them back. Capture so the header is un-hidden
    // before the click's own handlers (nav, theme toggle) run.
    document.addEventListener('click', reveal, true);

    // Reaching the top edge with the pointer summons them too; staying up there
    // keeps re-arming the timer so they linger while you're up top.
    document.addEventListener('mousemove', (e) => {
        if (e.clientY <= TOP_EDGE) reveal();
    }, { passive: true });

    // Section switches (nav.js) re-show the pair even when not click-driven.
    document.addEventListener('sectionchange', reveal);
})();
