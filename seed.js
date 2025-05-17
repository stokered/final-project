const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://dbAdmin:miss0uri@final-project.k0cbwib.mongodb.net/final-project?retryWrites=true&w=majority&appName=Final-Project";

const client = new MongoClient(uri);

async function seed() {
  try {
    await client.connect();
    const db = client.db("final-project");
    const posts = db.collection("posts");

    const sharedPoster = "/images/paris.jpg"

    const sampleMovies = [
      {
        title: "Cats (2019)",
        rating: 5,
        genre: "Musical",
        review: "I had to apologize to my own eyes.",
        name: "Theater Victim",
        posterUrl: sharedPoster,
        anonymous: true,
        createdAt: new Date(),
      },
      {
        title: "The Room",
        rating: 5,
        genre: "Drama",
        review: "I laughed, I cried, I screamed. But mostly cried.",
        name: "Lisa",
        posterUrl: sharedPoster,
        anonymous: false,
        createdAt: new Date(),
      },
      {
        title: "Movie 43",
        rating: 4,
        genre: "Comedy",
        review: "Like 14 bad SNL sketches stapled together.",
        name: "Film Student",
        posterUrl: sharedPoster,
        anonymous: true,
        createdAt: new Date(),
      },
      {
        title: "The Last Airbender",
        rating: 5,
        genre: "Action",
        review: "This movie owes the cartoon an apology.",
        name: "Appa",
        posterUrl: sharedPoster,
        anonymous: true,
        createdAt: new Date(),
      },
    ];

    const result = await posts.insertMany(sampleMovies);
    console.log(`Inserted ${result.insertedCount} dummy posts!`);
  } catch (e) {
    console.error("Error inserting dummy data:", e);
  } finally {
    await client.close();
  }
}

seed();
