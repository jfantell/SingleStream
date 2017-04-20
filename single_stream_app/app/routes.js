var request = require('request');
const Youtube = require("youtube-api");
var GoogleTokenProvider = require('refresh-token').GoogleTokenProvider;
var NapsterTokenProvider = require('refresh-token');

//Load the user database schema
var User       = require('./models/user');
var Playlist = require('./models/playlist');

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
        res.render('index.ejs', { message: req.flash('loginMessage')}, function(e, render) { 
                console.log(req.flash('loginMessage'));
                req.session.destroy(function (err){ 
                console.log("Hi"); 
                res.send(render);
            }); 
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

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // process the signup form
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

    //== RENDER PLAYLISTS PAGE ==
    app.get('/playlists', isLoggedIn, function(req, res) {
        res.render('playlists.ejs')
    });
    //==CREATE A NEW CUSTOM PAGE (EMPTY)==
    app.post('/create_playlist', isLoggedIn, function(req, res) {
        rest(req.user._id, "create_playlist",res,req.body);
    });
    //==RETRIEVE ALL CUSTOM PLAYLISTS (EMPTY)==
    app.get('/get_playlists', isLoggedIn, function(req, res) {
        rest(req.user._id, "get_playlists",res,'');
    });
    //== SEARCH NEW SONGS AND VIDEOS FROM NAPSTER AND GOOGLE
    app.post('/search', isLoggedIn, function(req, res) {
        if(req.body.q.length == 0){
            res.send("Error: No song or video specified!");
        }
        rest(req.user._id, "search",res,req.body.q);
    });
    //== GET USER'S NAPSTER, GOOGLE, AND CUSTOM PLAYLISTS ==
    app.get('/playlists_function', isLoggedIn, function(req, res) {
        rest(req.user._id, "playlists_function",res,"");
    });
    //== ADD NEW SONG TO EXISTING PLAYLIST ==
    app.post('/add_to_playlist', isLoggedIn, function(req, res) {
        rest(req.user._id, "add_to_playlist",res,req.body);
    });
    //== RENDER FRIENDS PAGE ==
    app.get('/friends', isLoggedIn, function(req, res) {
        res.render('friends.ejs')
    });
    //== RENDER ANALYTICS PAGE ==
    app.get('/analytics', isLoggedIn, function(req, res) {
        res.render('analytics.ejs')
    });
    //== RENDER ANALYTICS PAGE ==
    app.get('/contact', isLoggedIn, function(req, res) {
        res.render('contact.ejs')
    });




    // //== TEST
    // app.get('/playlists_test', isLoggedIn, function(req, res) {
    //     res.render('playlists_test.ejs')
    // });



    // //== RENDER SEARCH PAGE ==
    // app.get('/search_page', isLoggedIn, function(req, res) {
    //     res.render('testing.ejs');
    // });


    //UNFINISHED STUFF

    // app.get('/tracks_info', isLoggedIn, function(req, res) {
    //     rest(req.user._id, "tracks_info",res,"");
    // });

    // //Display all playlist tracks Google and Napster
    // app.get('/testing', isLoggedIn, function(req, res) {
    //     rest(req.user._id, "testing",res,"");
    // });
    // app.get('/player', isLoggedIn, function(req, res) {
    //     // console.log(req.user);
    //     // console.log(req.session.user);
    //     res.render('player.ejs');
    // });
     
};

//The following function will be used to make all api calls that require an access token.
//Using the node refresh-token api module, which gets a valid access token using the refresh tokens
//stored in the user's mongodb account
function rest(session_user_id, api_call, res, post_parameters){
    User.findOne({ '_id' :  session_user_id }, function(err, user) {

        //Two unitliaized global variables to hold the refresh tokens for Google and Napster respectively
        var gTokenProvider, nTokenProvider;
        napster_set = false;
        google_set = false;
        
        //Variables to store objects that will be passed back to the client in some api calls
        var g_playlists, n_playlists, u_playlists;

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

        if(api_call == "search"){
            var songs = [];
            //songs array, napster auth boolean, token obect, query, callback
            napster_songs(songs,napster_set,nTokenProvider,post_parameters,function(done_1) {
                google_videos(songs,google_set,gTokenProvider,post_parameters,function(done_2){
                    res.send(songs);
                });
            });    
        }

        //GET PLAYLISTS FROM BOTH NAPSTER AND GOOGLE/YOUTUBE
        if(api_call == "playlists_function"){
            var playlists = [];
            napster_playlist(playlists,napster_set,nTokenProvider,function(done_1){
                google_playlist(playlists,google_set,gTokenProvider,function(done_2){
                    res.send("Hey man");
                });
            });
        }


        // This is just using a GET right now, so it'll work if you type in 
        // "/create_playlist" in the URL. Using the myFunction to redirect
        //  back to the /playlists page because there is nothing to show yet.
        if(api_call == "create_playlist"){

            // create the playlist
            var newPlaylist = new Playlist();
            //array of tags
            var tags = post_parameters.tags.split(",").map(function(item) {
              return item.trim();
            });
            var date = new Date();

            // for now just looking at user id and initializing track count
            newPlaylist.user_id = session_user_id;
            newPlaylist.track_count = 0;
            newPlaylist.name = post_parameters.playlist_name;
            newPlaylist.description = post_parameters.description;
            newPlaylist.tags = tags;
            newPlaylist.created = date.toDateString();
            newPlaylist.save(function(err) {
                if (err)
                    console.log(err);
                res.send("Done");
                console.log("done");
            });  
        }
        if(api_call == "get_playlists"){
            Playlist.find({ 'user_id' :  session_user_id }, function(err, playlists) {
                res.send(playlists);
            });
        }

        if(api_call == "add_to_playlist"){
            var track = {track_id: post_parameters.result[0], channel_artist: post_parameters.result[1], track_name: post_parameters.result[2], url: post_parameters.result[3]};

            Playlist.findByIdAndUpdate(post_parameters.playlist_id, {
              $push: { tracks: track }
            }, function (err, playlist) {
                console.log(err);
                console.log(playlist);
            });
            res.end();
        }

        // //For the napster player, we need to send the access token and refresh token to the client
        // if(api_call == "tracks_info"){
        //     if(napster_set) {
        //         nTokenProvider.getToken(function (err, token) {
        //            res.send({access_token: token, refresh_token: user.napster.refreshToken}); 
        //        });
        //     }
        // }
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

//-----------------------------
//Search API Call
//-----------------------------
function napster_songs(songs,napster_set,nTokenProvider,post_parameters,callback){
    if(napster_set){
        nTokenProvider.getToken(function (err, token) {
                //Determine what operation do perform based on the second input in the rest function
                // var artists = {
                //     url: 'https://api.napster.com/v2.1/search?q='+post_parameters+'&type=artist&limit=5',
                //     headers: { 'Authorization': 'Bearer ' + token },
                //     json: true
                // };
                // request.get(artists, function(error, response, body) {
                //    console.log("Artists");
                //    for(i = 0; i < data.length; i++){
                //       console.log(data[i].id, data[i].name, )
                //    }
                // }); 
                // var albums = {
                //     url: 'https://api.napster.com/v2.1/search?q='+post_parameters+'&type=album&limit=5',
                //     headers: { 'Authorization': 'Bearer ' + token },
                //     json: true
                // };
                // request.get(albums, function(error, response, body) {
                //    console.log("Albums");
                //    console.log(body);
                // });
            var tracks = {
                url: 'https://api.napster.com/v2.1/search?q='+post_parameters+'&type=track&limit=5',
                headers: { 'Authorization': 'Bearer ' + token },
                json: true
            };
            request.get(tracks, function(error, response, body) {
               console.log("Tracks");
               for(i = 0; i < body.data.length; i++){
                    songs.push([body.data[i].id, body.data[i].artistName, body.data[i].name, body.data[i].albumId]);
                    if(i == body.data.length-1){
                        callback("done");
                    }
                }
            });   
        });  
    }

}
function google_videos(songs,google_set,gTokenProvider,post_parameters,callback){
    if(google_set){
        gTokenProvider.getToken(function (err, token) {
            var videos = {
                url: 'https://www.googleapis.com/youtube/v3/search?part=snippet&q='+post_parameters+'&type=video',
                headers: { 'Authorization': 'Bearer ' + token },
                json: true
            }
            request.get(videos, function(error, response, body) {
                //Parse body and add each video to an array with the needed data/metadata
                var youtube_videos = [];
                console.log("Google");
                for(i = 0; i < body.items.length; i++){
                    // Save important data for each video to master array
                    songs.push([body.items[i].id.videoId, body.items[i].snippet.channelTitle, body.items[i].snippet.title, body.items[i].snippet.thumbnails.default.url]);
                    if(i == body.items.length-1){
                        console.log("Google")
                        callback("done");
                    }
                }
            });
        });
    }
}

//-----------------------------
//Playlists
//-----------------------------
function napster_playlist(playlists, napster_set, nTokenProvider, callback){
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
                var options = "";
                //Go through all playlists
                var remaining = body.playlists.length;
                for(i=0; i < body.playlists.length; i++){
                    options = {
                        url: body.playlists[i].links.tracks.href + '?limit=10',
                        headers: { 'Authorization': 'Bearer ' + token },
                        json: true
                    };
                    request.get(options, function(error, response, playlist) {
                        var songs = [];
                        remaining--;
                        //Go through all songs in a particular playlist
                        for(j = 0; j < playlist.tracks.length; j++){
                            songs.push([playlist.tracks[j].id, playlist.tracks[j].artistName, playlist.tracks[j].name, playlist.tracks[j].albumId]);
                            if(j == playlist.tracks.length-1){
                                playlists.push(songs);
                                if(remaining == 0){
                                    console.log(playlists);
                                    callback("done");s
                                }
                            }
                        }
                    });
                }
            });   
        });
    }
}

function google_playlist(playlists, google_set, gTokenProvider, callback){
    if(google_set){
        //Get valid access token
        gTokenProvider.getToken(function (err, token) {
            var options = {
                url: 'https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true',
                headers: { 'Authorization': 'Bearer ' + token },
                json: true
            };
            request.get(options, function(error, response, body) {
                console.log(body);
                callback("done");
            });   
        });
    }
}


// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/');
}