/**
 * Resource Filter - Filter and display resources by type with pagination
 */

class ResourceFilter {
  constructor(resources) {
    this.resources = resources;
    this.activeFilter = "all";
    this.activeCategory = "all";
    this.filterButtons = null;
    this.categoryBtn = null;
    this.categoryDropdown = null;
    this.resourceContainer = null;
    this.paginationContainer = null;
    this.currentPage = 1;
    this.itemsPerPage = 10;
  }

  /**
   * Initialize the resource filter
   */
  init() {
    this.filterButtons = document.querySelectorAll(".resource-filter-btn");
    this.categoryBtn = document.getElementById("category-filter-btn");
    this.categoryDropdown = document.getElementById("category-dropdown");
    this.resourceContainer = document.getElementById("resource-list");

    if (!this.resourceContainer) {
      console.error("Resource container not found");
      return;
    }

    // Set up filter button listeners
    this.filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.getAttribute("data-filter");
        this.setFilter(filter);
      });
    });

    // Set up custom category dropdown
    if (this.categoryBtn && this.categoryDropdown) {
      // Toggle dropdown on button click
      this.categoryBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.categoryBtn.classList.toggle("active");
        this.categoryDropdown.classList.toggle("active");
      });

      // Handle category option clicks
      const categoryOptions =
        this.categoryDropdown.querySelectorAll(".category-option");
      categoryOptions.forEach((option) => {
        option.addEventListener("click", () => {
          const category = option.getAttribute("data-category");
          this.selectCategory(category, option.textContent);
        });
      });

      // Close dropdown when clicking outside
      document.addEventListener("click", (e) => {
        if (
          !this.categoryBtn.contains(e.target) &&
          !this.categoryDropdown.contains(e.target)
        ) {
          this.categoryBtn.classList.remove("active");
          this.categoryDropdown.classList.remove("active");
        }
      });
    }

    // Initial render
    this.render();
  }

  /**
   * Select a category (called when clicking an option)
   */
  selectCategory(category, displayText) {
    // Update button text
    const arrowSpan = this.categoryBtn.querySelector(".category-arrow");
    this.categoryBtn.childNodes[0].textContent = displayText + " ";

    // Update active state on options
    const categoryOptions =
      this.categoryDropdown.querySelectorAll(".category-option");
    categoryOptions.forEach((opt) => {
      if (opt.getAttribute("data-category") === category) {
        opt.classList.add("active");
      } else {
        opt.classList.remove("active");
      }
    });

    // Close dropdown
    this.categoryBtn.classList.remove("active");
    this.categoryDropdown.classList.remove("active");

    // Update filter
    this.setCategory(category);
  }

  /**
   * Set active filter
   */
  setFilter(filter) {
    this.activeFilter = filter;
    this.currentPage = 1; // Reset to first page when filter changes

    // Update button states
    this.filterButtons.forEach((btn) => {
      if (btn.getAttribute("data-filter") === filter) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Re-render resources
    this.render();
  }

  /**
   * Set active category
   */
  setCategory(category) {
    this.activeCategory = category;
    this.currentPage = 1; // Reset to first page when category changes

    // Re-render resources
    this.render();
  }

  /**
   * Go to specific page
   */
  goToPage(page) {
    this.currentPage = page;
    this.render();
  }

  /**
   * Render resources based on active filter with pagination
   */
  render() {
    // Get resources to display
    let allResources = this.getFilteredResources();

    // Show empty state if no resources
    if (allResources.length === 0) {
      this.resourceContainer.innerHTML =
        '<p class="empty-state">No resources found in this category.</p>';
      this.hidePagination();
      return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(allResources.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const resourcesToShow = allResources.slice(startIndex, endIndex);

    // Clear and render resources
    this.resourceContainer.innerHTML = "";
    resourcesToShow.forEach((resource) => {
      const element = this.createResourceElement(resource);
      this.resourceContainer.appendChild(element);
    });

    // Update pagination controls
    this.updatePagination(totalPages);
  }

  /**
   * Get filtered resources based on active filter and category
   */
  getFilteredResources() {
    let allResources = [];

    if (this.activeFilter === "all") {
      // Combine all resources
      allResources = [
        ...this.resources.websites.map((r) => ({ ...r, type: "website" })),
        ...this.resources.videos.map((r) => ({ ...r, type: "video" })),
        ...this.resources.books.map((r) => ({ ...r, type: "book" })),
        ...this.resources.papers.map((r) => ({ ...r, type: "paper" })),
        ...this.resources.notes.map((r) => ({ ...r, type: "note" })),
      ];

      // Sort by date added (most recent first)
      allResources.sort(
        (a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)
      );
    } else {
      // Get specific type
      const typeKey = this.activeFilter;
      allResources =
        this.resources[typeKey]?.map((r) => ({
          ...r,
          type: this.activeFilter.slice(0, -1), // Remove 's' from plural
        })) || [];
    }

    // Filter by category if active
    if (this.activeCategory && this.activeCategory !== "all") {
      allResources = allResources.filter(
        (r) => r.category === this.activeCategory
      );
    }

    return allResources;
  }

  /**
   * Update pagination controls (or create if first time)
   */
  updatePagination(totalPages) {
    let paginationContainer = document.querySelector(".pagination-container");

    // Hide pagination if only one page
    if (totalPages <= 1) {
      this.hidePagination();
      return;
    }

    // Create pagination if it doesn't exist
    if (!paginationContainer) {
      paginationContainer = this.createPaginationStructure();
      this.resourceContainer.parentNode.appendChild(paginationContainer);
    }

    // Show pagination
    paginationContainer.style.display = "block";

    // Update button states
    const prevBtn = paginationContainer.querySelector(".pagination-btn-prev");
    const nextBtn = paginationContainer.querySelector(".pagination-btn-next");
    const numbersDiv = paginationContainer.querySelector(".pagination-numbers");

    // Update previous button
    prevBtn.disabled = this.currentPage === 1;

    // Update next button
    nextBtn.disabled = this.currentPage === totalPages;

    // Update page numbers
    numbersDiv.innerHTML = "";
    const maxVisible = 3;
    let startPage = Math.max(1, this.currentPage - 1);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    // Adjust if we're near the end
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // Add page number buttons
    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = this.createPageButton(i);
      numbersDiv.appendChild(pageBtn);
    }
  }

  /**
   * Create pagination structure (only called once)
   */
  createPaginationStructure() {
    const paginationDiv = document.createElement("div");
    paginationDiv.className = "pagination-container";

    const controlsDiv = document.createElement("div");
    controlsDiv.className = "pagination-controls";

    // Previous button
    const prevBtn = document.createElement("button");
    prevBtn.className = "pagination-btn pagination-btn-prev";
    prevBtn.textContent = "←";
    prevBtn.addEventListener("click", () => {
      if (this.currentPage > 1) {
        this.goToPage(this.currentPage - 1);
      }
    });
    controlsDiv.appendChild(prevBtn);

    // Page numbers container
    const pageNumbersDiv = document.createElement("div");
    pageNumbersDiv.className = "pagination-numbers";
    controlsDiv.appendChild(pageNumbersDiv);

    // Next button
    const nextBtn = document.createElement("button");
    nextBtn.className = "pagination-btn pagination-btn-next";
    nextBtn.textContent = "→";
    nextBtn.addEventListener("click", () => {
      const allResources = this.getFilteredResources();
      const totalPages = Math.ceil(allResources.length / this.itemsPerPage);
      if (this.currentPage < totalPages) {
        this.goToPage(this.currentPage + 1);
      }
    });
    controlsDiv.appendChild(nextBtn);

    paginationDiv.appendChild(controlsDiv);
    return paginationDiv;
  }

  /**
   * Hide pagination
   */
  hidePagination() {
    const paginationContainer = document.querySelector(".pagination-container");
    if (paginationContainer) {
      paginationContainer.style.display = "none";
    }
  }

  /**
   * Create page number button
   */
  createPageButton(pageNum) {
    const btn = document.createElement("button");
    btn.className = "pagination-page-btn";
    if (pageNum === this.currentPage) {
      btn.classList.add("active");
    }
    btn.textContent = pageNum;
    btn.addEventListener("click", () => {
      this.goToPage(pageNum);
    });
    return btn;
  }

  /**
   * Create resource DOM element
   */
  createResourceElement(resource) {
    // Create wrapper (link if URL exists, div otherwise)
    const item = resource.url
      ? document.createElement("a")
      : document.createElement("div");

    item.className = "resource-item";

    if (resource.url) {
      item.href = resource.url;
      item.target = "_blank";
      item.rel = "noopener noreferrer";
    }

    // Title (no icon, no separate link)
    const titleElement = document.createElement("h3");
    titleElement.className = "resource-title";
    titleElement.textContent = resource.title;
    item.appendChild(titleElement);

    // Author (for books/papers)
    if (resource.author || resource.authors) {
      const authorElement = document.createElement("p");
      authorElement.className = "resource-author";
      authorElement.textContent = resource.author || resource.authors;
      item.appendChild(authorElement);
    }

    // Description
    const descElement = document.createElement("p");
    descElement.className = "resource-description";
    descElement.textContent = resource.description;
    item.appendChild(descElement);

    // Metadata (only type and category)
    const metaElement = document.createElement("div");
    metaElement.className = "resource-meta";

    // Type indicator (website, video, book, paper, note)
    const typeSpan = document.createElement("span");
    typeSpan.className = "resource-type";
    typeSpan.textContent =
      resource.type.charAt(0).toUpperCase() + resource.type.slice(1);
    metaElement.appendChild(typeSpan);

    // Category (blog, tutorial, research, etc.)
    if (resource.category) {
      const categorySpan = document.createElement("span");
      categorySpan.className = "resource-category";
      categorySpan.textContent =
        resource.category.charAt(0).toUpperCase() + resource.category.slice(1);
      metaElement.appendChild(categorySpan);
    }

    // Year (for papers) - optional metadata
    if (resource.year) {
      const yearSpan = document.createElement("span");
      yearSpan.className = "resource-year";
      yearSpan.textContent = resource.year;
      metaElement.appendChild(yearSpan);
    }

    // Rating (for books) - optional metadata
    if (resource.rating) {
      const ratingSpan = document.createElement("span");
      ratingSpan.className = "resource-rating";
      ratingSpan.textContent =
        "★".repeat(resource.rating) + "☆".repeat(5 - resource.rating);
      metaElement.appendChild(ratingSpan);
    }

    item.appendChild(metaElement);

    return item;
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initResourceFilter);
} else {
  initResourceFilter();
}

async function initResourceFilter() {
  try {
    // Load resources data
    const response = await fetch("/garden/data/resources.json");
    const resources = await response.json();

    // Initialize resource filter
    const filter = new ResourceFilter(resources);
    filter.init();

    // Make globally accessible for debugging
    window.resourceFilter = filter;
  } catch (error) {
    console.error("Failed to initialize resource filter:", error);
  }
}
