document.addEventListener("DOMContentLoaded", () => {
  // -----------------------------
  // 0. Theme Toggle Functionality
  // -----------------------------
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.querySelector(".theme-icon");

  // SVG Icon constants - Simple, minimal sun and moon
  const ICONS = {
    light: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>`,
    dark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>`,
  };

  // Function to get current theme colors
  function getThemeColors() {
    const isDark = document.body.classList.contains("dark-mode");
    return {
      background: isDark ? "#1a1a1a" : "#f9f9f9",
      text: isDark ? "#e0e0e0" : "#333",
      textSecondary: isDark ? "#b0b0b0" : "#555",
      laser: isDark ? "#e0e0e0" : "#000000",
    };
  }

  // Function to set theme with icon update
  function setTheme(theme) {
    const isDark = theme === "dark";

    // Update body class
    document.body.classList.toggle("dark-mode", isDark);

    // Update icon with animation
    if (themeToggle && themeIcon) {
      // Add toggling class for animation
      themeToggle.classList.add("toggling");

      // Change icon
      themeIcon.innerHTML = isDark ? ICONS.dark : ICONS.light;

      // Update aria-label for accessibility
      themeToggle.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
      );

      // Update title for tooltip
      themeToggle.setAttribute(
        "title",
        isDark ? "Switch to light mode" : "Switch to dark mode"
      );

      // Remove toggling class after animation
      setTimeout(() => {
        themeToggle.classList.remove("toggling");
      }, 400);
    }

    // Save to localStorage
    localStorage.setItem("theme", theme);
  }

  // Check for saved theme preference or default to light mode
  const savedTheme = localStorage.getItem("theme") || "light";
  setTheme(savedTheme);

  // Toggle theme on button click
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.body.classList.contains("dark-mode")
        ? "dark"
        : "light";
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      setTheme(newTheme);
    });

    // Keyboard accessibility (Enter and Space)
    themeToggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        themeToggle.click();
      }
    });
  }

  // -----------------------------
  // 1. Fade-In Section
  // -----------------------------
  const fadeInElements = document.querySelectorAll(".fade-in");
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  // Immediately check if elements are already visible in the viewport on page load
  fadeInElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const isVisible =
      rect.top <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.bottom >= 0;

    if (isVisible) {
      // Element is already in viewport, add visible class immediately
      element.classList.add("visible");
    } else {
      // Element not yet visible, observe it
      observer.observe(element);
    }
  });

  // -----------------------------
  // Book Filtering System
  // -----------------------------
  const filterBtn = document.getElementById("book-filter-btn");
  const filterDropdown = document.getElementById("filter-dropdown");
  const filterOptions = document.querySelectorAll(".filter-option");
  const bookCards = document.querySelectorAll(".book-card");

  // Toggle filter dropdown
  if (filterBtn) {
    filterBtn.addEventListener("click", () => {
      filterDropdown.classList.toggle("active");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!filterBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
        filterDropdown.classList.remove("active");
      }
    });

    // Handle filter options
    filterOptions.forEach((option) => {
      option.addEventListener("click", () => {
        const category = option.getAttribute("data-category");

        // Update active state
        filterOptions.forEach((opt) => opt.classList.remove("active"));
        option.classList.add("active");

        // Update button text
        filterBtn.textContent =
          category === "all"
            ? "Filter by Category"
            : `Category: ${
                category.charAt(0).toUpperCase() + category.slice(1)
              }`;

        // Filter books
        bookCards.forEach((card) => {
          const cardCategories = card.getAttribute("data-category").split(" ");
          if (category === "all" || cardCategories.includes(category)) {
            card.style.display = "flex";
          } else {
            card.style.display = "none";
          }
        });

        // Close dropdown
        filterDropdown.classList.remove("active");
      });
    });
  }


  // -----------------------------
  // WEBSITE SEARCH FUNCTIONALITY
  // -----------------------------

  // Search state
  let selectedResultIndex = -1;
  let searchResults = [];
  let searchTimeout;

  // Get search elements
  const searchToggleBtn = document.getElementById("search-toggle");
  const searchModal = document.getElementById("search-modal");
  const searchBackdrop = document.querySelector(".search-backdrop");
  const searchInput = document.getElementById("search-input");
  const searchResultsContainer = document.getElementById("search-results");

  // Check if search elements exist (they should be on all pages)
  if (!searchToggleBtn || !searchModal) {
    console.log("Search elements not found on this page");
    // Don't return - just skip search initialization for this page
  } else {
    // Function to open search modal
    function openSearchModal() {
      searchModal.removeAttribute("hidden");
      document.body.classList.add("search-modal-open");
      setTimeout(() => {
        searchInput.focus();
      }, 100);
    }

    // Function to close search modal
    function closeSearchModal() {
      searchModal.setAttribute("hidden", "");
      document.body.classList.remove("search-modal-open");
      searchInput.value = "";
      searchResultsContainer.innerHTML = "";
      selectedResultIndex = -1;
      searchResults = [];
    }

    // Function to calculate search score
    function calculateScore(searchTerm, item) {
      let score = 0;
      const term = searchTerm.toLowerCase().trim();

      if (!term) return 0;

      // Title match (highest priority)
      const title = item.title.toLowerCase();
      if (title.includes(term)) {
        score += 100;
        if (title.startsWith(term)) {
          score += 50; // Boost for prefix match
        }
        // Exact match gets huge boost
        if (title === term) {
          score += 100;
        }
      }

      // Tag match (medium priority)
      item.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(term)) {
          score += 50;
          if (tag.toLowerCase() === term) {
            score += 30; // Exact tag match
          }
        }
      });

      // Category match
      if (item.category.toLowerCase().includes(term)) {
        score += 30;
      }

      // Description match (lower priority)
      if (item.description.toLowerCase().includes(term)) {
        score += 25;
      }

      // Type match
      if (item.type.toLowerCase().includes(term)) {
        score += 20;
      }

      return score;
    }

    // Function to perform search
    function performSearch(searchTerm) {
      const term = searchTerm.trim();

      if (!term) {
        searchResultsContainer.innerHTML = "";
        searchResults = [];
        selectedResultIndex = -1;
        return;
      }

      // Split search term into words for multi-word search
      const words = term.toLowerCase().split(/\s+/);

      // Calculate scores for all items
      const scoredItems = SEARCH_INDEX.map((item) => {
        let totalScore = 0;

        // For multi-word search, score each word
        words.forEach((word) => {
          totalScore += calculateScore(word, item);
        });

        return {
          item,
          score: totalScore,
        };
      }).filter((result) => result.score > 0); // Only keep items with matches

      // Sort by score (highest first)
      scoredItems.sort((a, b) => b.score - a.score);

      // Take top 10 results
      searchResults = scoredItems.slice(0, 10);

      // Render results
      renderSearchResults();
    }

    // Function to render search results
    function renderSearchResults() {
      if (searchResults.length === 0) {
        searchResultsContainer.innerHTML = `
        <div class="search-empty">
          No results found. Try different keywords.
        </div>
      `;
        return;
      }

      const html = searchResults
        .map(
          (result, index) => `
      <a href="${result.item.url}"
         class="search-result-item ${
           index === selectedResultIndex ? "selected" : ""
         }"
         data-index="${index}"
         ${result.item.url.startsWith("http") ? 'target="_blank"' : ""}>
        <div class="result-content">
          <div class="result-title">${result.item.title}</div>
          <div class="result-breadcrumb">${result.item.breadcrumb}</div>
        </div>
      </a>
    `
        )
        .join("");

      searchResultsContainer.innerHTML = html;

      // Add click handlers to results
      const resultItems = searchResultsContainer.querySelectorAll(
        ".search-result-item"
      );
      resultItems.forEach((item) => {
        item.addEventListener("click", (e) => {
          // Let default link behavior handle navigation
          closeSearchModal();
        });
      });
    }

    // Function to update selected result
    function updateSelectedResult(newIndex) {
      if (searchResults.length === 0) return;

      // Remove selected class from current
      const currentSelected = searchResultsContainer.querySelector(
        ".search-result-item.selected"
      );
      if (currentSelected) {
        currentSelected.classList.remove("selected");
      }

      // Update index with bounds checking
      selectedResultIndex = newIndex;
      if (selectedResultIndex < 0) selectedResultIndex = 0;
      if (selectedResultIndex >= searchResults.length) {
        selectedResultIndex = searchResults.length - 1;
      }

      // Add selected class to new
      const newSelected = searchResultsContainer.querySelector(
        `[data-index="${selectedResultIndex}"]`
      );
      if (newSelected) {
        newSelected.classList.add("selected");
        // Scroll into view if needed
        newSelected.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }

    // Search button click handler
    if (searchToggleBtn) {
      searchToggleBtn.addEventListener("click", openSearchModal);
    }

    // Backdrop click handler
    if (searchBackdrop) {
      searchBackdrop.addEventListener("click", closeSearchModal);
    }

    // Search input handler with debouncing
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          performSearch(e.target.value);
          selectedResultIndex = -1; // Reset selection on new search
        }, 150);
      });
    }

    // Keyboard event handlers
    document.addEventListener("keydown", (e) => {
      // CMD-K (Mac) or CTRL-K (Windows/Linux) to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (searchModal.hasAttribute("hidden")) {
          openSearchModal();
        } else {
          closeSearchModal();
        }
        return;
      }

      // Only handle these keys when modal is open
      if (!searchModal.hasAttribute("hidden")) {
        // ESC to close
        if (e.key === "Escape") {
          e.preventDefault();
          closeSearchModal();
          return;
        }

        // Arrow Down
        if (e.key === "ArrowDown") {
          e.preventDefault();
          updateSelectedResult(selectedResultIndex + 1);
          return;
        }

        // Arrow Up
        if (e.key === "ArrowUp") {
          e.preventDefault();
          updateSelectedResult(selectedResultIndex - 1);
          return;
        }

        // Enter to select
        if (e.key === "Enter" && selectedResultIndex >= 0) {
          e.preventDefault();
          const selectedItem = searchResultsContainer.querySelector(
            `[data-index="${selectedResultIndex}"]`
          );
          if (selectedItem) {
            selectedItem.click();
          }
          return;
        }
      }
    });
  } // End of search elements check
});
