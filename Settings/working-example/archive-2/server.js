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
var GoogleTokenProvider = require('refresh-token').GoogleTokenProvider;
 
var tokenProvider = new GoogleTokenProvider({
    refresh_token: '', 
    client_id:     '204378439556-ajptcmntu0rqkjippgpih7sfd2o8cphl.apps.googleusercontent.com', 
    client_secret: 'AfKMi0hekiiXmCkWqZQDo1Jn'
  });

var app = express();
app.use(express.static('public'));
// app.use(express.static('.'));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.render('public/index.html');
});

////////////////////////////////////////////////////////////     YOUTUBE     ////////////////////////////////////

///YouTube API
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


app.get("/youtube", function (req, res) {

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
        console.log("Got the tokens.");
        oauth.setCredentials(tokens);
        try {
            if(tokens.refresh_token != undefined){
                tokenProvider.refresh_token = tokens.refresh_token
                console.log("SUCCESS REFRESH " + tokenProvider.refresh_token);
            }
        } catch(err){
            console.log("FAIL REFRESH");
        }
        console.log(tokens);
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
app.get("/test", function (req, res) {
    var req = Youtube.playlists.list({

      part: "snippet",
      mine: "true"

    }, (err, data) => {
        JSON = data;
        console.log(data);
        console.log("Error" + err);
        console.log("Done.");
    });
    res.end();
});

////////////////////////////////////////////////////////////     SPOTIFY     ////////////////////////////////////






////////////////////////////////////////////////////////////          ////////////////////////////////////

app.listen(3000, function () {
    console.log("Hi");
});
