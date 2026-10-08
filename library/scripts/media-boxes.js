/**
 * Media boxes — tiled category boxes (websites, videos, papers, notes).
 * Larger boxes with varied content get clickable category subsections.
 * Clicking a box (or a subsection) expands that collection below the grid.
 */

(function () {
  const grid = document.getElementById("media-boxes");
  const list = document.getElementById("media-list");
  if (!grid || !list) return;

  const SECTIONS = [
    { key: "websites", label: "websites" },
    { key: "videos", label: "videos" },
    { key: "papers", label: "papers" },
    { key: "notes", label: "notes" },
  ];
  const PAGE = 15;
  // Subsections only where there's enough volume and variety
  const SUB_MIN_ITEMS = 10;
  const SUB_MIN_CATS = 3;
  const SUB_MIN_COUNT = 3;
  const SUB_MAX = 4;

  let resources = null;
  let openKey = null;
  let openCat = null;
  let shown = PAGE;

  function subcategories(items) {
    const counts = {};
    items.forEach((r) => {
      if (r.category) counts[r.category] = (counts[r.category] || 0) + 1;
    });
    const cats = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (items.length < SUB_MIN_ITEMS || cats.length < SUB_MIN_CATS) return [];
    return cats.filter(([, n]) => n >= SUB_MIN_COUNT).slice(0, SUB_MAX);
  }

  function renderItem(r) {
    const item = r.url
      ? document.createElement("a")
      : document.createElement("div");
    item.className = "resource-item";
    if (r.url) {
      item.href = r.url;
      item.target = "_blank";
      item.rel = "noopener noreferrer";
    }

    const title = document.createElement("h3");
    title.className = "resource-title";
    title.textContent = r.title;
    item.appendChild(title);

    if (r.author || r.authors) {
      const author = document.createElement("p");
      author.className = "resource-author";
      author.textContent = r.author || r.authors;
      item.appendChild(author);
    }

    const desc = document.createElement("p");
    desc.className = "resource-description";
    desc.textContent = r.description + (r.year ? " (" + r.year + ")" : "");
    item.appendChild(desc);

    return item;
  }

  function renderList() {
    list.innerHTML = "";
    if (!openKey) {
      list.hidden = true;
      return;
    }
    let items = resources[openKey] || [];
    if (openCat) items = items.filter((r) => r.category === openCat);

    items.slice(0, shown).forEach((r) => list.appendChild(renderItem(r)));

    if (items.length > shown) {
      const more = document.createElement("button");
      more.className = "media-show-more";
      more.textContent = "Show more (" + (items.length - shown) + " remaining)";
      more.addEventListener("click", () => {
        shown += PAGE;
        renderList();
      });
      list.appendChild(more);
    }
    list.hidden = false;
  }

  function syncActive() {
    grid.querySelectorAll(".media-box").forEach((box) => {
      box.classList.toggle("active", box.dataset.key === openKey);
    });
    grid.querySelectorAll(".media-box-sub").forEach((sub) => {
      sub.classList.toggle(
        "active",
        sub.dataset.key === openKey && sub.dataset.cat === openCat
      );
    });
  }

  function toggle(key, cat) {
    if (openKey === key && openCat === (cat || null)) {
      openKey = null;
      openCat = null;
    } else {
      openKey = key;
      openCat = cat || null;
    }
    shown = PAGE;
    syncActive();
    renderList();
  }

  function renderBoxes() {
    grid.innerHTML = "";
    SECTIONS.forEach((s) => {
      const items = resources[s.key] || [];
      const box = document.createElement("div");
      box.className = "media-box";
      box.dataset.key = s.key;
      box.setAttribute("role", "button");
      box.tabIndex = 0;
      box.setAttribute("aria-label", "Browse " + s.label);

      const label = document.createElement("span");
      label.className = "media-box-label";
      label.textContent = s.label;
      box.appendChild(label);

      const subs = subcategories(items);
      if (subs.length) {
        const subWrap = document.createElement("span");
        subWrap.className = "media-box-subs";
        subs.forEach(([cat, n]) => {
          const sub = document.createElement("button");
          sub.className = "media-box-sub";
          sub.dataset.key = s.key;
          sub.dataset.cat = cat;
          const subLabel = document.createElement("span");
          subLabel.className = "sub-label";
          subLabel.textContent = cat;
          const subCount = document.createElement("span");
          subCount.className = "sub-count";
          subCount.textContent = n + " items";
          sub.appendChild(subLabel);
          sub.appendChild(subCount);
          sub.addEventListener("click", (e) => {
            e.stopPropagation();
            toggle(s.key, cat);
          });
          subWrap.appendChild(sub);
        });
        box.appendChild(subWrap);
      }

      const count = document.createElement("span");
      count.className = "media-box-count";
      count.textContent = items.length + (items.length === 1 ? " item" : " items");
      box.appendChild(count);

      box.addEventListener("click", () => toggle(s.key));
      box.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle(s.key);
        }
      });
      grid.appendChild(box);
    });
  }

  fetch("/library/data/resources.json")
    .then((r) => r.json())
    .then((data) => {
      resources = data;
      renderBoxes();
    })
    .catch((err) => console.error("Failed to load media:", err));
})();
