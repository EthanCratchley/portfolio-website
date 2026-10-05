/**
 * Writing hover previews — after a short hover delay, show a rendered
 * thumbnail of the piece under the cursor.
 * Thumbnails are pre-generated into writing/thumbs/ (light + dark).
 */

(function () {
  if (!window.matchMedia("(hover: hover)").matches) return;

  const items = document.querySelectorAll(".writing-item");
  if (!items.length) return;

  const card = document.createElement("div");
  card.className = "writing-preview-card";
  card.setAttribute("aria-hidden", "true");
  const img = document.createElement("img");
  img.alt = "";
  img.draggable = false;
  card.appendChild(img);
  document.body.appendChild(card);

  const DELAY = 350;
  const WIDTH = 400;
  const HEIGHT = 300; // card max height; thumbnail is cropped beyond this
  let timer = null;

  function show(item) {
    const link = item.querySelector(".writing-item-link");
    if (!link) return;
    const match = link
      .getAttribute("href")
      .match(/microblogFiles\/(.+)\.html$/);
    if (!match) return;

    const dark = document.body.classList.contains("dark-mode");
    img.src = "thumbs/" + match[1] + (dark ? ".dark" : "") + ".png";

    const rect = item.getBoundingClientRect();
    card.style.left = Math.min(rect.left, window.innerWidth - WIDTH - 16) + "px";
    if (rect.bottom + HEIGHT + 12 > window.innerHeight && rect.top > HEIGHT + 12) {
      card.style.top = rect.top - HEIGHT - 6 + "px";
    } else {
      card.style.top = rect.bottom + 6 + "px";
    }
    card.classList.add("visible");
  }

  function hide() {
    clearTimeout(timer);
    timer = null;
    card.classList.remove("visible");
  }

  items.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      clearTimeout(timer);
      timer = setTimeout(() => show(item), DELAY);
    });
    item.addEventListener("mouseleave", hide);
  });

  window.addEventListener("scroll", hide, { passive: true });
})();
