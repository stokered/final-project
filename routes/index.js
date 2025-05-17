const express = require("express");
const router = express.Router();
const { getDb } = require("../config/db");

router.get("/", async function (req, res) {
  try {
    const db = getDb();
    const posts = await db.collection("posts").find().toArray();

    res.render("index", {
      title: "🍅 Public Archive of Bad Movies",
      posts,
    });
  } catch (err) {
    console.error("Failed to load posts:", err);
    res.status(500).render("error", {
      message: "Could not load posts.",
      error: err,
    });
  }
});

router.get("/submit", (req, res) => {
  res.render("submit", { title: "Dump a Movie" });
});


module.exports = router;
