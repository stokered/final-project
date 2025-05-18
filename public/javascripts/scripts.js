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

toggleManualBtn?.addEventListener("click", () => {
  const isVisible = manualFields.classList.contains("show");

  manualFields.classList.toggle("show", !isVisible);
  manualFields.classList.toggle("hidden", isVisible); // hide only if visible

  // === COME BACK TO THIS::: manual entry toggled onto "hide fields" ???? 
  toggleManualBtn.textContent = isVisible
    ? "Add Manually"
    : "Hide Manual Fields";
});


  
  
  

  // === THUMBS RATING ===
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




  // === INIT RATING DISPLAY FOR EXISTING POSTS ===
  document.querySelectorAll(".rating-thumbs").forEach((div) => {
    const rating = parseInt(div.dataset.rating, 10) || 0;
    renderThumbs(div, rating);
  });





  // === SEARCH AUTOCOMPLETE ===
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
          return `<li data-title="${movie.title}" data-year="${year}" data-genre="Unknown" data-poster="${poster}">${movie.title} (${year})</li>`;
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






  // === MODALS ===
  document.getElementById("add-post")?.addEventListener("click", () => {
    submitPopup.classList.remove("hidden");
  });

  document
    .getElementById("close-submit-popup")
    ?.addEventListener("click", () => {
      submitPopup.classList.add("hidden");
    });

  document.getElementById("close-popup")?.addEventListener("click", () => {
    popup.classList.add("hidden");
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






  // === SUBMIT FORM ===
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

      const card = document.createElement("div");
      card.className = "post-card";
      card.dataset.id = newEntry._id;
      card.dataset.title = newEntry.title;
      card.dataset.review = newEntry.review;
      card.dataset.name = newEntry.name;
      card.dataset.year = newEntry.year || "Unknown";
      card.dataset.genre = newEntry.genre || "Unknown";
      card.dataset.poster = newEntry.posterUrl || "/images/noposter.png";
      card.dataset.rating = newEntry.rating;

      card.innerHTML = `
        <img src="${newEntry.posterUrl}" alt="${newEntry.title}" class="poster" />
        <div class="title">${newEntry.title}</div>
        <div class="rating-thumbs" data-rating="${newEntry.rating}"></div>
      `;

      document.getElementById("posts-grid").prepend(card);
      renderThumbs(card.querySelector(".rating-thumbs"), newEntry.rating);
      bindCardClick(card);
      submitForm.reset();
      highlightThumbs(0);
      manualFields.classList.add("hidden");
      toggleManualBtn.textContent = "Add Manually";
      submitPopup.classList.add("hidden");
      showToast("🎬 Movie dumped successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to submit movie.");
    }
  });

  // === POST CARD POPUP ===
  function bindCardClick(card) {
    card.addEventListener("click", () => {
      document.getElementById("popup-title").textContent = card.dataset.title;
      document.getElementById(
        "popup-year"
      ).textContent = `(${card.dataset.year})`;
      document.getElementById("popup-genre").textContent = card.dataset.genre;
      document.getElementById("popup-review").textContent = card.dataset.review;
      document.getElementById(
        "popup-name"
      ).textContent = `🗣️ ${card.dataset.name}`;
      document.getElementById("popup-poster").src = card.dataset.poster;
      renderThumbs(
        document.getElementById("popup-rating"),
        parseInt(card.dataset.rating)
      );
      popup.classList.remove("hidden");
      loadComments(card.dataset.id);
    });
  }

  document.querySelectorAll(".post-card").forEach(bindCardClick);






  // === COMMENTS ===
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
    const entryId =
      document.querySelector("#popup .post-card")?.dataset.id ||
      document.querySelector(".post-card[data-id]")?.dataset.id;
    if (!comment || !entryId) return;

    try {
      const res = await fetch("/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, comment, commenter, anonymous }),
      });
      if (!res.ok) throw new Error("Comment failed");
      commentForm.reset();
      loadComments(entryId);
    } catch (err) {
      console.error(err);
      showToast("Failed to post comment.");
    }
  });





  // === TOAST ===
  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }
});
