// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our playlist model
var playlistSchema = mongoose.Schema({

    user_id : String, 
    created : String,
    track_count : Number,
    description : String,
    tracks : 
        [
            {
                track_id: String,
                channel_artist : String,
                track_name : String,
                url : String,
                runtime: Number,
                source: String
            }
        ],
    name: String,
    running_time: Number,
    tags: [String]

});


// create the model for users and expose it to our app
module.exports = mongoose.model('Playlist', playlistSchema);