document.addEventListener("DOMContentLoaded", () => {
  const TMDB_API_KEY = "98834eb3ecdc28b7dd47a8be7f4306bb";

  const searchInput = document.getElementById("movie-search");
  const suggestionsBox = document.getElementById("movie-suggestions");
  const titleInput = document.getElementById("movie-title");
  const yearInput = document.getElementById("movie-year");
  const genreInput = document.getElementById("movie-genre");
  const posterInput = document.getElementById("poster-url");
  const posterPreview = document.getElementById("poster-preview");
  const manualFields = document.getElementById("manual-fields");
  const toggleManualBtn = document.getElementById("toggle-manual");
  const popup = document.getElementById("popup");
  const submitPopup = document.getElementById("submit-popup");
  const submitForm = document.getElementById("submit-form");
  const commentForm = document.getElementById("comment-form");
  const commentName = document.getElementById("comment-name");
  const checkbox = document.getElementById("checkbox");
  const submitCheckbox = document.getElementById("submit-checkbox");
  const submitName = document.getElementById("submit-name");
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobile-menu");
  const closeBtn = document.getElementById("close-mobile-menu");
  const introPopup = document.getElementById("intro-popup");
  const genreFilters = document.querySelectorAll(".genre-filter");
  const sortFilters = document.querySelectorAll(".sort-filter");

  const genreMap = {};
  let allPosts = [];

  // === FETCH GENRES + AUTOCOMPLETE ===
  (async () => {
    const res = await fetch(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`
    );
    const data = await res.json();
    data.genres.forEach((genre) => {
      genreMap[genre.id] = genre.name;
    });

    let debounceTimer;
    searchInput?.addEventListener("input", () => {
      const query = searchInput.value.trim();
      if (query.length < 2) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchSuggestions(query), 300);
    });

    async function fetchSuggestions(query) {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
            query
          )}`
        );
        const data = await res.json();
        const results = data.results.slice(0, 4);

        suggestionsBox.innerHTML = results
          .map((movie) => {
            const year = movie.release_date?.slice(0, 4) || "Unknown";
            const poster = movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : "/images/noposter.png";
            const genreNames =
              (movie.genre_ids || [])
                .map((id) => genreMap[id])
                .filter(Boolean)
                .join(", ") || "Unknown";

            return `<li data-title="${movie.title}" data-year="${year}" data-genre="${genreNames}" data-poster="${poster}">${movie.title} (${year})</li>`;
          })
          .join("");

        suggestionsBox.classList.remove("hidden");

        suggestionsBox.querySelectorAll("li").forEach((li) => {
          li.addEventListener("click", () => {
            titleInput.value = li.dataset.title;
            yearInput.value = li.dataset.year;
            genreInput.value = li.dataset.genre;
            posterInput.value = li.dataset.poster;
            posterPreview.src = li.dataset.poster;
            suggestionsBox.classList.add("hidden");
            manualFields.classList.remove("hidden");
            toggleManualBtn.textContent = "Hide Manual Fields";
          });
        });
      } catch (err) {
        console.error("TMDB fetch error:", err);
      }
    }
  })();

  introPopup?.addEventListener("click", () => {
    introPopup.classList.add("hidden");
  });

  // === MENU TOGGLE ===
  hamburger?.addEventListener("click", () => {
    mobileMenu.classList.remove("hidden");
    mobileMenu.classList.add("show");
  });

  closeBtn?.addEventListener("click", () => {
    mobileMenu.classList.add("hidden");
    mobileMenu.classList.remove("show");
  });

  const initialPostEls = document.querySelectorAll(".post-card");
  initialPostEls.forEach((el) => {
    const post = {
      _id: el.dataset.id,
      title: el.dataset.title,
      review: el.dataset.review,
      name: el.dataset.name,
      year: el.dataset.year,
      genre: el.dataset.genre,
      posterUrl: el.dataset.poster,
      rating: parseInt(el.dataset.rating, 10),
    };
    allPosts.push(post);
  });

  genreFilters.forEach((filter) =>
    filter.addEventListener("change", () => renderPosts(allPosts))
  );
  sortFilters.forEach((filter) =>
    filter.addEventListener("change", () => renderPosts(allPosts))
  );

  function renderPosts(posts) {
    const grid = document.getElementById("posts-grid");
    grid.innerHTML = "";

    const selectedGenre =
      [...genreFilters].find((el) => el.offsetParent !== null)?.value || "";
    const sortBy =
      [...sortFilters].find((el) => el.offsetParent !== null)?.value || "";

    console.log("Genre filter:", selectedGenre);
    console.log("Sort filter:", sortBy);

    let filtered = [...posts];

    if (selectedGenre) {
      filtered = filtered.filter((p) =>
        p.genre?.toLowerCase().includes(selectedGenre.toLowerCase())
      );
    }

    if (sortBy === "recent") {
      filtered.sort((a, b) => b._id.localeCompare(a._id));
    } else if (sortBy === "worst") {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "most") {
      const countMap = {};
      filtered.forEach((p) => {
        const key = p.title.toLowerCase();
        countMap[key] = (countMap[key] || 0) + 1;
      });
      filtered.sort((a, b) => {
        const countA = countMap[a.title.toLowerCase()];
        const countB = countMap[b.title.toLowerCase()];
        return countB - countA;
      });
    }

    filtered.forEach((post) => {
      const card = document.createElement("div");
      card.className = "post-card";
      card.dataset.id = post._id;
      card.dataset.title = post.title;
      card.dataset.review = post.review;
      card.dataset.name = post.name;
      card.dataset.year = post.year;
      card.dataset.genre = post.genre;
      card.dataset.poster = post.posterUrl;
      card.dataset.rating = post.rating;

      card.innerHTML = `
        <img src="${post.posterUrl}" alt="${post.title}" class="poster" />
        <div class="title">${post.title}</div>
        <div class="rating-thumbs" data-rating="${post.rating}"></div>
      `;
      renderThumbs(card.querySelector(".rating-thumbs"), post.rating);
      bindCardClick(card);
      grid.appendChild(card);
    });

    console.log("Rendered", filtered.length, "posts");
  }

  renderPosts(allPosts);

  const thumbs = document.querySelectorAll("#thumb-rating .thumb");
  const ratingInput = document.getElementById("rating-value");
  let selectedRating = 0;

  thumbs.forEach((thumb, idx) => {
    thumb.addEventListener("mouseover", () => highlightThumbs(idx + 1));
    thumb.addEventListener("mouseout", () => highlightThumbs(selectedRating));
    thumb.addEventListener("click", () => {
      selectedRating = idx + 1;
      ratingInput.value = selectedRating;
      highlightThumbs(selectedRating);
    });
  });

  function highlightThumbs(num) {
    thumbs.forEach((thumb, i) => {
      thumb.src =
        i < num ? "/images/onclickthumb.png" : "/images/thumbsdown.png";
    });
  }

  function renderThumbs(container, rating) {
    container.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
      const img = document.createElement("img");
      img.src =
        i <= rating ? "/images/onclickthumb.png" : "/images/thumbsdown.png";
      img.classList.add("thumb-display");
      container.appendChild(img);
    }
  }

  function bindCardClick(card) {
    card.addEventListener("click", () => {
      document.getElementById("popup-title").textContent = card.dataset.title;
      document.getElementById("popup-year").textContent = card.dataset.year;
      document.getElementById("popup-genre").textContent = card.dataset.genre;
      document.getElementById("popup-review").textContent = card.dataset.review;
      document.getElementById(
        "popup-name"
      ).innerHTML = `<span class="post-label">Posted by:</span> ${card.dataset.name}`;
      document.getElementById("popup-poster").src = card.dataset.poster;
      renderThumbs(
        document.getElementById("popup-rating"),
        parseInt(card.dataset.rating)
      );
      popup.dataset.entryId = card.dataset.id;
      popup.classList.remove("hidden");
      loadComments(card.dataset.id);
    });
  }

  document.getElementById("close-popup")?.addEventListener("click", () => {
    popup.classList.add("hidden");
  });

  document
    .getElementById("close-submit-popup")
    ?.addEventListener("click", () => {
      submitPopup.classList.add("hidden");
    });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      popup.classList.add("hidden");
      submitPopup.classList.add("hidden");
    }
  });

  window.addEventListener("click", (e) => {
    if (e.target === popup) popup.classList.add("hidden");
    if (e.target === submitPopup) submitPopup.classList.add("hidden");
  });

  document.querySelectorAll("#add-post-mobile, .add-post").forEach((btn) => {
    btn.addEventListener("click", () => {
      submitPopup.classList.remove("hidden");
      if (mobileMenu?.classList.contains("show")) {
        mobileMenu.classList.remove("show");
        mobileMenu.classList.add("hidden");
      }
      submitForm.reset();
      highlightThumbs(0);
      manualFields.classList.add("hidden");
      toggleManualBtn.textContent = "Add Manually";
      posterPreview.src = "/images/noposter.png";
      posterInput.value = "/images/noposter.png";
      toggleNameField(submitCheckbox, submitName);
    });
  });

  toggleManualBtn?.addEventListener("click", () => {
    const isVisible = manualFields.classList.contains("show");
    manualFields.classList.toggle("show", !isVisible);
    manualFields.classList.toggle("hidden", isVisible);
    toggleManualBtn.textContent = isVisible
      ? "Add Manually"
      : "Hide Manual Fields";
  });

  function toggleNameField(checkboxEl, nameFieldEl) {
    if (checkboxEl.checked) {
      nameFieldEl.classList.add("hidden");
    } else {
      nameFieldEl.classList.remove("hidden");
    }
  }

  toggleNameField(checkbox, commentName);
  toggleNameField(submitCheckbox, submitName);
  checkbox.addEventListener("change", () =>
    toggleNameField(checkbox, commentName)
  );
  submitCheckbox.addEventListener("change", () =>
    toggleNameField(submitCheckbox, submitName)
  );

  async function loadComments(entryId) {
    const section = document.getElementById("comments-section");
    if (!section) return;
    try {
      const res = await fetch(`/comments/${entryId}`);
      const comments = await res.json();
      section.innerHTML = comments.length
        ? comments
            .map(
              (c) =>
                `<div class="comment"><p><strong>${c.commenter}</strong></p><p>${c.comment}</p></div>`
            )
            .join("")
        : "<p>No comments yet.</p>";
    } catch {
      section.innerHTML = "<p>Error loading comments.</p>";
    }
  }

  commentForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const comment = commentForm.comment.value.trim();
    const commenter = commentForm.commenter.value.trim();
    const anonymous = commentForm.anonymous.checked;
    const entryId = popup.dataset.entryId;
    if (!comment || !entryId) return;

    try {
      const res = await fetch("/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, comment, commenter, anonymous }),
      });
      if (!res.ok) throw new Error("Comment failed");
      commentForm.reset();
      toggleNameField(checkbox, commentName);
      loadComments(entryId);
    } catch (err) {
      console.error(err);
      showToast("Failed to post comment.");
    }
  });

  submitForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(submitForm);
    const payload = Object.fromEntries(formData.entries());
    payload.rating = parseInt(payload.rating, 10) || 0;
    payload.name = formData.get("isAnonymous")
      ? "Anonymous"
      : payload.name || "Anonymous";

    try {
      const res = await fetch("/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Submit failed");
      const newEntry = await res.json();
      allPosts.unshift(newEntry);
      renderPosts(allPosts);
      submitForm.reset();
      highlightThumbs(0);
      manualFields.classList.add("hidden");
      toggleManualBtn.textContent = "Add Manually";
      posterPreview.src = "/images/noposter.png";
      posterInput.value = "/images/noposter.png";
      toggleNameField(submitCheckbox, submitName);
      submitPopup.classList.add("hidden");
      showToast("🎬 Movie dumped successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to submit movie.");
    }
  });

  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }
});

// FLAME ANIMATION
gsap.to(".flame-anim", {
  keyframes: [
    { y: "-3px", rotation: 1.5, duration: 0.1 },
    { y: "3px", rotation: -2, duration: 0.15 },
    { y: "-2px", rotation: 1, duration: 0.1 },
    { y: "2px", rotation: -1, duration: 0.1 },
    { y: "-1px", rotation: 2, duration: 0.1 },
    { y: "1px", rotation: -2, duration: 0.1 },
  ],
  repeat: -1,
  ease: "sine.inOut",
});
