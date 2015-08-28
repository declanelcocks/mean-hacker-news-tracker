var mongoose    = require('mongoose');
var Schema      = mongoose.Schema;

var postSchema = new Schema({
  objectID: { type: Number, unique: true },
  created_at: { type: Date },
  title: { type: String },
  author: { type: String },
  url: { type: String }
});

// This index allows us to sort by date when querying
// It needs to be defined in the Schema, or we can't use it!
postSchema.index({ "created_at": 1 });

module.exports = mongoose.model('Post', postSchema);