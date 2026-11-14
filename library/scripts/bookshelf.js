/**
 * Bookshelf — a compact shelf of covers with shelf filters and sorting.
 * Shows two rows until expanded; clicking a cover opens its details beneath its row.
 */

(function () {
  const shelf = document.getElementById("bookshelf");
  const shelves = document.getElementById("book-shelves");
  const sorts = document.getElementById("book-sort");
  const more = document.getElementById("shelf-more");
  if (!shelf) return;

  const SHELVES = [
    { key: "philosophy", label: "philosophy & the mind" },
    { key: "history", label: "history & geopolitics" },
    { key: "business", label: "business & money" },
    { key: "lives", label: "lives & stories" },
    { key: "science", label: "science & technology" },
  ];
  const SORTS = [
    { key: "recent", label: "recent", order: (a, b) => b.added - a.added },
    { key: "rating", label: "rating", order: (a, b) => b.rating - a.rating || b.added - a.added },
    { key: "title", label: "title", order: (a, b) => a.title.localeCompare(b.title) },
  ];
  const ROWS = 2;

  let books = [];
  let filter = null;
  let sort = SORTS[0];
  let expanded = false;
  let open = null;
  let cols = 0;

  function stars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 ? '<span class="half-star">☆</span>' : "";
    return "★".repeat(full) + half + "☆".repeat(5 - full - (half ? 1 : 0));
  }

  function columns() {
    return getComputedStyle(shelf).gridTemplateColumns.split(" ").length;
  }

  function cover(book) {
    const img = document.createElement("img");
    img.src = "/assets/covers/" + book.cover;
    img.alt = "";
    img.loading = "lazy";
    img.draggable = false;
    return img;
  }

  function option(label, count, pressed, onClick) {
    const btn = document.createElement("button");
    btn.className = "media-filter";
    btn.setAttribute("aria-pressed", String(pressed));
    btn.textContent = label;
    if (count !== null) {
      const n = document.createElement("span");
      n.className = "media-count";
      n.textContent = count;
      btn.appendChild(n);
    }
    btn.addEventListener("click", onClick);
    return btn;
  }

  function detail(book) {
    const panel = document.createElement("div");
    panel.className = "book-detail";
    panel.id = "book-detail";

    const img = cover(book);
    img.className = "book-detail-cover";
    img.alt = "Cover of " + book.title;
    panel.appendChild(img);

    const info = document.createElement("div");
    info.className = "book-detail-info";
    info.innerHTML =
      '<h4></h4><p class="book-detail-author"></p>' +
      '<p class="book-detail-rating"></p><p class="book-detail-notes"></p>';
    info.querySelector("h4").textContent = book.title;
    info.querySelector(".book-detail-author").textContent = book.author;
    const rating = info.querySelector(".book-detail-rating");
    rating.innerHTML = stars(book.rating);
    rating.setAttribute("aria-label", book.rating + " out of 5 stars");
    info.querySelector(".book-detail-notes").textContent =
      book.notes || book.description;
    panel.appendChild(info);

    const close = document.createElement("button");
    close.className = "book-detail-close";
    close.setAttribute("aria-label", "Close book details");
    close.textContent = "×";
    close.addEventListener("click", () => select(book));
    panel.appendChild(close);
    return panel;
  }

  function select(book) {
    open = open === book ? null : book;
    render();
    shelf.querySelector(`[data-id="${book.id}"]`)?.focus({ preventScroll: true });
  }

  function controls() {
    shelves.innerHTML = "";
    shelves.appendChild(
      option("all", books.length, !filter, () => {
        filter = null;
        expanded = false;
        render();
      })
    );
    SHELVES.forEach((s) => {
      shelves.appendChild(
        option(s.label, books.filter((b) => b.category === s.key).length, filter === s.key, () => {
          filter = s.key;
          expanded = false;
          render();
        })
      );
    });

    sorts.innerHTML = "";
    SORTS.forEach((s) => {
      sorts.appendChild(
        option(s.label, null, sort === s, () => {
          sort = s;
          render();
        })
      );
    });
  }

  function render() {
    controls();
    const list = books.filter((b) => !filter || b.category === filter).sort(sort.order);
    cols = columns();
    const visible = expanded ? list : list.slice(0, cols * ROWS);
    if (!visible.includes(open)) open = null;

    shelf.innerHTML = "";
    visible.forEach((book) => {
      const btn = document.createElement("button");
      btn.className = "book";
      btn.dataset.id = book.id;
      btn.title = book.title;
      btn.setAttribute("aria-label", book.title + " by " + book.author);
      btn.setAttribute("aria-expanded", String(open === book));
      if (open === book) btn.setAttribute("aria-controls", "book-detail");
      btn.appendChild(cover(book));
      btn.addEventListener("click", () => select(book));
      shelf.appendChild(btn);
    });

    if (open) {
      // The panel spans the full width, so it goes after the last book in the open book's row.
      const i = visible.indexOf(open);
      const end = Math.min(visible.length, (Math.floor(i / cols) + 1) * cols);
      shelf.children[end - 1].after(detail(open));
    }

    more.hidden = list.length <= cols * ROWS;
    more.textContent = expanded ? "Show fewer" : "Show all " + list.length;
  }

  more.addEventListener("click", () => {
    expanded = !expanded;
    render();
  });

  new ResizeObserver(() => {
    if (books.length && columns() !== cols) render();
  }).observe(shelf);

  fetch("/library/data/resources.json")
    .then((r) => r.json())
    .then((data) => {
      // File order is the order books were added; keep it as a sort key.
      books = data.books.map((b, i) => ({ ...b, added: i }));
      render();
    })
    .catch((err) => {
      console.error("Failed to load bookshelf:", err);
      shelf.innerHTML = '<p class="empty-state">Could not load books.</p>';
    });
})();
