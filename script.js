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
  fadeInElements.forEach((element) => observer.observe(element));

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
    wobbleAngle: 0          // For a subtle hover wobble
  };
  
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    drone.x = e.clientX - rect.left;
    drone.y = e.clientY - rect.top;
    
    // Update rotation angle
    const dx = drone.x - canvas.width/2;
    const dy = drone.y - canvas.height/2;
    drone.angle = Math.atan2(dy, dx);
  });

  // -----------------------------
  // 6. Drawing the Drone with tip at cursor position
  // -----------------------------
  function drawDrone() {
    drone.wobbleAngle += 0.05;
    const wobbleOffsetX = Math.sin(drone.wobbleAngle) * 0.5;
    const wobbleOffsetY = Math.cos(drone.wobbleAngle) * 0.5;

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
    ctx.font = "6px monospace";
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
  const asciiLaserPattern = ["-", "=", "-", "="];
  let laserActive = false;
  let laserTargetX = 0;
  let laserTargetY = 0;
  let laserTimer = 0;

  function drawAsciiLaser(x1, y1, x2, y2) {
    ctx.font = "3.5px monospace";
    ctx.fillStyle = "#333";
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.floor(distance / 3.5);
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const x = x1 + dx * t;
      const y = y1 + dy * t;
      const char = asciiLaserPattern[i % asciiLaserPattern.length];
      ctx.fillText(char, x, y);
    }
  }

  function blowUpStarsAt(x, y) {
    const radius = 40;
    particles = particles.filter((p) => {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius) {
        // Increase explosion particles count.
        for (let i = 0; i < 7; i++) {
          createParticle(p.x, p.y, true);
        }
        return false;
      }
      return true;
    });
  }

  // -----------------------------
  // 9. Event Listeners for Laser Firing
  // -----------------------------
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    laserTargetX = e.clientX - rect.left;
    laserTargetY = e.clientY - rect.top;
    laserActive = true;
    laserTimer = 30; // Duration of laser effect (~0.5s at 60fps)
    // Increase explosion particle count on click.
    for (let i = 0; i < 25; i++) {
      createParticle(laserTargetX, laserTargetY, true);
    }
    blowUpStarsAt(laserTargetX, laserTargetY);
  });

  // -----------------------------
  // 10. Spawn Background Particles (Stars)
  // -----------------------------
  setInterval(() => {
    // Increase the spawn probability slightly.
    if (Math.random() < 0.35) {
      createParticle(Math.random() * canvas.width, Math.random() * canvas.height);
    }
  }, 100);

  // -----------------------------
  // 11. Main Animation Loop
  // -----------------------------
  function animate() {
    ctx.fillStyle = "#f9f9f9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    updateParticles();
    drawParticles();
    drawDrone();

    if (laserActive) {
      // Draw laser from the drone's tip (cursor) to the target
      drawAsciiLaser(drone.x, drone.y, laserTargetX, laserTargetY);
      laserTimer--;
      if (laserTimer <= 0) {
        laserActive = false;
      }
    }

    requestAnimationFrame(animate);
  }
  animate();
});