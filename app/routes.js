var request = require('request');
const Youtube = require("youtube-api");
var GoogleTokenProvider = require('refresh-token').GoogleTokenProvider;
var NapsterTokenProvider = require('refresh-token');
var support_functions = require('./routes_support_functions');

//Load the user database schema
var User       = require('./models/user');
//Load the playlist database schema
var Playlist = require('./models/playlist');

//Global unitiliazed variable to construct Napster authorization uri
var oauth2;

//Needed to get the Google and Napster API credentials
var configAuth = require('../config/auth'); // use this one for testing

//Export routes so they are accessible to server.js file
module.exports = function(app, passport) {

// Routes ===============================================================
    
// =============================================================================
// INDEX, PROFILE, AND LOGOUT ==================================================
// =============================================================================
    
    // Show Landing Page
    app.get('/', function(req, res) {
        res.render('index.ejs', { message: req.flash('loginMessage')}, function(e, render) { 
                console.log(req.flash('loginMessage'));
                //Destroy session upon going to landing page
                req.session.destroy(function (err){ 
                res.send(render);
            }); 
        });
    });

    // Profile/Settings Page (Allows user to link Napster and Google accounts, Edit Biographies)
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user,
        });
        // console.log(req.user);
    });

    // Logout Page (Destroy session)
    app.get('/logout', function(req, res) {
        req.session.destroy(function (err) {
            res.redirect('/'); //Inside a callback… bulletproof!
        });
    });

// =============================================================================
// AUTHENTICATE  ==================================================
// =============================================================================

    // process the login form (local account)
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // process the signup form (local account)
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));


    // google ---------------------------------

    //Google OAUTH
    //Construct Google authroization uri
    let oauth = Youtube.authenticate({
        type: "oauth"
      , client_id: configAuth.googleAuth.clientID
      , client_secret: configAuth.googleAuth.clientSecret
      , redirect_url: configAuth.googleAuth.callbackURL
    });

    // When the user clicks to authenticate with Google
    //Redirect them to Google's server
    //IMPORTANT: We pass in the local user's id stored in the session as a state when we call the Google API
    //This is because Google will erase the current session and we won't have access to the local user's account
    app.get('/auth/google', function(req, res) {
        res.redirect(oauth.generateAuthUrl({
            access_type: "offline"
            ,scope: ["https://www.googleapis.com/auth/youtube"]
            ,state: String(req.user._id)
        }));
    });

    // The callback after google has authenticated the user
    app.get('/auth/google/callback', function(req, res) {
        oauth.getToken(req.query.code, (err, tokens) => {
            //If the user does not give permission for SingleStream to access their Google/YouTube account
            //no token will be processed and the user will be redirected back to the profile page
            if (err) {
                //The API call to Google erases the local user session
                //In order to reset the user's local session we use the state parameter
                //we passed in
                User.findOne({ '_id' :  req.query.state }, function(err, user) {
                    //Reset local user session
                    req.user = user;
                    //Redirect to profile
                    res.redirect('/profile');
                    return;
                });

                console.log("Error 100: Google Callback Error");
                return;
            }

            //If the user successfully authenticates
            User.findOne({ '_id' :  req.query.state }, function(err, user) {

                //Check to make sure there is an access and refresh token
                if(tokens.access_token.length > 1 && tokens.refresh_token != undefined){
                    //If there is an existing error, let's erase it because they successfully
                    //authenticated
                    user.error = ""; 
                    user.google.refreshToken = tokens.refresh_token;
                }
                //If there is not, this probably means the user is logged in already to SingleStream via another account
                //They must go to their Google account settings and disconnect their first account in order to make a new one
                //with SingleStream
                else {
                    user.error = "Your Google credntials are authenticated with another SingleStream account. They can only be authenticated with one. Please go to https://myaccount.google.com/permissions and disconnect 'SingleStream' from your connected apps list. Then try authenticating again";
                    console.log("Error 101: Google authenicated with more than one SingleStream account");
                }
                //Save all changes to the local user's account
                user.save(function(err) {
                        if (err)
                            throw err;
                });
                //Reset the session to reflect new changes
                req.user = user;

                //Redirect to profile
                res.redirect('/profile');
                return;
            });  
        });
    });

    // napster ---------------------------------

    /*POTENTIAL BUG: Sometimes after users authenticate with Google they are redirected to index page and have to log in again */

    //Napster authentication
    app.get('/auth/napster', function(req, res) {
        //Construct the authorization uri with the given credentials
        const credentials = {
          client: {
            id: configAuth.napsterAuth.clientID,
            secret: configAuth.napsterAuth.clientSecret,
          },
          auth: {
            tokenHost: 'https://api.napster.com',
            tokenPath: '/oauth/access_token',
            authorizePath: '/oauth/authorize',
          }
        };
        oauth2 = require('simple-oauth2').create(credentials);
        //Like we did before, we will pass in the local user id for the state parameter
        //So if the session is overwirtten by napster, we will still have access to the local user's account
        //and we will be able to appropriately reset the session
        const authorizationUri = oauth2.authorizationCode.authorizeURL({
            redirect_uri: configAuth.napsterAuth.callbackURL,
            state: String(req.user._id)
        });
        //Redirect to napster's server to have the user authenticate
        res.redirect(authorizationUri);
    });

    // the callback after napster has authenticated the user
    app.get('/auth/napster/callback', function(req, res){
        const code = req.query.code;
        const options = {
            code,
        };
        oauth2.authorizationCode.getToken(options, (error, result) => {
            //If the user does not successfully authenticate (i.e. they do not give permission to SingleStream to access their account)
            //Redirect back to profile
            if (error) {
                User.findOne({ '_id' :  req.query.state }, function(err, user) {
                    //Reset local user session
                    req.user = user;
                    console.log("Napster Callback Error -> " + user);
                    //Redirect to profile
                    res.redirect('/profile');
                    return;
                });

                //<199 >
                console.log("Error 103: Napster Callback Error");
                return;
            }

            //Store the refresh token in the local user's account
            //Once again we will use the query state to find the local user
            //Because the session may be overwritten when we call the Napster API

            //NOTE: Napster API always sends a refresh token back, unlike Google
            User.findOne({ '_id' :  req.query.state}, function(err, user) {
                
                user.napster.refreshToken = result.refresh_token;

                user.save(function(err) {
                        if (err)
                            throw err;
                });
                
                //Reset the session with the new changes
                req.user = user;

                //Redirect to profile
                res.redirect('/profile');
                return;
            });
        });
    });


// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for napster accounts, just remove the token.
//  For google we need to send a revoke API call to Google

    // google ---------------------------------
    app.get('/unlink/google', function(req, res) {
        var user          = req.user;
        // console.log("Unlinked Google Account");
        //We need to actually revoke the token by making a Google API call
        //This will be done in the support function "rest"
        support_functions.rest(req.user._id, "unlink",res);
        //We set the refreshToken in mongodb to undefined
        user.google.refreshToken = undefined;
        //Redirect
        user.save(function(err) {
            if(err) console.log(err);
            res.redirect('/profile');
        });
    });

    // napster ---------------------------------
    app.get('/unlink/napster', function(req, res) {
        var user          = req.user;
        // console.log("Unlinked Napster Account");
        //Simply set the refreshToken in mongodb to undefined
        user.napster.refreshToken = undefined;
        //Save the changes, and redirect to the profile page
        user.save(function(err) {
            if(err) console.log(err);
            res.redirect('/profile');
        });
    });


// =============================================================================
// RESTFUL API CALLS (ONCE AUTHENTICATED!) =============================================================
// =============================================================================

    //== RENDER PLAYLISTS PAGE ==
    app.get('/playlists', isLoggedIn, function(req, res) {
        res.render('playlists.ejs')
    });
    //==CREATE A NEW CUSTOM PLAYLIST==
    app.post('/create_playlist', isLoggedIn, function(req, res) {
        support_functions.rest(req.user._id, "create_playlist",res,req.body);
    });
    //==DELETE A PLAYLIST==
    app.post('/delete_playlist', isLoggedIn, function(req, res) {
        support_functions.rest(req.user._id, "delete_playlist",res,req.body);
    });
    //==RETRIEVE ALL CUSTOM PLAYLISTS==
    app.get('/get_playlists', isLoggedIn, function(req, res) {
        support_functions.rest(req.user._id, "get_playlists",res,'');
    });

    //==RETRIEVE ALL USER'S FOLLOWERS PLAYLISTS==
    app.post('/get_playlists_follower', isLoggedIn, function(req, res) {
        support_functions.rest(req.user._id, "get_playlists_follower",res,req.body);
    });
    //==RETRIEVE ALL USER'S FOLLOWINGS PLAYLISTS==
    app.post('/get_playlists_following', isLoggedIn, function(req, res) {
        support_functions.rest(req.user._id, "get_playlists_following",res,req.body);
    });


    app.post('/clone', isLoggedIn, function(req, res) {
        support_functions.rest(req.user._id, "clone",res,req.body);
    });
    //== SEARCH NEW SONGS AND VIDEOS FROM NAPSTER AND GOOGLE
    app.post('/search', isLoggedIn, function(req, res) {
        if(req.body.q.length == 0){
            res.send("Error: No song or video specified!");
        }
        support_functions.rest(req.user._id, "search",res,req.body.q);
    });
    
    //== GET USER'S NAPSTER, GOOGLE, AND CUSTOM PLAYLISTS ==
    app.get('/playlists_function', isLoggedIn, function(req, res) {
        support_functions.rest(req.user._id, "playlists_function",res,"");
    });
    //== ADD NEW SONG TO EXISTING PLAYLIST ==
    app.post('/add_to_playlist', isLoggedIn, function(req, res) {
        support_functions.rest(req.user._id, "add_to_playlist",res,req.body);
    });
    //== DELETE A SONG FROM PLAYLIST==
    app.post('/delete_track', isLoggedIn, function(req, res) {
        support_functions.rest(req.user._id, "delete_track",res,req.body);
    });
    //== RENDER FOLLOWERS/FOLLOWINGS PAGE ==
    app.get('/friends', isLoggedIn, function(req, res) {
        res.render('friends.ejs')
    });
    //== FIND USERS TO FOLLOW ==
    app.post('/find_users_to_follow', isLoggedIn, function(req, res) {
        support_functions.rest(req.user._id, "find_users_to_follow",res,req.body);
    });
    //== ADD USERS TO FOLLOW ==
    app.post('/add_following', isLoggedIn, function(req, res) {
        support_functions.rest(req.user._id, "add_following",res,req.body);
    });

    //==GET ALL USER'S FOLLOWERS/FOLLOWINGS ==
    app.get('/get_followers_following', isLoggedIn, function(req, res) {
        support_functions.rest(req.user._id, 'get_followers_following', res, req.body);
    });

    //== RENDER ANALYTICS PAGE ==
    app.get('/analytics', isLoggedIn, function(req, res) {
        res.render('analytics.ejs')
    });
    //== ANALYTICS QUERY: GRAB DATA FOR VISUALIZATIONS, QUERY TYPES: ARTISTS, TRACKS, OR TAGS ==
    //== CAN FILTER BY USER PLAYLISTS, USER FOLLOWING PLAYLISTS, AND/OR USER FOLLOWER PLAYLISTS ==
    app.post('/analytics_artist_search', isLoggedIn, function(req, res){
        support_functions.analytics(req.user._id, 'analytics_artist_search', res, req.body);
    });
    //== RENDER CONTACT PAGE ==
    app.get('/contact', isLoggedIn, function(req, res) {
        res.render('contact.ejs')
    });

    //== SEND NAPSTER API CREDENTIALS TO CLIENT, REQUIRED BY NAPSTER WEB API ==
    app.get('/tracks_info', isLoggedIn, function(req, res) {
        support_functions.rest(req.user._id, "tracks_info",res,"");
    });

    //== ADD A USER BIO ==
    app.post('/attach_bio', isLoggedIn, function(req, res){
        support_functions.rest(req.user._id, 'attach_bio', res, req.body);
    });
}
// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated() || req.user != undefined) {
        return next();
    }
    else{
        res.redirect('/');
    }
}