document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".post-card").forEach((card) => {
    card.addEventListener("click", () => {
      const title = card.querySelector("img").alt;
      const rating = card.querySelector(".rating").textContent;

      document.getElementById("popup-title").textContent = title;
      document.getElementById("popup-review").textContent =
        "Loading full review..."; // update later
      document.getElementById("popup-name").textContent = "";

      document.getElementById("popup").classList.add("visible");
    });
  });

  document.getElementById("close-popup").addEventListener("click", () => {
    document.getElementById("popup").classList.remove("visible");
  });
});
