/**
 * auth-nav.js — MoneyMap
 * Runs on every page. Checks if user is logged in (via localStorage)
 * and swaps the nav "Sign In" link to "Dashboard" if they are.
 */
(function () {
    const userId = localStorage.getItem('loggedInUserId');
    if (!userId) return; // Not logged in — keep "Sign In" as-is

    // Find the Sign In nav link and replace it
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(function (link) {
        if (link.textContent.trim() === 'Sign In') {
            link.textContent = 'Dashboard';
            link.href = 'profilepage.html';
            link.classList.add('nav-cta');
        }
    });
})();
