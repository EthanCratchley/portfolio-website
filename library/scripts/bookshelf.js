/**
 * Bookshelf — scrollable shelf of 3D book spines (Stripe Press style).
 * Hover tilts a book out to reveal its cover; click opens a detail panel.
 */

(function () {
  const shelf = document.getElementById("bookshelf");
  const detail = document.getElementById("book-detail");
  if (!shelf) return;

  // Muted spine palette; picked deterministically per book
  const PALETTE = [
    "#2d4a3e",
    "#5d3a2e",
    "#31436b",
    "#4a4a58",
    "#6b3254",
    "#7a5c2e",
    "#3c5a5e",
    "#703a3a",
    "#455130",
    "#3f3d63",
  ];

  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function stars(rating) {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  }

  let openBook = null;

  function closeDetail() {
    openBook = null;
    detail.hidden = true;
    shelf
      .querySelectorAll(".book.open")
      .forEach((b) => b.classList.remove("open"));
  }

  function showDetail(book, el) {
    if (openBook === book.id) {
      closeDetail();
      return;
    }
    openBook = book.id;
    shelf
      .querySelectorAll(".book.open")
      .forEach((b) => b.classList.remove("open"));
    el.classList.add("open");

    detail.innerHTML = "";

    const coverCol = document.createElement("div");
    coverCol.className = "book-detail-cover";
    coverCol.appendChild(coverNode(book, true));
    detail.appendChild(coverCol);

    const info = document.createElement("div");
    info.className = "book-detail-info";

    const title = document.createElement("h3");
    title.textContent = book.title;
    info.appendChild(title);

    const author = document.createElement("p");
    author.className = "book-detail-author";
    author.textContent = book.author;
    info.appendChild(author);

    const meta = document.createElement("p");
    meta.className = "book-detail-meta";
    const rating = document.createElement("span");
    rating.className = "book-detail-rating";
    rating.textContent = stars(book.rating);
    meta.appendChild(rating);
    info.appendChild(meta);

    const notes = document.createElement("p");
    notes.className = "book-detail-notes";
    notes.textContent = book.notes || book.description;
    info.appendChild(notes);

    const close = document.createElement("button");
    close.className = "book-detail-close";
    close.setAttribute("aria-label", "Close book details");
    close.textContent = "×";
    close.addEventListener("click", closeDetail);
    detail.appendChild(info);
    detail.appendChild(close);

    detail.hidden = false;
  }

  function coverNode(book, large) {
    if (book.cover) {
      const img = document.createElement("img");
      img.src = "/assets/covers/" + book.cover;
      img.alt = large ? "Cover of " + book.title : "";
      img.loading = "lazy";
      img.draggable = false;
      return img;
    }
    // Procedural cover for books without an image
    const div = document.createElement("div");
    div.className = "book-cover-generated";
    div.style.backgroundColor = PALETTE[hash(book.title) % PALETTE.length];
    const t = document.createElement("span");
    t.className = "gen-title";
    t.textContent = book.title;
    const a = document.createElement("span");
    a.className = "gen-author";
    a.textContent = book.author;
    div.appendChild(t);
    div.appendChild(a);
    return div;
  }

  function render(books) {
    shelf.innerHTML = "";
    books.forEach((book) => {
      const h = hash(book.id + book.title);
      const spineW = 34 + (h % 14); // 34–47px
      const height = 196 + (h % 5) * 9; // 196–232px
      const color = PALETTE[hash(book.title) % PALETTE.length];

      const btn = document.createElement("button");
      btn.className = "book";
      btn.style.setProperty("--spine-w", spineW + "px");
      btn.style.setProperty("--book-h", height + "px");
      btn.setAttribute(
        "aria-label",
        book.title + " by " + book.author + " — details"
      );

      const inner = document.createElement("span");
      inner.className = "book-3d";

      const spine = document.createElement("span");
      spine.className = "book-spine";
      spine.style.backgroundColor = color;
      const spineTitle = document.createElement("span");
      spineTitle.className = "book-spine-title";
      spineTitle.textContent = book.title;
      spine.appendChild(spineTitle);

      const cover = document.createElement("span");
      cover.className = "book-cover";
      cover.appendChild(coverNode(book, false));

      const pages = document.createElement("span");
      pages.className = "book-pages";

      inner.appendChild(spine);
      inner.appendChild(cover);
      inner.appendChild(pages);
      btn.appendChild(inner);

      btn.addEventListener("click", () => showDetail(book, btn));
      shelf.appendChild(btn);
    });
  }

  // Scroll arrows
  const leftArrow = document.getElementById("shelf-left");
  const rightArrow = document.getElementById("shelf-right");

  function updateArrows() {
    if (!leftArrow || !rightArrow) return;
    leftArrow.hidden = shelf.scrollLeft < 10;
    rightArrow.hidden =
      shelf.scrollLeft + shelf.clientWidth > shelf.scrollWidth - 10;
  }

  if (leftArrow && rightArrow) {
    leftArrow.addEventListener("click", () =>
      shelf.scrollBy({ left: -shelf.clientWidth * 0.7, behavior: "smooth" })
    );
    rightArrow.addEventListener("click", () =>
      shelf.scrollBy({ left: shelf.clientWidth * 0.7, behavior: "smooth" })
    );
    shelf.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
  }

  fetch("/library/data/resources.json")
    .then((r) => r.json())
    .then((data) => {
      render(data.books.slice().reverse()); // newest additions first
      updateArrows();
    })
    .catch((err) => {
      console.error("Failed to load bookshelf:", err);
      shelf.innerHTML = '<p class="empty-state">Could not load books.</p>';
    });
})();
