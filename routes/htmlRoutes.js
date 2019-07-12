module.exports = function(app) {
  app.get("/scrape-route", (req, res) => {
    res.render("scraped");
  });

  app.get("/", (req, res) => {
    res.render("saved_articles");
  });
};
