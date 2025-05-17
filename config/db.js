const { MongoClient, ServerApiVersion } = require("mongodb");

const uri =
  "mongodb+srv://dbAdmin:miss0uri@final-project.k0cbwib.mongodb.net/final-project?retryWrites=true&w=majority&appName=Final-Project";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db = null;

async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db("final-project");
    console.log("MongoDB connected to 'final-project'!");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

function getDb() {
  if (!db) {
    throw new Error("Database not connected yet.");
  }
  return db;
}

module.exports = {
  connectToDatabase,
  getDb,
};
