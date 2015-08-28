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
    .get(function(req, res, next) {
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

  // GET Post by objectID
  apiRouter.route('/posts/:id')
    .get(function(req, res, next) {
      Post.findById(req.params.id, function(err, post) {
        if (err) res.status(400).send({ message: 'Post not found.' });

        res.send(post);
      });
    })

    .delete(function(req, res, next) {
      Post.remove({ _id: req.params.id }, function(err) {
        if (err) res.status(409).send({ message: err });

        // Delete post
        res.status(200).send({ message: 'success' });
      });
    });

  // Make sure we return the router! Otherwise we can't use it in server.js
  return apiRouter;

};