const expressHandlebars = require("express-handlebars");

let express = require("express");
let cheerio = require("cheerio");
let mongoose = require("mongoose");
let axios = require("axios");

let db = require("./models");

let PORT = process.env.PORT || 3000;

let app = express();

app.engine("handlebars", expressHandlebars({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

require("./routes/htmlRoutes")(app);

// connection info for deployed app/development
let MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/webScraper";

//connection to mongo db
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

app.get("/scrape-route", function(req, res) {
  // THIS DOES NOT FIRE
  // Make a request via axios to grab the HTML body

  axios
    .get("https://www.space.com/science-astronomy/")
    .then(function(response) {
      let $ = cheerio.load(response.data);

      let result = {};
      // scraping function - steps down through HTML elements to get desired items
      $("div.list-text").each(function(i, element) {
        console.log(element);
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
        result.articleUrl = "https://www.space.com";
        result.articleUrl += $(this)
          .children("p.mod-copy")
          .children("a.read-url")
          .attr("href");

        // Create a new Article using the `result` object built from scraping
        db.Article.create(result)

          .then(function(dbArticle) {
            // View the added result in the console
            // console.log("dbArticle", dbArticle);
          })
          .catch(function(err) {
            // If an error occurred, log it
            console.log(err);
          });
      });
      // res.send("Scraping Complete.");
      res.redirect("scrape");
    });
});

// PUT route for changing an article to 'isSaved: true'
app.put("/submit", function(req, res) {
  // console.log("line 77", req.body);
  db.Article.findOneAndUpdate(
    { _id: req.body.thisId },
    { $set: { isSaved: true } },
    { new: true }
  ).then(function(dbArticle) {
    console.log(dbArticle);
    res.json("true");
  });
});

// PUT route for deleting article out of saved articles
app.put("/delete", function(req, res) {
  // console.log("line 91", req.body);
  db.Article.findOneAndUpdate(
    { _id: req.body.thisId },
    { $set: { isSaved: false } },
    { new: true }
  ).then(function(dbArticle) {
    console.log(dbArticle);
    res.json("true");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Find all results from the scrapedData collection in the db
  db.Article.find({})
    // Throw any errors to the console
    .then(function(dbArticle) {
      res.json(dbArticle);
      //gives Unhandled Promise Rejection error
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for getting all NOTES from the db
app.get("/notes", function(req, res) {
  // Find all results from the scrapedData collection in the db
  db.Note.find({})
    .then(function(dbNote) {
      res.json(dbNote);
      //gives Unhandled Promise Rejection error
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with its note
app.get("/articles/:id", function(req, res) {
  db.Article.findById(req.params.id)
    .populate("notes")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      console.log("line 144", req.params.id);
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { notes: dbNote._id } },
        { new: true }
      );
    })
    .then(function(dbArticle) {
      console.log("server.js line 152", dbArticle);
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for deleting an Article's associated Note
app.put("/articles/:id", function(req, res) {
  db.Note.findOneAndRemove(req.body)

    .then(function(dbNote) {
      console.log("server.js line 172", dbNote);
      res.json(dbNote);
    })
    .catch(function(err) {
      res.json(err);
    });
});

/*
// DELETE route for deleting a note
app.put("/deletenote", function(req, res) {
  // console.log("line 91", req.body);
  db.Note.create(req.body)
    .then(function(dbNote) {
      console.log("line 165", req.params.id);
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { notes: dbNote._id } },
        { new: true }
      );
    })
    .then(function(dbArticle) {
      console.log("server.js line 154", dbArticle);
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});
*/

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
