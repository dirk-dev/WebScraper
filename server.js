var cheerio = require("cheerio");
var axios = require("axios");

// Make a request via axios to grab the HTML body from the site of your choice
axios.get("http://www.astronomytrek.com/news-events/").then(function(response) {
  // Load the HTML into cheerio and save it to a variable
  // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
  var $ = cheerio.load(response.data);

  // An empty array to save the data that we'll scrape
  var results = [];

  $("div.mh-posts-list-content").each(function(i, element) {
    // console.log(element);
    var title = $(element)
      .children("header")
      .children("h3")
      .children("a")
      .attr("title");
    //   .text();
    var summary = $(element)
      .children("div.mh-posts-list-excerpt")
      .children("div.mh-excerpt")
      .children("p")
      .text();

    // Save these results in an object that we'll push into the results array we defined earlier
    results.push({
      title: title,
      summary: summary
    });
  });

  // Log the results once you've looped through each of the elements found with cheerio
  console.log(results);
});
