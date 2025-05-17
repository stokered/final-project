document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popup");
  const commentForm = document.getElementById("comment-form");
  const popupTitle = document.getElementById("popup-title");
  const popupReview = document.getElementById("popup-review");
  const popupName = document.getElementById("popup-name");
  const commentsSection = document.getElementById("comments-section");
  const closePopupBtn = document.getElementById("close-popup");

  let currentEntryId = null;

  // === Load comments for a post ===
  async function loadComments(entryId) {
    const res = await fetch(`/comments/${entryId}`);
    const comments = await res.json();

    commentsSection.innerHTML = "";

    if (comments.length === 0) {
      commentsSection.innerHTML = "<p>No comments yet.</p>";
      return;
    }

    comments.forEach((c) => {
      const div = document.createElement("div");
      div.classList.add("comment");
      div.innerHTML = `
        <p><strong>${c.commenter}</strong></p>
        <p>${c.comment}</p>
      `;
      commentsSection.appendChild(div);
    });
  }

  // === Handle clicking a movie post ===
  document.querySelectorAll(".post-card").forEach((card) => {
    card.addEventListener("click", () => {
      const title = card.querySelector("img").alt;
      const rating = card.querySelector(".rating").textContent;

      currentEntryId = card.dataset.id;

      popupTitle.textContent = title;
      popupReview.textContent = rating;
      popupName.textContent = "";

      popup.classList.remove("hidden");
      loadComments(currentEntryId);
    });
  });

  // === Handle comment submission ===
  commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const comment = commentForm.comment.value.trim();
    const commenter = commentForm.commenter.value.trim();
    const anonymous = commentForm.anonymous.checked;

    if (!comment) return;

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

    if (res.ok) {
      commentForm.reset();
      await loadComments(currentEntryId);
    } else {
      console.error("Failed to post comment.");
    }
  });

  // === Close popup ===
  closePopupBtn.addEventListener("click", () => {
    popup.classList.add("hidden");
  });

  // === Toilet paper rating logic ===
  if (document.querySelector(".rating-select")) {
    document.querySelectorAll(".roll").forEach((roll, index, all) => {
      const container = roll.closest(".rating-select");
      const input = container.querySelector("input[name='rating']");

      roll.addEventListener("mouseenter", () => {
        const val = parseInt(roll.dataset.value);
        all.forEach((r) => {
          r.src =
            parseInt(r.dataset.value) <= val
              ? "/icons/black-toilet-paper.svg"
              : "/icons/greyscale-toilet-paper.svg";
        });
      });

      roll.addEventListener("click", () => {
        const val = parseInt(roll.dataset.value);
        container.dataset.rating = val;
        input.value = val;
      });

      container.addEventListener("mouseleave", () => {
        const locked = parseInt(container.dataset.rating);
        all.forEach((r) => {
          r.src =
            parseInt(r.dataset.value) <= locked
              ? "/icons/black-toilet-paper.svg"
              : "/icons/greyscale-toilet-paper.svg";
        });
      });
    });
  }
});
