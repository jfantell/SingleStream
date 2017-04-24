// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        email        : String,
        firstName    : String,
        lastName     : String,
        password     : String,
    },
    google           : {
        refreshToken : String,
    },
    napster           : {
        refreshToken : String,
    },
    error : String,
    followers : [
        {
            _id: String,
            name: String,
            biography: String
        }
    ],
    following: [
        {
            _id: String,
            name: String,
            biography: String
        }
    ],
    biography: String,
    favorite_artists: String,
    favorite_songs: String
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
module.exports = mongoose.model('User', userSchema);