document.addEventListener("DOMContentLoaded", () => {
  const TMDB_API_KEY = "98834eb3ecdc28b7dd47a8be7f4306bb";

  // === TMDB AUTOCOMPLETE -- FIX POSTER GRAB AND GENRE GRAB ===
  const searchInput = document.getElementById("movie-search");
  const suggestionsBox = document.getElementById("movie-suggestions");
  const titleInput = document.getElementById("movie-title");
  const genreInput = document.getElementById("movie-genre");
  const yearInput = document.getElementById("movie-year");
  const posterInput = document.getElementById("poster-url");
  const manualFields = document.getElementById("manual-fields");
  const toggleManualBtn = document.getElementById("toggle-manual");

  if (toggleManualBtn) {
    toggleManualBtn.addEventListener("click", () => {
      manualFields.classList.toggle("hidden");
    });
  }

  let debounceTimer;

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim();
      if (query.length < 2) {
        suggestionsBox.innerHTML = "";
        suggestionsBox.classList.add("hidden");
        return;
      }

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchSuggestions(query), 300);
    });
  }

  async function fetchSuggestions(query) {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
      query
    )}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const results = data.results.slice(0, 4);

      suggestionsBox.innerHTML = results
        .map((movie) => {
          const year = movie.release_date
            ? movie.release_date.slice(0, 4)
            : "Unknown";
          return `<li 
            data-title="${movie.title}"
            data-year="${year}"
            data-genre="Unknown"
            data-poster="${movie.poster_path}"
          >${movie.title} (${year})</li>`;
        })
        .join("");

      suggestionsBox.classList.remove("hidden");

      suggestionsBox.querySelectorAll("li").forEach((li) => {
        li.addEventListener("click", () => {
          titleInput.value = li.dataset.title;
          yearInput.value = li.dataset.year;
          genreInput.value = li.dataset.genre;
          posterInput.value = li.dataset.poster
            ? `https://image.tmdb.org/t/p/w500${li.dataset.poster}`
            : "/images/noposter.png";

          searchInput.value = "";
          suggestionsBox.classList.add("hidden");
          manualFields.classList.remove("hidden");
        });
      });
    } catch (err) {
      console.error("TMDB fetch error:", err);
      suggestionsBox.innerHTML = "<li>Failed to fetch movies.</li>";
      suggestionsBox.classList.remove("hidden");
    }
  }

  function showToast(message, duration = 3000) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");
    toast.classList.remove("hidden");

    setTimeout(() => {
      toast.classList.remove("show");
      toast.classList.add("hidden");
    }, duration);
  }

  async function loadComments(entryId) {
    const commentsSection = document.getElementById("comments-section");
    if (!commentsSection) return;

    try {
      const res = await fetch(`/comments/${entryId}`);
      const comments = await res.json();

      commentsSection.innerHTML = comments.length
        ? comments
            .map(
              (c) => `
            <div class="comment">
              <p><strong>${c.commenter}</strong></p>
              <p>${c.comment}</p>
            </div>`
            )
            .join("")
        : "<p>No comments yet.</p>";
    } catch (err) {
      console.error("Failed to load comments:", err);
      commentsSection.innerHTML = "<p>Error loading comments.</p>";
    }
  }

  // === Post Card Clicks
  const popup = document.getElementById("popup");
  const popupTitle = document.getElementById("popup-title");
  const popupReview = document.getElementById("popup-review");
  const popupName = document.getElementById("popup-name");

  function bindCardClick(card) {
    card.addEventListener("click", () => {
      const title = card.querySelector("img").alt;
      const rating = card.querySelector(".rating").textContent;
      const entryId = card.dataset.id;

      if (popupTitle && popupReview && popupName && popup) {
        popupTitle.textContent = title;
        popupReview.textContent = rating;
        popupName.textContent = "";
        popup.classList.remove("hidden");
        loadComments(entryId);
      }
    });
  }

  document.querySelectorAll(".post-card").forEach(bindCardClick);

  const commentForm = document.getElementById("comment-form");
  let currentEntryId = null;

  if (commentForm) {
    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const comment = commentForm.comment.value.trim();
      const commenter = commentForm.commenter.value.trim();
      const anonymous = commentForm.anonymous.checked;

      if (!comment) return;

      try {
        const res = await fetch("/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entryId: currentEntryId,
            comment,
            commenter,
            anonymous,
          }),
        });

        if (!res.ok) throw new Error("Failed to submit comment.");

        commentForm.reset();
        await loadComments(currentEntryId);
      } catch (err) {
        console.error(err);
        showToast("❌ Failed to post comment.");
      }
    });
  }

  const closePopupBtn = document.getElementById("close-popup");
  if (closePopupBtn) {
    closePopupBtn.addEventListener("click", () => {
      popup.classList.add("hidden");
    });
  }

  const submitForm = document.getElementById("submit-form");
  const submitPopup = document.getElementById("submit-popup");

  document.getElementById("add-post")?.addEventListener("click", () => {
    submitPopup?.classList.remove("hidden");
  });

  document
    .getElementById("close-submit-popup")
    ?.addEventListener("click", () => {
      submitPopup?.classList.add("hidden");
    });

  if (submitForm) {
    submitForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(submitForm);
      const payload = Object.fromEntries(formData.entries());

      payload.rating = parseInt(payload.rating);
      payload.isAnonymous = formData.get("isAnonymous") === "on";
      payload.name = payload.isAnonymous
        ? "Anonymous"
        : payload.name || "Anonymous";

      try {
        const res = await fetch("/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Submission failed");
        }

        const newEntry = await res.json();

        const newCard = document.createElement("div");
        newCard.classList.add("post-card");
        newCard.setAttribute("data-id", newEntry._id);
        newCard.innerHTML = `
          <img src="${newEntry.posterUrl}" alt="${newEntry.title}" class="poster" />
          <div class="rating">${newEntry.rating} 🍅</div>
        `;
        document.getElementById("posts-grid").prepend(newCard);
        bindCardClick(newCard);

        submitForm.reset();
        submitPopup.classList.add("hidden");
        showToast("Movie dumped successfully!");
      } catch (err) {
        console.error("Submit error:", err);
        showToast("Failed to submit entry.");
      }
    });
  }
});
