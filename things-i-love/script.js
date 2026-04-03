(() => {
  const grid = document.getElementById("grid");
  const overlay = document.getElementById("overlay");
  const balloon = document.getElementById("balloon");
  let currentItem = null;
  let captionVisible = false;
  let isMobile = "ontouchstart" in window;
  let hoverTimer = null;
  let leaveTimer = null;

  // Render grid items
  ITEMS.forEach((item, i) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("grid-item");
    wrapper.dataset.index = i;

    let el;
    if (item.type === "video") {
      el = document.createElement("video");
      el.src = item.src;
      el.autoplay = true;
      el.muted = true;
      el.loop = true;
      el.playsInline = true;
      el.preload = "none";
      el.setAttribute("playsinline", "");
    } else {
      el = document.createElement("img");
      el.src = item.src;
      el.loading = "lazy";
    }

    el.alt = item.caption || "";
    wrapper.appendChild(el);
    grid.appendChild(wrapper);
  });

  // Lazy loading for videos
  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          video.preload = "metadata";
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { rootMargin: "200px" }
  );

  document.querySelectorAll(".grid-item video").forEach((v) => {
    videoObserver.observe(v);
  });

  function clearBalloon() {
    while (balloon.firstChild) {
      balloon.removeChild(balloon.firstChild);
    }
  }

  function hideCaption() {
    document.querySelectorAll(".caption-box.visible").forEach((b) => {
      b.classList.remove("visible");
    });
    captionVisible = false;
  }

  // Balloon interaction
  function balloonUp(wrapper) {
    if (currentItem === wrapper) return;
    if (currentItem) balloonDownImmediate();
    currentItem = wrapper;
    captionVisible = false;

    const item = ITEMS[wrapper.dataset.index];
    const source = wrapper.querySelector("img, video");
    const rect = source.getBoundingClientRect();

    clearBalloon();

    let media;
    if (item.type === "video") {
      media = document.createElement("video");
      media.src = item.src;
      media.autoplay = true;
      media.muted = true;
      media.loop = true;
      media.playsInline = true;
      media.setAttribute("playsinline", "");
      media.currentTime = source.currentTime || 0;
      media.play().catch(() => {});
    } else {
      media = document.createElement("img");
      media.src = item.src;
    }
    media.alt = item.caption || "";

    balloon.appendChild(media);

    // Caption box
    if (item.caption) {
      const box = document.createElement("div");
      box.classList.add("caption-box");

      const text = document.createElement("div");
      text.classList.add("caption-text");
      text.textContent = item.caption;
      box.appendChild(text);

      balloon.appendChild(box);
    }

    // Mute toggle for videos
    if (item.type === "video") {
      const muteBtn = document.createElement("button");
      muteBtn.classList.add("unmute-btn");
      muteBtn.textContent = "\uD83D\uDD07";
      muteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        media.muted = !media.muted;
        muteBtn.textContent = media.muted ? "\uD83D\uDD07" : "\uD83D\uDD0A";
      });
      balloon.appendChild(muteBtn);
    }

    // Calculate target size
    const maxW = isMobile ? window.innerWidth * 0.9 : window.innerWidth * 0.65;
    const maxH = isMobile ? window.innerHeight * 0.8 : window.innerHeight * 0.7;
    const aspect = rect.width / rect.height;
    let targetW, targetH;
    if (maxW / aspect <= maxH) {
      targetW = maxW;
      targetH = maxW / aspect;
    } else {
      targetH = maxH;
      targetW = maxH * aspect;
    }

    // Start at grid position
    balloon.style.transition = "none";
    balloon.style.left = rect.left + "px";
    balloon.style.top = rect.top + "px";
    balloon.style.width = rect.width + "px";
    balloon.style.height = rect.height + "px";
    balloon.classList.add("active");
    overlay.classList.add("active");

    // Animate to center
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        balloon.style.transition = "all 0.8s ease";
        balloon.style.left = (window.innerWidth - targetW) / 2 + "px";
        balloon.style.top = (window.innerHeight - targetH) / 2 + "px";
        balloon.style.width = targetW + "px";
        balloon.style.height = targetH + "px";
      });
    });

    // Unmute video on transition end
    if (item.type === "video") {
      const onEnd = () => {
        media.muted = false;
        const muteBtn = balloon.querySelector(".unmute-btn");
        if (muteBtn) muteBtn.textContent = "\uD83D\uDD0A";
        balloon.removeEventListener("transitionend", onEnd);
      };
      balloon.addEventListener("transitionend", onEnd);
    }
  }

  function balloonDown() {
    if (!currentItem) return;
    hideCaption();
    const source = currentItem.querySelector("img, video");
    const rect = source.getBoundingClientRect();

    const vid = balloon.querySelector("video");
    if (vid) vid.muted = true;

    balloon.style.left = rect.left + "px";
    balloon.style.top = rect.top + "px";
    balloon.style.width = rect.width + "px";
    balloon.style.height = rect.height + "px";

    const onShrink = () => {
      balloon.classList.remove("active");
      clearBalloon();
      overlay.classList.remove("active");
      balloon.removeEventListener("transitionend", onShrink);
    };
    balloon.addEventListener("transitionend", onShrink);

    currentItem = null;
    captionVisible = false;
  }

  // Instant close without animation (for switching between items)
  function balloonDownImmediate() {
    if (!currentItem) return;
    const vid = balloon.querySelector("video");
    if (vid) vid.muted = true;
    balloon.style.transition = "none";
    balloon.classList.remove("active");
    clearBalloon();
    overlay.classList.remove("active");
    currentItem = null;
    captionVisible = false;
  }

  // Click on balloon shows caption
  balloon.addEventListener("click", (e) => {
    if (e.target.closest(".unmute-btn")) return;
    const box = balloon.querySelector(".caption-box");
    if (!box || captionVisible) return;
    box.classList.add("visible");
    captionVisible = true;
  });

  // Click on grid item shows caption directly
  grid.addEventListener("click", (e) => {
    if (currentItem) return;
    const wrapper = e.target.closest(".grid-item");
    if (!wrapper) return;
    const item = ITEMS[wrapper.dataset.index];
    if (!item || !item.caption) return;

    hideCaption();

    let box = wrapper.querySelector(".caption-box");
    if (!box) {
      box = document.createElement("div");
      box.classList.add("caption-box");

      const text = document.createElement("div");
      text.classList.add("caption-text");
      text.textContent = item.caption;
      box.appendChild(text);

      wrapper.appendChild(box);
    }

    requestAnimationFrame(() => {
      box.classList.add("visible");
      captionVisible = true;
    });
  });

  // Caption hides when cursor leaves the grid item
  grid.addEventListener("mouseleave", (e) => {
    const item = e.target.closest(".grid-item");
    if (!item) return;
    const box = item.querySelector(".caption-box.visible");
    if (box) {
      box.classList.remove("visible");
      captionVisible = false;
    }
  }, true);

  // Caption hides when cursor leaves the balloon
  balloon.addEventListener("mouseleave", () => {
    hideCaption();
  });

  // Click anywhere outside balloon dismisses it
  document.addEventListener("mousedown", (e) => {
    if (!currentItem) return;
    if (balloon.contains(e.target)) return;
    balloonDown();
    clearTimeout(hoverTimer);
    clearTimeout(leaveTimer);
  });

  // Desktop: hover to balloon with 2s delay
  let hoveredGridItem = null;
  let cursorOnBalloon = false;

  function startLeaveTimer() {
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => {
      if (cursorOnBalloon) return;
      if (hoveredGridItem && hoveredGridItem === currentItem) return;
      balloonDown();
    }, 1000);
  }

  if (!isMobile) {
    grid.addEventListener("mouseenter", (e) => {
      const item = e.target.closest(".grid-item");
      if (!item) return;
      hoveredGridItem = item;
      // Only cancel leave timer if hovering the SOURCE item of the current balloon
      if (currentItem && item === currentItem) {
        clearTimeout(leaveTimer);
      }
      clearTimeout(hoverTimer);
      if (!currentItem) {
        hoverTimer = setTimeout(() => balloonUp(item), 2000);
      }
    }, true);

    grid.addEventListener("mouseleave", (e) => {
      const item = e.target.closest(".grid-item");
      if (!item) return;
      hoveredGridItem = null;
      clearTimeout(hoverTimer);
      if (currentItem) startLeaveTimer();
    }, true);

    balloon.addEventListener("mouseenter", () => {
      cursorOnBalloon = true;
      clearTimeout(leaveTimer);
    });

    balloon.addEventListener("mouseleave", () => {
      cursorOnBalloon = false;
      startLeaveTimer();
    });
  } else {
    // Mobile: tap to balloon
    grid.addEventListener("click", (e) => {
      const item = e.target.closest(".grid-item");
      if (item) {
        e.preventDefault();
        balloonUp(item);
      }
    });
  }

  // Escape key dismisses
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") balloonDown();
  });
})();
