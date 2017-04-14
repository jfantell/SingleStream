var request = require('request');
const Youtube = require("youtube-api");
var GoogleTokenProvider = require('refresh-token').GoogleTokenProvider;
var NapsterTokenProvider = require('refresh-token');

//Load the user database schema
var User       = require('./models/user');

//Global unitiliazed variable to construct Napster authorization uri
var oauth2;

//Needed to get the Google and Napster API credentials
var configAuth = require('../config/auth'); // use this one for testing

module.exports = function(app, passport) {

// normal routes ===============================================================
    
// =============================================================================
// INDEX, PROFILE, AND LOGOUT ==================================================
// =============================================================================
    
    // Show Landing Page
    app.get('/', function(req, res) {
        req.session.destroy(function (err) {
            res.render('index.ejs');
        });
    });

    // Profile/Settings Page (Allows user to link Napster and Google accounts)
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user,
        });
        console.log(req.user);
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

    // locally --------------------------------
    // LOGIN ===============================
    // show the login form
    app.get('/login', function(req, res) {
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // SIGNUP =================================
    // show the signup form
    app.get('/signup', function(req, res) {
        res.render('signup.ejs', { message: req.flash('loginMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
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

    /*POTENTIAL BUG: Sometimes after users authenticate with Google they are redirected to index page and have to log in again */

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
                    console.log("Google Callback Error -> " + user);
                    //Redirect to profile
                    res.redirect('/profile');
                    return;
                });

                console.log("ERROR 100");
                return;
            }

            //If the user successfully authenticates
            User.findOne({ '_id' :  req.query.state }, function(err, user) {

                //Check to make sure there is an access and refresh token
                if(tokens.access_token.length > 1 && tokens.refresh_token != undefined){
                    user.google.refreshToken = tokens.refresh_token;
                }
                //If there is not, this probably means the user is logged in already to SingleStream via another account
                //They must go to their Google account settings and disconnect their first account in order to make a new one
                //with SingleStream
                else {
                    user.error = "Your Google credntials are authenticated with another SingleStream account. They can only be authenticated with one. Please go to https://myaccount.google.com/permissions and disconnect 'SingleStream' from your connected apps list. Then try authenticating again";
                }
                //Save the changes to the local user's account
                user.save(function(err) {
                        if (err)
                            throw err;
                });
                //Reset the session to reflect new changes
                req.user = user;
                console.log("Google Callback Success -> " + user);

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

                console.log("ERROR 101");
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
                console.log("Napster Callback Success -> " + user);

                //Redirect to profile
                res.redirect('/profile');
                return;
            });
        });
    });


// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // google ---------------------------------
    app.get('/unlink/google', function(req, res) {
        var user          = req.user;
        //We need to actually revoke the token by making a Google API call
        //This will be done in the function "rest"
        rest(req.user._id, "unlink",res);
        //We set the refreshToken in mongodb to undefined
        user.google.refreshToken = undefined;
        //Redirect
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // napster ---------------------------------
    app.get('/unlink/napster', function(req, res) {
        var user          = req.user;
        //Simply set the refreshToken in mongodb to undefined
        user.napster.refreshToken = undefined;
        //Save the changes, and redirect to the profile page
        user.save(function(err) {
            res.redirect('/profile');
        });
    });


// =============================================================================
// RESTFUL API CALLS (ONCE AUTHENTICATED!) =============================================================
// =============================================================================

    //SAMPLE NAPSTER API CALL (ONCE AUTHENTICATED)
    app.get('/playlists', isLoggedIn, function(req, res) {
        // console.log(req.user);
        // console.log(req.session.user);
        rest(req.user._id, "playlists",res,"");
    });

    app.get('/tracks_info', isLoggedIn, function(req, res) {
        rest(req.user._id, "tracks_info",res,"");
    });

    //Display all playlist tracks Google and Napster
    app.get('/testing', isLoggedIn, function(req, res) {
        rest(req.user._id, "testing",res,"");
    });
    app.get('/player', isLoggedIn, function(req, res) {
        // console.log(req.user);
        // console.log(req.session.user);
        res.render('player.ejs');
    });
   	app.post('/search', isLoggedIn, function(req, res) {
        // console.log(req.user);
        // console.log(req.session.user);
        rest(req.user._id, "search",res,"");
    });
    app.post('/create_playlist', isLoggedIn, function(req, res) {
        // console.log(req.user);
        // console.log(req.session.user);
        rest(req.user._id, "create_playlist",res,"");
    });
};

//The following function will be used to make all api calls that require an access token.
//Using the node refresh-token api module, which gets a valid access token using the refresh tokens
//stored in the user's mongodb account
function rest(session_user_id, api_call, res, post_parameters){
    User.findOne({ '_id' :  session_user_id }, function(err, user) {

        ////-->NAPSTER
        //Two unitliaized global variables to hold the refresh tokens for Google and Napster respectively
        var gTokenProvider, nTokenProvider;
        napster_set = false;
        google_set = false;
        
        var g_playlists, n_playlists;

        //Check if napster refresh token has been set in the user's local account
        if(user.napster.refreshToken != undefined){
            //If so, initialize the refresh-token module to work with napster
            //This ensures us we will always have a valid access token
            nTokenProvider = new NapsterTokenProvider( 'https://api.napster.com/oauth/access_token', {
                refresh_token: user.napster.refreshToken, 
                client_id:     configAuth.napsterAuth.clientID, 
                client_secret: configAuth.napsterAuth.clientSecret
            });
            napster_set = true;
        }
        //Check if Google refresh token has been set
        if(user.google.refreshToken != undefined){
            //If so initialize the refresh-token module for Google
            gTokenProvider = new GoogleTokenProvider({
                refresh_token: user.google.refreshToken, 
                client_id:     configAuth.googleAuth.clientID, 
                client_secret: configAuth.googleAuth.clientSecret
            });
            google_set = true;
        }
        // if(api_call == "search"){
        // 	if(napster_set){
        //         //Get the valid access token
        //         nTokenProvider.getToken(function (err, token) {
        //             //Determine what operation do perform based on the second input in the rest function
        //             var options = {
        //                 url: '//search',
        //                 headers: { 'Authorization': 'Bearer ' + token },
        //                 json: true
        //             };
        //             request.get(options, function(error, response, body) {
        //                ///send options back to client
        //             });   
        //         });
        //     }
        // }
        // if(api_call == "create_playlist"){
        // 	if(napster_set){
        //         //Get the valid access token
        //         nTokenProvider.getToken(function (err, token) {
        //             //Determine what operation do perform based on the second input in the rest function
        //             Playlist.findOne({ '_id' :  req.seesion.user_id}, function(err, user) {
	       //              //append the songs that the user wanted to the playlist

	       //              user.save(function(err) {
	       //                      if (err)
	       //                          throw err;
	       //              });
	       //              //Reset the session with the new changes
	       //              req.session.user = user;
	       //          });
        //         });
        //     }
        // }

        //GET PLAYLISTS FROM BOTH NAPSTER AND GOOGLE/YOUTUBE
        if(api_call == "playlists"){
            if(napster_set){
                //Get the valid access token
                nTokenProvider.getToken(function (err, token) {
                    //Determine what operation do perform based on the second input in the rest function
                    var options = {
                        url: 'https://api.napster.com/v2.1/me/library/playlists?limit=10',
                        headers: { 'Authorization': 'Bearer ' + token },
                        json: true
                    };
                    request.get(options, function(error, response, body) {
                        console.log(body.playlists[0].links.tracks.href + '?limit=10');
                        var options = {
                            url: body.playlists[0].links.tracks.href + '?limit=10',
                            headers: { 'Authorization': 'Bearer ' + token },
                            json: true
                        };
                        request.get(options, function(error, response, body) {
                            console.log("Napster");
                            console.log(body);
                            n_playlists = body;
                        });
                    });   
                });
            }
            if(google_set){
                //Get valid access token
                gTokenProvider.getToken(function (err, token) {
                    var options = {
                        url: 'https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true',
                        headers: { 'Authorization': 'Bearer ' + token },
                        json: true
                    };
                    request.get(options, function(error, response, body) {
                        console.log("Google");
                        console.log(body);
                        g_playlists = body;
                    });   
                });
            }
            //Send the playlist data to the client, timeout function needed to make sure
            //the data has been processed before it is sent over
            setTimeout(function(){myFunction(res,n_playlists,g_playlists)}, 5000);
        }

        //For the napster player, we need to send the access token and refresh token to the client
        if(api_call == "tracks_info"){
            if(napster_set) {
                nTokenProvider.getToken(function (err, token) {
                   res.send({access_token: token, refresh_token: user.napster.refreshToken}); 
               });
            }
        }
        //Unlink Google Account
        if(api_call == "unlink"){
            gTokenProvider.getToken(function (err, token) {
                var options = {
                    url: 'https://accounts.google.com/o/oauth2/revoke?token=' + token,
                };
                request.get(options, function(error, response, body) {
                });  
            });
        }
    });
    return;
}

function myFunction(res,n_playlists,g_playlists){
    res.render("playlists.ejs", {
        g_playlists : g_playlists,
        n_playlists : n_playlists,
    });
    return;
}
// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/');
}