var bodyParser    = require('body-parser');
var mongoose      = require('mongoose');
var Post          = require('../models/post');

module.exports = function(app, express) {

  // Create an instance of Express Router
  var apiRouter = express.Router();

  // Test Route
  apiRouter.get('/', function(req, res) {
    res.json({ message: 'Welcome to the best api ever!' }); 
  });

  // GET all Posts
  apiRouter.route('/posts')
    .get(function(req, res, ext) {

      // Use Post's index to sort posts by date when fetching all
      Post.find({}).sort({ "created_at" : -1 })
        // Use this limit to limit the query for the front end
        // We can use this limit to deal with pagination in the future
        // .limit(20)
        .exec(function(err, posts) {
          if (err) return(err);
          res.send(posts);
        })

    });

  // Make sure we return the router! Otherwise we can't use it in server.js
  return apiRouter;

};