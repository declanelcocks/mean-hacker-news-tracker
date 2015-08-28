var mongoose      = require('mongoose');
var express       = require('express');
var path          = require('path');
var logger        = require('morgan');
var cookieParser  = require('cookie-parser');
var bodyParser    = require('body-parser');
var request       = require('request');
var cron          = require('cron');
var async         = require('async');
var moment        = require('moment');
var apiEndpoint   = 'http://hn.algolia.com/api/v1/search_by_date?query=nodejs&attributesToRetrieve=created_at,title,url,author,story_title,story_url';
var Post          = require('./app/models/post');
var config        = require('./config');

// Initialize the Express server
var app = express();

// View engine setup to render Jade templates
app.set('views', path.join(__dirname, 'public/views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to our MongoDB using Mongoose to make using the DB easy!
mongoose.connect(config.db);

// API routes
var apiRoutes = require('./app/routes/api')(app, express);
app.use('/api', apiRoutes);

// Frontend
app.get('/', function(req, res) {
  res.render('index');
});

// Routing to handle rendering the Jade templates
// Inside Angular our 'templateUrl' will be 'partials/something'
// We will send back a rendered HTML page of whatever Angular requests
app.get('/partials/:name', function (req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
});

// Check the validity of the post attributes from Hacker News
// Attributes are either null or as blank strings
function isValid(attr) {
  if (attr === null || attr === '') {
    return false;
  } 
  return true;
};

// Remove any invalid posts (according to isValid) from the array of posts
function removeInvalidPosts(data) {
  for (var i = 0; i < data.length; i++) {
    // Check for a useable title
    if ( !isValid(data[i].title) && !isValid(data[i].story_title) ) {
      data.splice(i--, 1);
    }
    // Check for a useable URL
    if ( !isValid(data[i].url) && !isValid(data[i].story_url) ) {
      data.splice(i--, 1);
    }
  }
};

// Convert the array of posts to a JavaScript object to insert into our database
// For some reason, when logging the posts from Hacker News to console
// the array would be received as a String such as 'hits: [posts]' instead
// of as an actual object we can insert into the database
function convertToPostObj(data) {
  var posts = [];

  // Remove any invalid posts before we do anything with them!
  removeInvalidPosts(data);

  for (var i = 0; i < data.length; i++) {
    var title;
    var url;
    var date = new Date(data[i].created_at);

    if ( isValid(data[i].story_title) ) {
      title = data[i].story_title;
    } else {
      title = data[i].title;
    }
    if ( isValid(data[i].story_url) ) {
      url = data[i].story_url;
    } else {
      url = data[i].url;
    }

    var post = {
      objectID: data[i].objectID,
      created_at: date,
      title: title,
      author: data[i].author,
      url: url
    };

    posts.push(post);
  }
  return posts;
};

// Check for new posts from Hacker News
function updatePosts() {
  async.waterfall([
    // Fn: Find the most recent post in our database
    // Cb: Send date as an Epoch number which can be used on the Hacker News API
    function(callback) {
      Post.find({}).sort({ "created_at" : -1 })
        .limit(1)
        .exec(function(error, result) {
          if(error) callback(error);
          var date = moment(result[0].created_at).unix();
          callback(null, date);
        });
    },
    // date: Date of the most recent post in our database
    // Fn: Run query to HN API for any posts since `date`
    // Cb: Send the date of our most recent post & the results of the API request
    function(date, callback) {
      // Run query to API for any posts since then
      var apiRequest = apiEndpoint + '&numericFilters=created_at_i>' + date;
      request.get(apiRequest, function(error, response, body) {
        var data;
        if (!error && response.statusCode == 200) {
          data = JSON.parse(body);
          return callback(null, date, data);
        }
        callback(error || response);
      });
    },
    // date: Date of the most recent post in our database
    // results: The results of the API request which checked if there were any posts newer than our most recent post.
    // Fn: Check the number of hits for the API request to see if there are any new posts
    //  No new posts: Exit out of the function
    //  New posts: 
    //  - Send a request to the API which displays all of the hits on one page
    //      This is not very efficient as we are sending two requests for the same data, and I
    //      would have preferred to do some sort of loop to loop through all the pages, but that
    //      would also have required more than one API request. So, this is something to be improved.
    //  - Parse the results and convert it to a set of valid posts that we can insert to the database
    //  - Send these posts to the final function
    function(date, results, callback) {
      // No new posts
      if (results.nbHits === 0) {
        callback(null, 'done');
      }
      // New posts
      var apiRequest = apiEndpoint + '&numericFilters=created_at_i>' + date + '&hitsPerPage=' + results.nbHits;
      request.get(apiRequest, function(error, response, body) {
        var data;
        if (!error && response.statusCode == 200) {
          data = JSON.parse(body);
          var posts = convertToPostObj(data.hits);
          callback(null, posts);
        }
        callback(error || response);
      });
    }
  ],
  // result: 
  // - Array of posts ready to insert into our database OR
  // - A message to simply say 'done' (This would be changed to something else, but for readability it's ok as it is)
  function (error, result) {
    if (error) {
      console.log(error);
    } else {
      // `time` will hold the current time so that we can print a timestamp every time the cron does the task
      var time = new Date();
      if (result === 'done') {
        console.log(time + ' - ' + 'No new posts.');
      } else {
        // Using Mongoose's .create() method to bulk insert into the database
        Post.create(result, function(err, response) {
          if (err) console.log(err);
          console.log(time + ' - ' + response.length + ' posts created.');
        });
      };
    }
  });

};

// Here's a list of basic cron times incase you forget what all those *'s mean
// '* * * * * *'        - runs every second
// '*/5 * * * * *'      - runs every 5 seconds
// '10,20,30 * * * * *' - run at 10th, 20th and 30th second of every minute
// '0 * * * * *'        - runs every minute
// '0 0 * * * *'        - runs every hour (at 0 minutes and 0 seconds)
var cronJob = cron.job('0 * * * * *', function(){
  updatePosts();
});

// Send the cron to work
cronJob.start();

// Launch the server
app.listen(config.port);
console.log('Running on port ' + config.port);