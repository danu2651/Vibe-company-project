document.addEventListener("DOMContentLoaded", () => {
  let currentLang =
    localStorage.getItem("vibe_lang") || localStorage.getItem("lang") || "en";

  const langSelects = document.querySelectorAll(
    "#language-select, .language-select",
  );

  function updateText() {
    // Translate text nodes
    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (translations[currentLang] && translations[currentLang][key]) {
        const textValue = translations[currentLang][key];

        // If the element is a container with nested elements (like icons), update text node specifically
        const hasIconsOrSpans = el.querySelector("i, svg, img");
        if (hasIconsOrSpans) {
          Array.from(el.childNodes).forEach((node) => {
            if (
              node.nodeType === Node.TEXT_NODE &&
              node.nodeValue.trim() !== ""
            ) {
              node.nodeValue = " " + textValue + " ";
            }
          });
        } else {
          el.textContent = textValue;
        }
      }
    });

    // Translate placeholder attributes
    const inputs = document.querySelectorAll("[data-i18n-placeholder]");
    inputs.forEach((input) => {
      const key = input.getAttribute("data-i18n-placeholder");
      if (translations[currentLang] && translations[currentLang][key]) {
        input.placeholder = translations[currentLang][key];
      }
    });

    // Set document language
    document.documentElement.lang = currentLang;

    // Sync all dropdowns
    langSelects.forEach((select) => {
      select.value = currentLang;
    });
  }

  // Apply on initial load
  updateText();

  // Attach change listener to language selectors
  langSelects.forEach((select) => {
    select.addEventListener("change", (e) => {
      currentLang = e.target.value;
      localStorage.setItem("vibe_lang", currentLang);
      localStorage.setItem("lang", currentLang);
      updateText();
    });
  });

  // Global helper
  window.setLanguage = function (lang) {
    if (translations[lang]) {
      currentLang = lang;
      localStorage.setItem("vibe_lang", lang);
      localStorage.setItem("lang", lang);
      updateText();
    }
  };
});
