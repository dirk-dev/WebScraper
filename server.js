let express = require("express");
let cheerio = require("cheerio");
let mongoose = require("mongoose");
let axios = require("axios");

let db = require("./models");

let PORT = 3000;

let app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

//connection to mongo db
mongoose.connect("mongodb://localhost/webScraper", { useNewUrlParser: true });

app.get("/scrape", function(req, res) {
  // Make a request via axios to grab the HTML body from the site of your choice
  axios
    .get("https://www.space.com/science-astronomy/")
    .then(function(response) {
      // Load the HTML into cheerio and save it to a letiable
      // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
      let $ = cheerio.load(response.data);

      let result = {};

      $("div.list-text").each(function(i, element) {
        // console.log(element);
        result.title = $(this)
          .children("h2")
          .children("a")
          .text()
          //strips out extra spaces before/after the content
          .replace(/\s\s+/g, "");
        result.summary = $(this)
          .children("p.mod-copy")
          .text()
          .replace(/\s\s+/g, "")
          .replace("Read More", "");

        // Create a new Article using the `result` object built from scraping
        db.Article.create(result)
          .then(function(dbArticle) {
            // View the added result in the console
            console.log("dbArticle", dbArticle);
          })
          .catch(function(err) {
            // If an error occurred, log it
            console.log(err);
          });
      });
      res.send("Scrape Complete");
    });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  // Find all results from the scrapedData collection in the db
  db.Article.find()
    // Throw any errors to the console
    .then(function(dbPopulate) {
      // If any Libraries are found, send them to the client with any associated Books
      res.json(dbPopulate);
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // TODO
  // ====
  // Finish the route so it finds one article using the req.params.id,
  // and run the populate method with "note",
  // then responds with the article with the note included
  db.Article.findById(req.params.id)
    .populate("note")
    .then(function(dbPopulate) {
      // If any Libraries are found, send them to the client with any associated Books
      res.json(dbPopulate);
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // TODO
  // ====
  // save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" property with the _id of the new note
  db.Note.create(req.body)
    .then(function(dbPopulate) {
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { note: dbPopulate._id } },
        { new: true }
      );
    })
    .then(function(dbPopulate) {
      // If the Library was updated successfully, send it back to the client
      res.json(dbPopulate);
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
