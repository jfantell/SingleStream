// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our playlist model
var playlistSchema = mongoose.Schema({

    user_id : String, 
    created : Date,
    track_count : Number,
    description : String,
    tracks : 
        [
            {
                track_name : String,
                service : String,
                url : String
            }
        ]
    
});


// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Playlist', userSchema);