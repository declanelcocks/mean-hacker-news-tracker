var MongoClient = require('mongodb').MongoClient;
var config      = require('./config');
var apiEndpoint = 'http://hn.algolia.com/api/v1/search_by_date?query=nodejs&attributesToRetrieve=created_at,title,url,author,story_title,story_url';
var request     = require('request');
var async       = require('async');

var data = null;

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
    var title; var url;
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

async.waterfall([
  // Fn: GET the data from the Hacker News API
  // Cb: Pass the array of posts onto the next function
  function(callback) {
    // apiEndpoint is a request to the API for the 20 most recent posts from HN
    request.get(apiEndpoint, function(error, response, body) {
      var data;
      if (!error && response.statusCode == 200) {
        data = JSON.parse(body);
        return callback(null, data.hits);
      }
      callback(error || response);
    });
  },
  // data: An array of posts to insert into our database
  // Fn: Take the array of psots and create a JavaScript object for each post
  // Cb: Send this array of objects back out of the waterfall
  function(data, callback) {
    var posts = convertToPostObj(data);
    callback(null, posts);
  }
],
// result: An array of post objects ready to insert into the datbase
function (err, result) {
  if (err) {
    console.log(err);
  } else {
    // Connect to the database using node-mongodb
    // This could also be achieved using mongoose, but I was already using this in server.js
    // so decided to try out a new method for comparison
    MongoClient.connect(config.db, function(err, db) {
      // Error
      if (err) {
        console.log(err);
      }
      // Success
      console.log('Connected to database.');
      // Insert the data to a new collection called 'posts'
      db.collection('posts').insert(result, function(err, result) {
        // Error
        if (err || !result) {
          console.log(err);
          db.close();
        }
        // Success
        console.log('Success.');
        db.close();
      });
    });
  }
});
