/**
 * Travelled Globe — canvas orthographic globe with visited countries highlighted.
 * Slowly auto-rotates; drag to spin; hover for country names.
 */

(function () {
  const canvas = document.getElementById("globeCanvas");
  if (!canvas) return;

  const VISITED = new Set([
    "Canada",
    "United States of America",
    "Mexico",
    "Costa Rica",
    "France",
    "Luxembourg",
    "China",
    "Taiwan",
    "Cambodia",
    "Vietnam",
    "Thailand",
    "South Korea",
    "Malaysia",
    "Iceland",
  ]);

  // Territories too small for the 110m map — drawn as dots
  const VISITED_DOTS = [
    { name: "Hong Kong", lon: 114.17, lat: 22.32 },
    { name: "Macau", lon: 113.55, lat: 22.2 },
    { name: "Singapore", lon: 103.82, lat: 1.35 },
    { name: "Cayman Islands", lon: -81.25, lat: 19.31 },
  ];

  const ctx = canvas.getContext("2d");
  const tooltip = document.getElementById("globe-tooltip");
  const D2R = Math.PI / 180;

  let countries = [];
  let lambda = -100 * D2R; // start over the Americas
  let phi = 15 * D2R; // tilt toward the northern hemisphere
  let width = 0;
  let height = 0;
  let baseRadius = 0;
  let zoom = 1;
  let radius = 0;
  let cx = 0;
  let cy = 0;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  let autoRotate = !reducedMotion;
  let idleTimer = null;
  let dragging = false;
  let lastPointer = null;
  let lastPinchDist = null;
  let hovered = null;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    baseRadius = Math.min(width, height) / 2 - 10;
    radius = baseRadius * zoom;
    cx = width / 2;
    cy = height / 2;
  }

  function colors() {
    const dark = document.body.classList.contains("dark-mode");
    return dark
      ? {
          sphere: "rgba(255,255,255,0.04)",
          outline: "rgba(255,255,255,0.25)",
          land: "#3a3a3a",
          landStroke: "#1a1a1a",
          visited: "#6b93c9",
          visitedHover: "#89abd8",
          landHover: "#4a4a4a",
          dot: "#89abd8",
          graticule: "rgba(255,255,255,0.05)",
        }
      : {
          sphere: "rgba(0,0,0,0.02)",
          outline: "rgba(0,0,0,0.2)",
          land: "#ddd",
          landStroke: "#f9f9f9",
          visited: "#4271ae",
          visitedHover: "#5d88c0",
          landHover: "#ccc",
          dot: "#4271ae",
          graticule: "rgba(0,0,0,0.04)",
        };
  }

  // Orthographic projection. Returns screen point; back-hemisphere points are
  // clamped to the horizon so polygon fills stay contiguous.
  function project(lon, lat) {
    const lr = lon * D2R - lambda;
    const pr = lat * D2R;
    const cosP = Math.cos(pr);
    let x = cosP * Math.sin(lr);
    let y = Math.cos(phi) * Math.sin(pr) - Math.sin(phi) * cosP * Math.cos(lr);
    const z = Math.sin(phi) * Math.sin(pr) + Math.cos(phi) * cosP * Math.cos(lr);
    if (z < 0) {
      const len = Math.sqrt(x * x + y * y) || 1;
      x /= len;
      y /= len;
    }
    return { x: cx + radius * x, y: cy - radius * y, back: z < 0 };
  }

  function invert(sx, sy) {
    const x = (sx - cx) / radius;
    const y = -(sy - cy) / radius;
    const rho = Math.sqrt(x * x + y * y);
    if (rho > 1) return null;
    const c = Math.asin(rho);
    const sinC = Math.sin(c);
    const cosC = Math.cos(c);
    const lat = Math.asin(
      cosC * Math.sin(phi) + (rho ? (y * sinC * Math.cos(phi)) / rho : 0)
    );
    const lon =
      lambda +
      Math.atan2(x * sinC, rho * cosC * Math.cos(phi) - y * sinC * Math.sin(phi));
    return { lon: lon / D2R, lat: lat / D2R };
  }

  function drawRing(ring) {
    let visible = false;
    for (let i = 0; i < ring.length; i++) {
      const p = project(ring[i][0], ring[i][1]);
      if (!p.back) visible = true;
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    return visible;
  }

  function draw() {
    const c = colors();
    ctx.clearRect(0, 0, width, height);

    // Sphere
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = c.sphere;
    ctx.fill();
    ctx.strokeStyle = c.outline;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Graticule (every 30°)
    ctx.beginPath();
    for (let lon = -180; lon < 180; lon += 30) {
      for (let lat = -80; lat <= 80; lat += 4) {
        const p = project(lon, lat);
        if (p.back) continue;
        const q = project(lon, Math.min(lat + 4, 80));
        if (q.back) continue;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
      }
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let lon = -180; lon < 180; lon += 4) {
        const p = project(lon, lat);
        if (p.back) continue;
        const q = project(lon + 4, lat);
        if (q.back) continue;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
      }
    }
    ctx.strokeStyle = c.graticule;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    for (const country of countries) {
      const isVisited = VISITED.has(country.n);
      const isHovered = hovered === country.n;
      ctx.beginPath();
      let visible = false;
      for (const poly of country.p) {
        for (const ring of poly) {
          if (drawRing(ring)) visible = true;
        }
      }
      if (!visible) continue;
      ctx.fillStyle = isVisited
        ? isHovered
          ? c.visitedHover
          : c.visited
        : isHovered
          ? c.landHover
          : c.land;
      ctx.fill();
      ctx.strokeStyle = c.landStroke;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Dots for small visited territories
    for (const d of VISITED_DOTS) {
      const p = project(d.lon, d.lat);
      if (p.back) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, hovered === d.name ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = c.dot;
      ctx.fill();
    }

    ctx.restore();
  }

  function tick() {
    if (autoRotate && !dragging) {
      lambda += 0.0008;
    }
    draw();
    requestAnimationFrame(tick);
  }

  function pauseAutoRotate() {
    autoRotate = false;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!reducedMotion) autoRotate = true;
    }, 700);
  }

  // Point-in-polygon (ray casting on lon/lat)
  function ringContains(ring, lon, lat) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0];
      const yi = ring[i][1];
      const xj = ring[j][0];
      const yj = ring[j][1];
      if (
        yi > lat !== yj > lat &&
        lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
      ) {
        inside = !inside;
      }
    }
    return inside;
  }

  function countryAt(lon, lat) {
    for (const country of countries) {
      for (const poly of country.p) {
        if (ringContains(poly[0], lon, lat)) {
          // Subtract holes
          let inHole = false;
          for (let r = 1; r < poly.length; r++) {
            if (ringContains(poly[r], lon, lat)) {
              inHole = true;
              break;
            }
          }
          if (!inHole) return country.n;
        }
      }
    }
    return null;
  }

  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function setZoom(z) {
    zoom = Math.max(1, Math.min(5, z));
    radius = baseRadius * zoom;
  }

  function onMove(e) {
    // Pinch zoom
    if (e.touches && e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (lastPinchDist) setZoom(zoom * (d / lastPinchDist));
      lastPinchDist = d;
      pauseAutoRotate();
      e.preventDefault();
      return;
    }

    const pos = pointerPos(e);
    if (dragging && lastPointer) {
      const dx = pos.x - lastPointer.x;
      const dy = pos.y - lastPointer.y;
      lambda -= (dx / radius) * 0.9;
      phi = Math.max(
        -Math.PI / 2 + 0.1,
        Math.min(Math.PI / 2 - 0.1, phi + (dy / radius) * 0.9)
      );
      lastPointer = pos;
      pauseAutoRotate();
      if (e.touches) e.preventDefault();
      return;
    }

    // Hover detection (mouse only)
    if (e.touches) return;
    const geo = invert(pos.x, pos.y);
    let name = null;
    if (geo) {
      // Dots take priority (bigger hit area in screen space)
      for (const d of VISITED_DOTS) {
        const p = project(d.lon, d.lat);
        if (!p.back && Math.hypot(p.x - pos.x, p.y - pos.y) < 7) {
          name = d.name;
          break;
        }
      }
      if (!name) name = countryAt(geo.lon, geo.lat);
    }
    hovered = name;
    canvas.style.cursor = geo ? "grab" : "default";

    if (tooltip) {
      if (name) {
        const visited =
          VISITED.has(name) || VISITED_DOTS.some((d) => d.name === name);
        tooltip.textContent = visited ? name + " ✓" : name;
        tooltip.classList.toggle("visited", visited);
        tooltip.style.left = pos.x + 14 + "px";
        tooltip.style.top = pos.y - 10 + "px";
        tooltip.hidden = false;
      } else {
        tooltip.hidden = true;
      }
    }
  }

  canvas.addEventListener("mousedown", (e) => {
    dragging = true;
    lastPointer = pointerPos(e);
    canvas.style.cursor = "grabbing";
    pauseAutoRotate();
  });
  window.addEventListener("mouseup", () => {
    dragging = false;
    lastPointer = null;
  });
  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("mouseleave", () => {
    hovered = null;
    if (tooltip) tooltip.hidden = true;
  });
  canvas.addEventListener(
    "touchstart",
    (e) => {
      dragging = true;
      lastPointer = pointerPos(e);
      pauseAutoRotate();
    },
    { passive: true }
  );
  canvas.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("touchend", (e) => {
    if (!e.touches || e.touches.length < 2) lastPinchDist = null;
    if (!e.touches || e.touches.length === 0) {
      dragging = false;
      lastPointer = null;
    }
  });
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      setZoom(zoom * Math.exp(-e.deltaY * 0.0015));
      pauseAutoRotate();
    },
    { passive: false }
  );
  window.addEventListener("resize", resize);

  const caption = document.getElementById("globe-caption");
  if (caption) {
    caption.textContent =
      VISITED.size + VISITED_DOTS.length + " / 195 countries";
  }

  fetch("/writing/data/world.json")
    .then((r) => r.json())
    .then((data) => {
      countries = data.countries;
      resize();
      tick();
    })
    .catch((err) => console.error("Failed to load globe data:", err));
})();
