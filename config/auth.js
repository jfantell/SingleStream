// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'      : '198872023935822', // your App ID
        'clientSecret'  : '2e11b193c537d1d458e4e3ee820f5eef', // your App Secret
        'callbackURL'   : 'http://localhost:8080/auth/facebook/callback',
    },

    'twitterAuth' : {
        'consumerKey'       : 'OsndbHlujlIMIko7BlwNRLVtM',
        'consumerSecret'    : 'DEe89Q4qE5FM5wvr2coyzXcHMJacJcAbNQNj82bfVsIMhkofnP',
        'callbackURL'       : 'http://127.0.0.1:8080/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'      : '204378439556-ajptcmntu0rqkjippgpih7sfd2o8cphl.apps.googleusercontent.com',
        'clientSecret'  : 'AfKMi0hekiiXmCkWqZQDo1Jn',
        'callbackURL'   : 'http://singlestream.online/auth/google/callback'
    },

    'napsterAuth' : {
        'clientID'      : 'YWQzNWQxZWMtNDU5Mi00NjJjLThkNTAtNjcwN2M4Yjc5NWM4',
        'clientSecret'  : 'MTRkYzZlZDUtMDU5Zi00NzcxLTg4ZWItYjRkZTFmNTg0OWZh',
        'callbackURL'   : 'http://singlestream.online/auth/napster/callback'
    }

};
