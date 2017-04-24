// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our playlist model
var playlistSchema = mongoose.Schema({

    user_id : String, 
    created : String,
    playlist_length : Number,
    description : String,
    tracks : 
        [
            {
                track_id: String,
                channel_artist : String,
                track_name : String,
                url : String,
                runtime: String,
                source: String,
                track_count: String
            }
        ],
    name: String,
    running_time: Number,
    playlist_count: String,
    tags: [String]

});


// create the model for users and expose it to our app
module.exports = mongoose.model('Playlist', playlistSchema);