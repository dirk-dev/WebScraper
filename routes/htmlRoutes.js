module.exports = function(app) {
  app.get("/scraped", (req, res) => {
    res.render("scraped");
  });

  app.get("/", (req, res) => {
    res.render("index");
  });
};
