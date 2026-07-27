document.addEventListener('DOMContentLoaded', () => {
    // Determine the saved language, default to 'en'
    let currentLang = localStorage.getItem('lang') || 'en';
    
    const langSelects = document.querySelectorAll('#language-select');
    
    // Function to update the page text
    function updateText() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[currentLang] && translations[currentLang][key]) {
                // Determine if element contains HTML or just text
                // For simplicity, we assume textContent unless specific markup is needed
                // If there are spans inside (like in CTA buttons), we need to be careful
                // Actually, most elements are pure text.
                if (el.tagName.toLowerCase() === 'span' || el.children.length === 0) {
                    el.textContent = translations[currentLang][key];
                } else if (el.tagName.toLowerCase() === 'h1' || el.tagName.toLowerCase() === 'button' || el.tagName.toLowerCase() === 'a') {
                    // For complex elements, we might need to preserve children like icons
                    // Let's replace just the first text node, or just use textContent if there are no icons
                    // For this project, we'll replace text nodes
                    Array.from(el.childNodes).forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== '') {
                            node.nodeValue = translations[currentLang][key];
                        }
                    });
                    
                    // If no text node was found (e.g. only spans inside), we might need to update a specific child
                    // But in our setup, we'll apply data-i18n to the specific text-bearing <span> where possible
                } else {
                    el.textContent = translations[currentLang][key];
                }
            }
        });

        // Set document language
        document.documentElement.lang = currentLang;

        // Sync all select dropdowns
        langSelects.forEach(select => {
            select.value = currentLang;
        });
    }

    // Apply translations on load
    updateText();

    // Listen for language changes
    langSelects.forEach(select => {
        select.addEventListener('change', (e) => {
            currentLang = e.target.value;
            localStorage.setItem('lang', currentLang);
            updateText();
        });
    });
});
