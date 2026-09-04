/**
 * Vibe Computer Engineering - Theme Manager Script
 * Supports persistent Dark / Light Mode switching via localStorage
 */

(function () {
  function getStoredTheme() {
    return (
      localStorage.getItem("theme") ||
      localStorage.getItem("vibe_theme") ||
      "dark"
    );
  }

  function persistTheme(theme) {
    localStorage.setItem("theme", theme);
    localStorage.setItem("vibe_theme", theme);
  }

  function applyTheme(theme) {
    if (theme === "light") {
      document.documentElement.classList.add("light-mode");
      if (document.body) document.body.classList.add("light-mode");
    } else {
      document.documentElement.classList.remove("light-mode");
      if (document.body) document.body.classList.remove("light-mode");
    }
  }

  const savedTheme = getStoredTheme();

  // Apply immediately to avoid FOUC
  applyTheme(savedTheme);

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(getStoredTheme());

    // Update toggle icons on page load
    updateThemeToggleIcons(getStoredTheme());
  });

  // Global theme toggle function
  window.toggleTheme = function () {
    const currentTheme = document.documentElement.classList.contains(
      "light-mode",
    )
      ? "light"
      : "dark";
    const newTheme = currentTheme === "light" ? "dark" : "light";

    persistTheme(newTheme);
    applyTheme(newTheme);
    updateThemeToggleIcons(newTheme);
  };

  function updateThemeToggleIcons(theme) {
    const toggleBtns = document.querySelectorAll(".theme-toggle-btn");
    toggleBtns.forEach((btn) => {
      const icon = btn.querySelector("i");
      if (icon) {
        if (theme === "light") {
          icon.className = "fa-solid fa-moon text-indigo-600";
          btn.setAttribute("title", "Switch to Dark Mode");
        } else {
          icon.className = "fa-solid fa-sun text-yellow-400";
          btn.setAttribute("title", "Switch to Light Mode");
        }
      }
    });
  }
})();
