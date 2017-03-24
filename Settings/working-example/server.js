"use strict";

/**
 * This script uploads a video (specifically `video.mp4` from the current
 * directory) to YouTube,
 *
 * To run this script you have to create OAuth2 credentials and download them
 * as JSON and replace the `credentials.json` file. Then install the
 * dependencies:
 *
 * npm i r-json lien opn bug-killer
 *
 * Don't forget to run an `npm i` to install the `youtube-api` dependencies.
 * */
var express = require('express');
var request = require('request');
var bodyParser = require("body-parser");
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var GoogleTokenProvider = require('refresh-token').GoogleTokenProvider;
var TokenProvider = require('refresh-token');
 
//YOUTUBE
var tokenProvider = new GoogleTokenProvider({
    refresh_token: '', 
    client_id:     '204378439556-ajptcmntu0rqkjippgpih7sfd2o8cphl.apps.googleusercontent.com', 
    client_secret: 'AfKMi0hekiiXmCkWqZQDo1Jn'
});

//SPOTIFY
var Refresh_token = '';
var client_id = 'e33583a1a5dc40caa8430fe0424d6eb2'; // Your client id
var client_secret = '272be14c65414ca8a3f13cdd991d0594'; // Your secret
var redirect_uri = 'http://localhost:3000/callbackSpotify'; // Your redirect uri

var app = express();

app.use(express.static('public')).use(cookieParser());;

app.get('/', function (req, res) {
    res.render('public/index.html');
});

////////////////////////////////////////////////////////////     YOUTUBE     ////////////////////////////////////

// ///YouTube API
const Youtube = require("../lib")
    , fs = require("fs")
    , readJson = require("r-json")
    , Lien = require("lien")
    , Logger = require("bug-killer")
    , opn = require("opn")
    , prettyBytes = require("pretty-bytes")
    ;

//YouTube API Credentials
const CREDENTIALS = readJson(`${__dirname}/credentials.json`);

let oauth = Youtube.authenticate({
    type: "oauth"
  , client_id: CREDENTIALS.web.client_id
  , client_secret: CREDENTIALS.web.client_secret
  , redirect_url: CREDENTIALS.web.redirect_uris[0]
});


app.get("/youtube_auth", function (req, res) {

    res.redirect(oauth.generateAuthUrl({
        access_type: "offline"
        , scope: ["https://www.googleapis.com/auth/youtube"]
    }));
});

// Handle YouTube API oauth2 callback
app.get("/callback", function (req, res) {
    console.log("Trying to get the token using the following code: " + req.query.code);
    oauth.getToken(req.query.code, (err, tokens) => {
 
        if (err) {
            return console.log(err);
        }
        // console.log("Got the tokens.");
        oauth.setCredentials(tokens);
        try {
            if(tokens.refresh_token != undefined){
                tokenProvider.refresh_token = tokens.refresh_token
                console.log("Refresh Token " + tokenProvider.refresh_token);
            }
        } catch(err){
            console.log(err);
        }
        // console.log(tokens);
        res.redirect('/');
        var req = Youtube.playlists.list({

          part: "snippet",
          mine: "true"

        }, (err, data) => {
            console.log(data);
            console.log("Done.");
        });
    });
});

///YouTube Test API Call (works after user authenticates successfully)
app.get("/youtube_list", function (req, res) {
    var req = Youtube.playlists.list({

      part: "snippet",
      mine: "true"

    }, (err, data) => {
        console.log(data);
        console.log("Error" + err);
        console.log("Done.");
    });
    res.redirect('/');
    res.end();
});

// ////////////////////////////////////////////////////////////     SPOTIFY     ////////////////////////////////////
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

app.get('/spotify_auth', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-follow-read';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callbackSpotify', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        //Global variable
        // spotifyTokenProvider.refresh_token = refresh_token;
        // spotifyTokenProvider.access_token = access_token;
        Refresh_token = refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me/following?type=artist',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get("/spotify_list", function(req, res) {
  var spotifyTokenProvider = new TokenProvider('https://accounts.spotify.com/api/token', {
    refresh_token: Refresh_token, 
    client_id:     client_id, 
    client_secret: client_secret,
  });
  spotifyTokenProvider.getToken(function (err, token) {
    console.log(err);
    var options = {
        url: 'https://api.spotify.com/v1/me/following?type=artist',
        headers: { 'Authorization': 'Bearer ' + token },
        json: true
    };
    // use the access token to access the Spotify Web API
    request.get(options, function(error, response, body) {
      console.log(body);
    });
    res.redirect('/');
    res.end();
    console.log(token);
  });
});

////////////////////////////////////////////////////////////          ////////////////////////////////////

app.listen(3000, function () {
    console.log("Hi");
});
