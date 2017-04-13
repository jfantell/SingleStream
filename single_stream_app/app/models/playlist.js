// define the schema for our user model
var playlistSchema = mongoose.Schema({

    user_id: String,
    google           : {
        id           : String,
        token        : String,
        refreshToken : String,
        email        : String,
        name         : String
    },
    napster           : {
        id           : String,
        token        : String,
        refreshToken : String,
        name         : String
    }
});


// create the model for users and expose it to our app
module.exports = mongoose.model('Playlist', playlistSchema);