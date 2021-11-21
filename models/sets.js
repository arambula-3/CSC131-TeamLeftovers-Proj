var mongoose = require('mongoose');

var setSchema = new mongoose.Schema({
    name: String,
    user: String,
    imgs:
    {
        imageUrl: String
    }
});
  
module.exports = new mongoose.model('Sets', setSchema);
