/**
 * Thought Stream - Ambient border animations for Garden page
 * Thoughts fade in/out around page margins at random positions
 */

class ThoughtStream {
  constructor(thoughts, config = {}) {
    this.allThoughts = thoughts;
    this.activeThoughts = new Map(); // Track currently visible thoughts
    this.usedThoughts = new Set(); // Track recently used thoughts

    // Configuration
    this.config = {
      maxVisible: window.innerWidth > 768 ? 24 : 0, // More thoughts on desktop
      fadeInDuration: 3000, // ms - slow fade in
      fadeOutDuration: 3000, // ms - slow fade out
      minDisplayTime: 6000, // ms - total time (continuous fading, minimal static)
      maxDisplayTime: 6000, // ms - same as min for consistent behavior
      spawnInterval: { min: 2000, max: 5000 }, // ms between spawns - faster spawning
      minDistance: 200, // Minimum distance between thoughts (pixels)
      zones: this.calculateZones(),
      ...config,
    };

    this.container = null;
    this.isRunning = false;
    this.spawnTimer = null;
  }

  /**
   * Calculate positioning zones based on viewport
   * Keeps thoughts strictly outside main content area and legend
   * Uses absolute positioning relative to scroll
   */
  calculateZones() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scrollY = window.scrollY || window.pageYOffset;

    // Main content area is centered with max-width: 700px + padding
    const mainContentWidth = Math.min(700, vw * 0.8);
    const mainContentLeft = (vw - mainContentWidth) / 2;
    const mainContentRight = mainContentLeft + mainContentWidth;

    // Legend is at left: 100px, width: 150px, extends down the page
    const legendRight = 280; // Safe margin beyond legend

    // Calculate safe zones
    const leftMarginMax = Math.max(20, Math.min(80, mainContentLeft - 220));
    const rightMarginMin = Math.max(mainContentRight + 40, vw - 300);

    return {
      leftMargin: {
        weight: 0.3,
        bounds: {
          xMin: 20,
          xMax: leftMarginMax,
          yMin: scrollY + 400, // Well below legend start
          yMax: scrollY + vh + 1000, // Extend below viewport
        },
      },
      rightMargin: {
        weight: 0.5,
        bounds: {
          xMin: rightMarginMin,
          xMax: vw - 20,
          yMin: scrollY + 250, // Below title area
          yMax: scrollY + vh + 1000, // Extend below viewport
        },
      },
      bottomArea: {
        weight: 0.2,
        bounds: {
          xMin: mainContentLeft + 50,
          xMax: mainContentRight - 200,
          yMin: scrollY + vh - 150,
          yMax: scrollY + vh + 800, // Extend way below viewport
        },
      },
    };
  }

  /**
   * Initialize the thought stream
   */
  init() {
    // Create container for thoughts
    this.container = document.createElement("div");
    this.container.className = "thought-stream-container";
    this.container.setAttribute("aria-live", "polite");
    this.container.setAttribute("aria-label", "Ambient thoughts");
    document.body.appendChild(this.container);

    // Start spawning thoughts
    this.start();

    // Handle window resize
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 250);
    });

    // Respect prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.config.fadeInDuration = 300;
      this.config.fadeOutDuration = 300;
      this.config.maxVisible = 6; // Fewer thoughts
    }
  }

  /**
   * Start spawning thoughts
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;

    // Spawn initial thoughts
    const initialCount = Math.min(this.config.maxVisible, 8);
    for (let i = 0; i < initialCount; i++) {
      setTimeout(() => {
        this.spawnThought();
      }, i * 800); // Stagger initial spawn
    }

    // Continue spawning
    this.scheduleNextSpawn();
  }

  /**
   * Stop spawning thoughts
   */
  stop() {
    this.isRunning = false;
    if (this.spawnTimer) {
      clearTimeout(this.spawnTimer);
      this.spawnTimer = null;
    }
  }

  /**
   * Schedule next thought spawn
   */
  scheduleNextSpawn() {
    if (!this.isRunning) return;

    const delay = this.randomBetween(
      this.config.spawnInterval.min,
      this.config.spawnInterval.max
    );

    this.spawnTimer = setTimeout(() => {
      if (this.activeThoughts.size < this.config.maxVisible) {
        this.spawnThought();
      }
      this.scheduleNextSpawn();
    }, delay);
  }

  /**
   * Spawn a new thought
   */
  spawnThought() {
    // Get random thought
    const thought = this.getRandomThought();
    if (!thought) return;

    // Try to find a non-colliding position (max 10 attempts)
    let position = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts && !position) {
      // Select zone based on weights
      const zone = this.selectZone();
      const candidatePosition = this.getRandomPosition(zone);

      // Check if position collides with existing thoughts
      if (!this.hasCollision(candidatePosition)) {
        position = candidatePosition;
      }
      attempts++;
    }

    // If we couldn't find a non-colliding position, skip this spawn
    if (!position) return;

    // Create thought element
    const element = this.createThoughtElement(thought, position);

    // Add to container
    this.container.appendChild(element);

    // Track active thought
    const thoughtId = Date.now() + Math.random();
    this.activeThoughts.set(thoughtId, {
      element,
      thought,
      position, // Store position for collision detection
      spawnTime: Date.now(),
    });

    // Fade in with slight delay to ensure transition triggers
    setTimeout(() => {
      requestAnimationFrame(() => {
        element.classList.add("visible");
      });
    }, 50);

    // Schedule fade out
    const displayTime = this.randomBetween(
      this.config.minDisplayTime,
      this.config.maxDisplayTime
    );

    setTimeout(() => {
      this.removeThought(thoughtId);
    }, displayTime);
  }

  /**
   * Create thought DOM element
   */
  createThoughtElement(thought, position) {
    const element = document.createElement("div");
    element.className = "thought-bubble";
    element.style.left = `${position.x}px`;
    element.style.top = `${position.y}px`;

    // Add thought text
    const textElement = document.createElement("p");
    textElement.textContent = thought.text;
    element.appendChild(textElement);

    return element;
  }

  /**
   * Remove thought from display
   */
  removeThought(thoughtId) {
    const data = this.activeThoughts.get(thoughtId);
    if (!data) return;

    const { element, thought } = data;

    // Fade out
    element.classList.remove("visible");
    element.classList.add("fading");

    // Remove from DOM after fade
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.activeThoughts.delete(thoughtId);

      // Return to pool after cooldown
      setTimeout(() => {
        this.usedThoughts.delete(thought.id);
      }, 30000); // 30s cooldown
    }, this.config.fadeOutDuration);
  }

  /**
   * Get random thought from pool
   */
  getRandomThought() {
    // Filter out recently used thoughts
    const availableThoughts = this.allThoughts.filter(
      (t) => !this.usedThoughts.has(t.id)
    );

    if (availableThoughts.length === 0) {
      // Reset pool if all thoughts have been used
      this.usedThoughts.clear();
      return this.allThoughts[
        Math.floor(Math.random() * this.allThoughts.length)
      ];
    }

    const thought =
      availableThoughts[Math.floor(Math.random() * availableThoughts.length)];
    this.usedThoughts.add(thought.id);
    return thought;
  }

  /**
   * Select zone based on weights
   */
  selectZone() {
    const rand = Math.random();
    let cumulative = 0;

    for (const [zoneName, zone] of Object.entries(this.config.zones)) {
      cumulative += zone.weight;
      if (rand <= cumulative) {
        return zone;
      }
    }

    // Fallback to right margin
    return this.config.zones.rightMargin;
  }

  /**
   * Get random position within zone bounds
   */
  getRandomPosition(zone) {
    return {
      x: this.randomBetween(zone.bounds.xMin, zone.bounds.xMax),
      y: this.randomBetween(zone.bounds.yMin, zone.bounds.yMax),
    };
  }

  /**
   * Check if a position would collide with existing thoughts
   * Returns true if collision detected, false if position is clear
   */
  hasCollision(position) {
    const minDistance = this.config.minDistance;

    for (const [_, data] of this.activeThoughts) {
      if (!data.position) continue;

      const dx = position.x - data.position.x;
      const dy = position.y - data.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        return true; // Collision detected
      }
    }

    return false; // No collision
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const newMaxVisible = window.innerWidth > 768 ? 24 : 0;

    if (newMaxVisible === 0 && this.config.maxVisible > 0) {
      // Switched to mobile - clear all thoughts
      this.stop();
      this.activeThoughts.forEach((data, id) => {
        this.removeThought(id);
      });
    } else if (newMaxVisible > 0 && this.config.maxVisible === 0) {
      // Switched to desktop - restart
      this.config.maxVisible = newMaxVisible;
      this.config.zones = this.calculateZones();
      this.start();
    } else {
      // Just update zones
      this.config.maxVisible = newMaxVisible;
      this.config.zones = this.calculateZones();
    }
  }

  /**
   * Utility: Random number between min and max
   */
  randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initThoughtStream);
} else {
  initThoughtStream();
}

async function initThoughtStream() {
  try {
    // Load thoughts data
    const response = await fetch("/garden/data/thoughts.json");
    const thoughts = await response.json();

    // Initialize thought stream
    const stream = new ThoughtStream(thoughts);
    stream.init();

    // Make globally accessible for debugging
    window.thoughtStream = stream;
  } catch (error) {
    console.error("Failed to initialize thought stream:", error);
  }
}
