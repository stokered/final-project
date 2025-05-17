const express = require("express");
const { ObjectId } = require("mongodb");
const { getDb } = require("../config/db");

const router = express.Router();

// GET /entries — get all entries
router.get("/", async (req, res) => {
  try {
    const db = getDb();
    const entries = await db
      .collection("entries")
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    res.status(200).json(entries);
  } catch (err) {
    console.error("GET /entries error:", err);
    res.status(500).json({ message: "Failed to fetch entries." });
  }
});

// POST /entries — add a new entry
router.post("/", async (req, res) => {
  try {
    const { title, rating, genre, review, name, isAnonymous, posterUrl } =
      req.body;

    if (!title || !rating) {
      return res
        .status(400)
        .json({ message: "Title and rating are required." });
    }

    const newEntry = {
      title,
      rating,
      genre: genre || "",
      review: review || "",
      name: isAnonymous ? "Anonymous" : name || "Anonymous",
      posterUrl: posterUrl || "",
      createdAt: new Date(),
    };

    const db = getDb();
    const result = await db.collection("entries").insertOne(newEntry);
    res.status(201).json({ _id: result.insertedId, ...newEntry });
  } catch (err) {
    console.error("POST /entries error:", err);
    res.status(500).json({ message: "Failed to add entry." });
  }
});

// PUT /entries/:id — update an entry
router.put("/:id", async (req, res) => {
  try {
    const entryId = req.params.id;
    const updates = req.body;

    const db = getDb();
    const result = await db
      .collection("entries")
      .findOneAndUpdate(
        { _id: new ObjectId(entryId) },
        { $set: updates },
        { returnDocument: "after" }
      );

    if (!result.value) {
      return res.status(404).json({ message: "Entry not found." });
    }

    res.status(200).json(result.value);
  } catch (err) {
    console.error("PUT /entries/:id error:", err);
    res.status(500).json({ message: "Failed to update entry." });
  }
});

// DELETE /entries/:id — delete an entry
router.delete("/:id", async (req, res) => {
  try {
    const entryId = req.params.id;

    const db = getDb();
    const result = await db
      .collection("entries")
      .deleteOne({ _id: new ObjectId(entryId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Entry not found." });
    }

    res.status(200).json({ message: "Entry deleted successfully." });
  } catch (err) {
    console.error("DELETE /entries/:id error:", err);
    res.status(500).json({ message: "Failed to delete entry." });
  }
});

module.exports = router;
