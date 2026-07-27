/**
 * Theme Script - Default Dark Mode
 */
(function() {
    localStorage.removeItem('theme');
    document.documentElement.classList.remove('light-mode');
    if (document.body) {
        document.body.classList.remove('light-mode');
    }
})();
