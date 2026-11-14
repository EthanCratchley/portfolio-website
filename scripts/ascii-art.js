// Renders the home page image as colour ASCII art; characters near the cursor flutter,
// and double-clicking flutters between the ASCII art and the real photo.
(() => {
  const img = document.querySelector(".main-image");
  if (!img) return;

  // Ordered light → dense ink.
  const RAMP = " .'`^,:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
  const RADIUS = 70;
  const DURATION = 1400;
  const BAND = 0.08;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const canvas = document.createElement("canvas");
  canvas.className = "main-image ascii-art";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", img.alt);
  canvas.title = "Double-click to toggle the photo";
  const ctx = canvas.getContext("2d");

  let cells = [];
  let cols = 0;
  let rows = 0;
  let cw = 0;
  let ch = 0;
  let frame = 0;
  let built = "";
  let sample;
  let progress = 0;
  let target = 0;
  let last = 0;

  function build() {
    const width = canvas.clientWidth;
    const dark = document.body.classList.contains("dark-mode");
    if (!width || built === `${width}:${dark}`) return;
    built = `${width}:${dark}`;
    const height = Math.round((width * img.naturalHeight) / img.naturalWidth);
    const dpr = window.devicePixelRatio || 1;
    canvas.style.height = `${height}px`;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const size = width < 480 ? 5 : 7;
    ch = size;
    cw = size * 0.6;
    cols = Math.floor(width / cw);
    rows = Math.floor(height / ch);
    ctx.font = `bold ${size}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.textBaseline = "top";

    sample = document.createElement("canvas");
    sample.width = cols;
    sample.height = rows;
    const sctx = sample.getContext("2d", { willReadFrequently: true });
    sctx.drawImage(img, 0, 0, cols, rows);
    const data = sctx.getImageData(0, 0, cols, rows).data;

    // Dense characters should mark whatever contrasts with the page background.
    cells = [];
    for (let i = 0; i < cols * rows; i++) {
      const [r, g, b] = data.subarray(i * 4, i * 4 + 3);
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      // Floor keeps colour visible in pale regions (e.g. the white robot in light mode).
      const ink = 0.4 + 0.6 * (dark ? lum : 1 - lum);
      cells.push({
        char: RAMP[Math.round(ink * (RAMP.length - 1))],
        color: `rgb(${r},${g},${b})`,
        energy: 0,
        phase: Math.random() * Math.PI * 2,
        order: Math.random(),
      });
    }
    if (!frame) draw(0);
  }

  function draw(time) {
    const step = last ? (time - last) / DURATION : 0;
    last = time;
    progress = target ? Math.min(1, progress + step) : Math.max(0, progress - step);
    // Overshoot by the band so the transition fully completes at either end.
    const edge = progress * (1 + 2 * BAND) - BAND;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Faint pixel mosaic of the image so the picture reads behind the glyphs.
    ctx.globalAlpha = 0.35;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sample, 0, 0, cols * cw, rows * ch);
    ctx.globalAlpha = 1;

    if (edge > 0) {
      ctx.save();
      ctx.beginPath();
      cells.forEach((cell, i) => {
        if (cell.order < edge) ctx.rect((i % cols) * cw, Math.floor(i / cols) * ch, cw, ch);
      });
      ctx.clip();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, cols * cw, rows * ch);
      ctx.restore();
    }

    let active = progress !== target;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = cells[y * cols + x];
        if (cell.order < edge) {
          cell.energy = 0;
          continue;
        }
        if (active && cell.order - edge < BAND) cell.energy = 1;
        ctx.fillStyle = cell.color;
        if (cell.energy < 0.05) {
          cell.energy = 0;
          ctx.fillText(cell.char, x * cw, y * ch);
          continue;
        }
        active = true;
        const swing = cell.energy * 3;
        const t = time / 90 + cell.phase;
        const char =
          Math.random() < cell.energy * 0.6
            ? RAMP[1 + Math.floor(Math.random() * (RAMP.length - 1))]
            : cell.char;
        ctx.fillText(char, x * cw + Math.sin(t) * swing, y * ch + Math.cos(t * 1.3) * swing);
        cell.energy *= 0.93;
      }
    }
    if (active) {
      frame = requestAnimationFrame(draw);
      return;
    }
    frame = 0;
    last = 0;
  }

  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  }

  function stir(event) {
    const [px, py] = point(event);
    const x0 = Math.max(0, Math.floor((px - RADIUS) / cw));
    const x1 = Math.min(cols - 1, Math.ceil((px + RADIUS) / cw));
    const y0 = Math.max(0, Math.floor((py - RADIUS) / ch));
    const y1 = Math.min(rows - 1, Math.ceil((py + RADIUS) / ch));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x * cw - px, y * ch - py) / RADIUS;
        if (d >= 1) continue;
        const cell = cells[y * cols + x];
        cell.energy = Math.max(cell.energy, (1 - d) ** 2);
      }
    }
    if (!frame) frame = requestAnimationFrame(draw);
  }

  // The transition ripples outward from where you double-click, with some noise.
  function toggle(event) {
    const [px, py] = point(event);
    const far = Math.max(
      ...[[0, 0], [cols * cw, 0], [0, rows * ch], [cols * cw, rows * ch]].map(([x, y]) =>
        Math.hypot(x - px, y - py),
      ),
    );
    // Going back to ASCII, the nearest cells must flip last (edge sweeps 1 → 0).
    const flip = target ? -1 : 1;
    cells.forEach((cell, i) => {
      const d = Math.hypot((i % cols) * cw - px, Math.floor(i / cols) * ch - py) / far;
      cell.order = 0.5 + flip * (0.8 * d + 0.2 * Math.random() - 0.5);
    });
    target = 1 - target;
    if (still) progress = target;
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function start() {
    img.after(canvas);
    img.style.display = "none";
    build();
    new ResizeObserver(build).observe(canvas);
    new MutationObserver(build).observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    canvas.addEventListener("dblclick", toggle);
    // Stop double-click from selecting the surrounding paragraph text.
    canvas.addEventListener("mousedown", (e) => e.detail > 1 && e.preventDefault());
    if (!still) canvas.addEventListener("pointermove", stir);
  }

  if (img.complete && img.naturalWidth) start();
  else img.addEventListener("load", start, { once: true });
})();
