document.addEventListener("DOMContentLoaded", () => {
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
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
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
  // Project Filtering System
  // -----------------------------
  const filterBtns = document.querySelectorAll('.filter-btn');
  const filterSlider = document.querySelector('.filter-slider');
  const projectCards = document.querySelectorAll('.project-card');
  const tagElements = document.querySelectorAll('.tag');
  const allFilterBtn = document.querySelector('.filter-btn[data-filter="all"]');
  
  // Initialize the slider
  if (filterSlider && filterBtns.length > 0) {
    // Set initial position of slider to match "All" button
    const activeBtn = document.querySelector('.filter-btn.active');
    if (activeBtn) {
      setTimeout(() => {
        // Delay to ensure elements are properly sized
        filterSlider.style.width = `${activeBtn.offsetWidth}px`;
        filterSlider.style.transform = `translateX(0)`;
      }, 100);
    }
    
    // Handle filter button clicks
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        
        // If clicking on the already active filter (except "All"), toggle it off
        if (btn.classList.contains('active') && filter !== 'all') {
          // Reset to "All" filter
          filterBtns.forEach(b => b.classList.remove('active'));
          allFilterBtn.classList.add('active');
          
          // Move slider to "All" button
          const allOffsetLeft = allFilterBtn.offsetLeft;
          filterSlider.style.width = `${allFilterBtn.offsetWidth}px`;
          filterSlider.style.transform = `translateX(${allOffsetLeft}px)`;
          
          // Apply "All" filter
          filterProjects('all');
          updateTagHighlighting('all');
        } else {
          // Update active state
          filterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          // Move slider to active button
          const offsetLeft = btn.offsetLeft;
          filterSlider.style.width = `${btn.offsetWidth}px`;
          filterSlider.style.transform = `translateX(${offsetLeft}px)`;
          
          // Filter projects by selected category
          filterProjects(filter);
          updateTagHighlighting(filter);
        }
      });
    });
  }
  
  // Handle tag clicks
  tagElements.forEach((tag) => {
    tag.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent triggering the project card link
      
      // Get the filter category from the tag's class
      const tagClasses = tag.classList;
      let tagFilter = '';
      
      // Find the class that matches a filter category
      for (const className of tagClasses) {
        if (className !== 'tag' && className !== 'active') {
          tagFilter = className;
          break;
        }
      }
      
      if (tagFilter) {
        // Check if tag is already active (filter is already applied)
        const isCurrentlyActive = document.querySelector(`.filter-btn[data-filter="${tagFilter}"]`).classList.contains('active');
        
        if (isCurrentlyActive) {
          // If this filter is already active, toggle it off by clicking the "All" button
          allFilterBtn.click();
        } else {
          // Otherwise apply this filter
          filterBtns.forEach(btn => {
            if (btn.getAttribute('data-filter') === tagFilter) {
              btn.click(); // Simulate click on the corresponding filter button
            }
          });
        }
      }
    });
  });
  
  // Function to update tag highlighting based on active filter
  function updateTagHighlighting(activeFilter) {
    tagElements.forEach(tag => {
      // Remove active class from all tags first
      tag.classList.remove('active');
      
      // Add active class to tags matching the current filter
      if (activeFilter !== 'all') {
        const tagClasses = tag.classList;
        for (const className of tagClasses) {
          if (className === activeFilter) {
            tag.classList.add('active');
          }
        }
      }
    });
  }
  
  // Filter projects function
  function filterProjects(filter) {
    projectCards.forEach(card => {
      const tags = card.getAttribute('data-tags').split(' ');
      
      if (filter === 'all' || tags.includes(filter)) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  }

  // Call on page load to set initial state
  if (filterBtns.length > 0) {
    const initialActiveBtn = document.querySelector('.filter-btn.active');
    if (initialActiveBtn) {
      const initialFilter = initialActiveBtn.getAttribute('data-filter');
      // Run initial filter after slight delay to ensure DOM is ready
      setTimeout(() => {
        filterProjects(initialFilter);
        updateTagHighlighting(initialFilter);
      }, 200);
    }
  }

  // -----------------------------
  // Book Filtering System
  // -----------------------------
  const filterBtn = document.getElementById('book-filter-btn');
  const filterDropdown = document.getElementById('filter-dropdown');
  const filterOptions = document.querySelectorAll('.filter-option');
  const bookCards = document.querySelectorAll('.book-card');
  
  // Toggle filter dropdown
  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      filterDropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!filterBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
        filterDropdown.classList.remove('active');
      }
    });
    
    // Handle filter options
    filterOptions.forEach(option => {
      option.addEventListener('click', () => {
        const category = option.getAttribute('data-category');
        
        // Update active state
        filterOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        
        // Update button text
        filterBtn.textContent = category === 'all' ? 'Filter by Category' : `Category: ${category.charAt(0).toUpperCase() + category.slice(1)}`;
        
        // Filter books
        bookCards.forEach(card => {
          const cardCategories = card.getAttribute('data-category').split(' ');
          if (category === 'all' || cardCategories.includes(category)) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
        
        // Close dropdown
        filterDropdown.classList.remove('active');
      });
    });
  }

  // -----------------------------
  // 2. Canvas Setup
  // -----------------------------
  const canvas = document.getElementById("artCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight || 300;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // -----------------------------
  // 3. Drone ASCII Art Design
  // -----------------------------
  // Using your provided design
  const droneArtLines = `
  ‎ 
                                              ..=##+..                                              
                                              :%%##%%=                                              
                                            :%%%%%%%%%%:                                            
                                          .#%%%%%%%%%%%%#:                                          
                                        .*%%%%%%%%%#%%%%%%#.                                        
                                      .+%%%%%%%%%%%#%%%%%%%%*..                                     
                                    .-%%%%%%%%%%%%%#%%%%%%%%%%=..                                   
                                   :%%%%%####%%%%###%%%####%%%%%-                                   
                                 .#%%%%%%%%%%%%%%###%%%%%%%%%%%%%%:                                 
                               .#%%%%%%%%%%%%%%%%###%%%%%%%%%%%%%%%%.                               
                             .+%%%%%%%%%%%%%%%%%%###%%%%%%%%%%%%%%%%%*.                             
                            =%%%%%%%%%%%%%%%%%%%%###%%%%%%%%%%%%%%%%%%%+..                          
                          :%%%%%%%%%%%%%%%%%%%%%%###%%%%%%%%%%%%%%%%%%%%%-                          
                        :%%%%%%%%%%%%%%%%%%%%%%%%###%%%%%%%%%%%%%%%%%%%%%%%:                        
                      :#%%%%%%%%%%%%%%%%%%%%%%%%%###%%%%%%%%%%%%%%%%%%%%%%%%%-                      
                    .#%%%%%%%%%%%%%%%%%%%%%%%%%%%###%%%%%%%%%%%%%%%%%%%%%%%%%%#:                    
                  .*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%###%%%%%%%%%%%%%%%%%%%%%%%%%%%%#..                 
               ..=%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%###%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*..               
               -%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%###%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%=               
             :%%%%%%%%%..=@@@%%%%%%%%%%%%%%%%%%%%###%%%%%%%%%%%%%%%%%%%%@@+..#%%%%%%%%-             
           .%%%%%@@%%:     =@@@%%%%%%%%%%%%%%%%%%##%%%%%%%%%%%%%%%%%%@@@*.    .#%@@%%%%%:           
         .*%%%%@@@@=         +@@@@%%%%%@@@#=%@@@%##%@@@%+*@@@%%%%%@@@@*         :@@@@%%%%#.         
       .+%%%%%@@@+.          ..+@@@@@@@@%:...+@@@%#@@@*....#@@@@@@@@*.           .-@@@%%%%%*..      
      =%%%%%@@@*.              ..*@@@@@-      .#@%%@%.      :@@@@@#..              .+@@@%%%%%+      
    :%%%%%@@@%.                  ..*@=          .%%.          :@#.                   .#@@@%%%%%=    
  .#%%%%@@@%:                      .                                                   .%@@@%%%%#:  
.#%%%%@@@@-                                                                              :%@@@%%%%%: 
-%%%@@@@=                                                                                  :@@@@%%%+
..+%@@*.                                                                                     +@@%*..
  ..=.                                                                                        .=..
  `
    .trim()
    .split("\n");

  // Compute the maximum length (in characters) and pad each line to normalize widths.
  const maxLength = Math.max(...droneArtLines.map(line => line.length));
  const droneArt = droneArtLines.map(line => line.padEnd(maxLength, " "));

  // -----------------------------
  // 4. Find the exact tip coordinates of the ASCII drone
  // -----------------------------
  const droneFont = "3.5px monospace";
  ctx.font = droneFont;
  const charWidth = ctx.measureText("a").width;
  const lineHeight = 4;

  // The drone tip is located at the rightmost non-space character
  let tipX = 0;
  let tipY = 0;
  const tipSearchStartLine = 1;  // First line with @ symbols
  const tipSearchEndLine = 1;    // Nose section

  for (let i = tipSearchStartLine; i <= tipSearchEndLine; i++) {
    const line = droneArt[i];
    for (let j = line.length - 1; j >= 0; j--) {
      if (line[j] === '.') {  // Specifically look for '@'
        if (j > tipX / charWidth) {  // Compare character positions
          tipX = j * charWidth;
          tipY = i * lineHeight;
        }
        break; // Stop searching this line after rightmost '@'
      }
    }
  }

  // -----------------------------
  // 5. Drone Object
  // -----------------------------
  const drone = {
    x: canvas.width / 2,  
    y: canvas.height / 3,
    angle: 0,               // Current rotation angle (radians)
    wobbleAngle: 0,         // For a subtle hover wobble
    lasers: [] // New laser storage
  };
  
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    drone.x = e.clientX - rect.left;
    drone.y = e.clientY - rect.top;
    
    // Update rotation angle
    const dx = drone.x - canvas.width/2;
    const dy = drone.y - canvas.height/2;
    const targetAngle = Math.atan2(dy, dx);
    drone.angle += (targetAngle - drone.angle) * 0.08;   
  });

  // -----------------------------
  // 6. Drawing the Drone with tip at cursor position
  // -----------------------------
  function drawDrone() {
    drone.wobbleAngle += 0.075;
    const wobbleOffsetX = Math.sin(drone.wobbleAngle) * 2.0; // Increased amplitude
    const wobbleOffsetY = Math.cos(drone.wobbleAngle * 0.8) * 2.0; // Increased amplitude

    ctx.save();
    
    // 1. Move to cursor position (tip location)
    ctx.translate(drone.x, drone.y);
    
    // 2. Apply rotation around the tip
    ctx.rotate(drone.angle);
    
    // 3. Apply wobble OFFSET (body moves, tip stays fixed)
    ctx.translate(wobbleOffsetX, wobbleOffsetY);
    
    // 4. Draw drone with tip at origin (0,0)
    ctx.font = droneFont;
    ctx.fillStyle = "#333";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    
    // Offset the art so detected tip is at (0,0)
    for (let i = 0; i < droneArt.length; i++) {
      ctx.fillText(
        droneArt[i], 
        -tipX,  // Offset X to bring tip to 0
        -tipY + (i * lineHeight) // Offset Y
      );
    }
    
    ctx.restore();
  }

  // -----------------------------
  // 7. Particles (Stars and Explosions)
  // -----------------------------


  let particles = [];
  const letters = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";

  function createParticle(x, y, isExplosion = false) {
    const speedMultiplier = isExplosion ? 3 : 1;
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2 * speedMultiplier,
      vy: (Math.random() - 0.5) * 2 * speedMultiplier,
      letter: letters[Math.floor(Math.random() * letters.length)],
      lifespan: isExplosion ? 60 : 300,
      originalLifespan: isExplosion ? 60 : 300,
      alpha: 1
    });
  }

  function updateParticles() {
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.lifespan--;
      p.alpha = p.lifespan / p.originalLifespan;
    });
    particles = particles.filter((p) => p.lifespan > 0);
  }

  function drawParticles() {
    ctx.font = "5px monospace";
    ctx.fillStyle = "#555";
    particles.forEach((p) => {
      ctx.globalAlpha = p.alpha;
      ctx.fillText(p.letter, p.x, p.y);
    });
    ctx.globalAlpha = 1;
  }

  // -----------------------------
  // 8. ASCII Laser
  // -----------------------------
  const laserChars = ["▓","▒","░","≡","≣","⫸","▷"];
  class Laser {
    constructor(x, y, angle) {
      this.x = x;
      this.y = y;
      this.angle = angle*7;
      this.speed = 5;
      this.alpha = 1.0;
      this.segments = [];
    }

    update() {
      // Move laser forward
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
      
      // Add new segment
      this.segments.push({x: this.x, y: this.y});
      
      // Fade out
      this.alpha -= 0.02;
      return this.alpha > 0;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.font = "4px monospace";
      ctx.fillStyle = "#000000";
      
      // Draw trailing segments
      this.segments.forEach((seg, i) => {
        const char = laserChars[i % laserChars.length];
        ctx.fillText(char, seg.x, seg.y);
      });
      
      ctx.restore();
    }
  }

  // -----------------------------
  // 9. Event Listeners for Laser Firing
  // -----------------------------
  canvas.addEventListener("click", (e) => {
    // Calculate laser start position at drone tip
    const laserX = drone.x;
    const laserY = drone.y;
    
    // Create new laser facing drone's direction
    drone.lasers.push(new Laser(laserX, laserY, drone.angle));
  });

  function animate() {
    ctx.fillStyle = "#00000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw lasers
    drone.lasers = drone.lasers.filter(laser => {
      laser.update();
      laser.draw(ctx);
      return laser.alpha > 0;
    });

    updateParticles();
    drawParticles();
    drawDrone();

    requestAnimationFrame(animate);
  }

  // -----------------------------
  // 10. Spawn Background Particles (Stars)
  // -----------------------------
  setInterval(() => {
    // Increase the spawn probability slightly.
    if (Math.random() < 0.40) {
      createParticle(Math.random() * canvas.width, Math.random() * canvas.height);
    }
  }, 100);

  // -----------------------------
  // 11. Main Animation Loop
  // -----------------------------
  function animate() {
    ctx.fillStyle = "#f9f9f9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    // Update and draw lasers
    drone.lasers = drone.lasers.filter(laser => {
      laser.update();
      laser.draw(ctx);
      return laser.alpha > 0;
    });
  
    updateParticles();
    drawParticles();
    drawDrone();
  
    requestAnimationFrame(animate);
  }
  animate();
});