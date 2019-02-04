const expressHandlebars = require("express-handlebars");

let express = require("express");
let cheerio = require("cheerio");
let mongoose = require("mongoose");
let axios = require("axios");

let db = require("./models");

let PORT = 3000;

let app = express();

app.engine("handlebars", expressHandlebars({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

require("./routes/htmlRoutes")(app);

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/webScraper";

//connection to mongo db
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

app.get("/scrape", function(req, res) {
  // drops db when scrape route is run so the data is fresh & there are no dupes
  mongoose.connection.dropDatabase();
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
        result.articleUrl = "https://www.space.com";
        result.articleUrl += $(this)
          .children("p.mod-copy")
          .children("a.read-url")
          .attr("href");

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
      // res.send("Scraping Complete.");
      res.redirect("scraped");
    });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Find all results from the scrapedData collection in the db
  db.Article.find({})
    // Throw any errors to the console
    .then(function(dbArticle) {
      // If any Libraries are found, send them to the clients
      res.json(dbArticle);
      //gives Unhandled Promise Rejection error
      // res.redirect("/test");
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  db.Article.findById(req.params.id)
    .populate("note")
    .then(function(dbPopulate) {
      // If any Libraries are found, send them to the client
      res.json(dbPopulate);
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
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
