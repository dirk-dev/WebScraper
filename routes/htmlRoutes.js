module.exports = function(app) {
  app.get("/scrape", (req, res) => {
    res.render("scraped");
  });

  app.get("/", (req, res) => {
    res.render("saved_articles");
  });
};
