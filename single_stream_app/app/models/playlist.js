// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our playlist model
var playlistSchema = mongoose.Schema({

    user_id : String, 
    name : String,
    created : Date,
    track_count : Number,
    running_time : Number,
    description : String,
    tags : Array,
    tracks : 
        [
            {
                track_name : String,
                service : String,
                url : String
            }
        ]
    
});


// create the model for users and expose it to our app
module.exports = mongoose.model('Playlist', playlistSchema);