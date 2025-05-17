const express = require("express");
const { ObjectId } = require("mongodb");
const { getDb } = require("../config/db");

const router = express.Router();

// GET /comments/:entryId — Get all comments for a specific entry
router.get("/:entryId", async (req, res) => {
  try {
    const db = getDb();
    const entryId = req.params.entryId;

    const comments = await db
      .collection("comments")
      .find({ entryId: new ObjectId(entryId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(comments);
  } catch (err) {
    console.error("GET /comments/:entryId error:", err);
    res.status(500).json({ message: "Failed to fetch comments." });
  }
});

// POST /comments — Add a new comment
router.post("/", async (req, res) => {
  try {
    const { entryId, comment, commenter, anonymous } = req.body;

    if (!entryId || !comment) {
      return res
        .status(400)
        .json({ message: "entryId and comment are required." });
    }

    const newComment = {
      entryId: new ObjectId(entryId),
      comment,
      commenter: anonymous ? "Anonymous" : commenter || "Anonymous",
      createdAt: new Date(),
    };

    const db = getDb();
    const result = await db.collection("comments").insertOne(newComment);

    res.status(201).json({ _id: result.insertedId, ...newComment });
  } catch (err) {
    console.error("POST /comments error:", err);
    res.status(500).json({ message: "Failed to add comment." });
  }
});

module.exports = router;
