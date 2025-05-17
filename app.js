const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const createError = require("http-errors");

const { connectToDatabase } = require("./config/db");
const indexRouter = require("./routes/index");
const entriesRouter = require("./routes/entries");
const commentsRouter = require("./routes/comments"); // MAKE SURE THIS IS AFTER express()

const app = express(); // THIS MUST COME BEFORE app.use()

connectToDatabase().then(() => {
  console.log("DB ready – Express app booting up...");
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/entries", entriesRouter); // Add entries route
app.use("/comments", commentsRouter); // Add comments route

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
