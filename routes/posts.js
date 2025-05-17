const express = require("express");
const { ObjectId } = require("mongodb");
const { getDb } = require("../config/db");

const router = express.Router();

// GET /entries — get all posts
router.get("/", async (req, res) => {
  try {
    const db = getDb();
    const posts = await db
      .collection("posts")
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    res.status(200).json(posts);
  } catch (err) {
    console.error("GET /entries error:", err);
    res.status(500).json({ message: "Failed to fetch posts." });
  }
});

// POST /entries — add a new post
router.post("/", async (req, res) => {
  try {
    const { title, rating, genre, review, name, isAnonymous, posterUrl } =
      req.body;

    if (!title || !rating) {
      return res
        .status(400)
        .json({ message: "Title and rating are required." });
    }

    const newPost = {
      title,
      rating,
      genre: genre || "",
      review: review || "",
      name: isAnonymous ? "Anonymous" : name || "Anonymous",
      posterUrl: posterUrl || "/images/noposter.png",
      createdAt: new Date(),
    };

    const db = getDb();
    const result = await db.collection("posts").insertOne(newPost);
    res.status(201).json({ _id: result.insertedId, ...newPost });
  } catch (err) {
    console.error("POST /entries error:", err);
    res.status(500).json({ message: "Failed to add post." });
  }
});

// PUT /entries/:id — update a post
router.put("/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const updates = req.body;

    const db = getDb();
    const result = await db
      .collection("posts")
      .findOneAndUpdate(
        { _id: new ObjectId(postId) },
        { $set: updates },
        { returnDocument: "after" }
      );

    if (!result.value) {
      return res.status(404).json({ message: "Post not found." });
    }

    res.status(200).json(result.value);
  } catch (err) {
    console.error("PUT /entries/:id error:", err);
    res.status(500).json({ message: "Failed to update post." });
  }
});

// DELETE /entries/:id — delete a post
router.delete("/:id", async (req, res) => {
  try {
    const postId = req.params.id;

    const db = getDb();
    const result = await db
      .collection("posts")
      .deleteOne({ _id: new ObjectId(postId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Post not found." });
    }

    res.status(200).json({ message: "Post deleted successfully." });
  } catch (err) {
    console.error("DELETE /entries/:id error:", err);
    res.status(500).json({ message: "Failed to delete post." });
  }
});

module.exports = router;
