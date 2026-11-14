/**
 * Media library — tabs for each collection, category filters, and a plain list of links.
 */

(function () {
  const tabs = document.getElementById("media-tabs");
  const filters = document.getElementById("media-filters");
  const list = document.getElementById("media-list");
  const more = document.getElementById("media-more");
  if (!tabs || !list) return;

  const SECTIONS = [
    { key: "websites", label: "Websites" },
    { key: "videos", label: "Videos" },
    { key: "papers", label: "Papers" },
  ];
  const PAGE = 15;

  let resources = null;
  let section = SECTIONS[0].key;
  let category = null;
  let shown = PAGE;

  function button(className, label, count, pressed, onClick) {
    const btn = document.createElement("button");
    btn.className = className;
    btn.setAttribute("aria-pressed", String(pressed));
    btn.textContent = label;
    const n = document.createElement("span");
    n.className = "media-count";
    n.textContent = count;
    btn.appendChild(n);
    btn.addEventListener("click", onClick);
    return btn;
  }

  function source(r) {
    if (r.authors || r.author) return (r.authors || r.author) + (r.year ? ", " + r.year : "");
    if (!r.url) return "";
    return new URL(r.url).hostname.replace(/^www\./, "");
  }

  function item(r) {
    const li = document.createElement("li");
    const link = document.createElement(r.url ? "a" : "div");
    link.className = "resource-item";
    if (r.url) {
      link.href = r.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    link.innerHTML =
      '<span class="resource-title"></span><span class="resource-source"></span>' +
      '<span class="resource-description"></span>';
    link.querySelector(".resource-title").textContent = r.title;
    link.querySelector(".resource-source").textContent = source(r);
    link.querySelector(".resource-description").textContent = r.description;
    li.appendChild(link);
    return li;
  }

  function render() {
    const all = resources[section] || [];

    tabs.innerHTML = "";
    SECTIONS.forEach((s) => {
      tabs.appendChild(
        button("media-tab", s.label, (resources[s.key] || []).length, s.key === section, () => {
          section = s.key;
          category = null;
          shown = PAGE;
          render();
        })
      );
    });

    // Filters only help when a collection spans more than one category.
    const counts = {};
    all.forEach((r) => {
      if (r.category) counts[r.category] = (counts[r.category] || 0) + 1;
    });
    const cats = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    filters.innerHTML = "";
    filters.hidden = cats.length < 2;
    if (cats.length > 1) {
      [[null, all.length], ...cats].forEach(([cat, n]) => {
        filters.appendChild(
          button("media-filter", cat || "all", n, cat === category, () => {
            category = cat;
            shown = PAGE;
            render();
          })
        );
      });
    }

    const items = category ? all.filter((r) => r.category === category) : all;
    list.innerHTML = "";
    items.slice(0, shown).forEach((r) => list.appendChild(item(r)));
    more.hidden = items.length <= shown;
    more.textContent = "Show " + Math.min(PAGE, items.length - shown) + " more";
  }

  more.addEventListener("click", () => {
    shown += PAGE;
    render();
  });

  fetch("/library/data/resources.json")
    .then((r) => r.json())
    .then((data) => {
      resources = data;
      render();
    })
    .catch((err) => {
      console.error("Failed to load media:", err);
      list.innerHTML = '<li class="empty-state">Could not load the library.</li>';
    });
})();
