// define the schema for our user model
var playlistSchema = mongoose.Schema({

    user_id: String,
    playlist_id: String,
    date_of_creation: String,
    playlist_count: int,
    description: String,
    tracks: {
        array : [Track_Object]
    }
    Track_Object: {
        source: String,
        track_id: String
        url: String
    }
});


// create the model for users and expose it to our app
module.exports = mongoose.model('Playlist', playlistSchema);