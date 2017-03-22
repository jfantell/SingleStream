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

const Youtube = require("../lib")
    , fs = require("fs")
    , readJson = require("r-json")
    , Lien = require("lien")
    , Logger = require("bug-killer")
    , opn = require("opn")
    , prettyBytes = require("pretty-bytes")
    ;

// I downloaded the file from OAuth2 -> Download JSON
const CREDENTIALS = readJson(`${__dirname}/credentials.json`);

// Init lien server
let server = new Lien({
    host: "localhost"
  , port: 3000
  , public: __dirname + "/public"
});

// Listen for load
server.on("load", err => {
    console.log(err || "Server started on port 3000.");
    err && process.exit(1);
});

// When the "Get YouTube Data" button is clicked
//Initiate authentication/authorization
server.addPage("/youtube", "post", lien => {
    opn(oauth.generateAuthUrl({
        access_type: "offline"
        , scope: ["https://www.googleapis.com/auth/youtube"]
    }));
    //Redirect back to the starting (index) page
    lien.redirect("/");
});


server.errorPages();

server.on("serverError", err => {
    console.log(err.stack);
});


// Authenticate
// You can access the Youtube resources via OAuth2 only.
// https://developers.google.com/youtube/v3/guides/moving_to_oauth#service_accounts
let oauth = Youtube.authenticate({
    type: "oauth"
  , client_id: CREDENTIALS.web.client_id
  , client_secret: CREDENTIALS.web.client_secret
  , redirect_url: CREDENTIALS.web.redirect_uris[0]
});


// Handle oauth2 callback
server.addPage("/callback", lien => {
    console.log("Trying to get the token using the following code: " + lien.query.code);
    oauth.getToken(lien.query.code, (err, tokens) => {
        if (err) {
            lien.lien(err, 400);
            console.log(err);
            return Logger.log(err);
        }
        console.log("Got the tokens.");
        oauth.setCredentials(tokens);
        lien.end("Please Close This Page.");
        var req = Youtube.playlists.list({
            // This is for the callback function
            part: "snippet"
            // Create the readable stream to upload the video
          , mine: "true"
        }, (err, data) => {
            console.log(data);
            console.log("Done.");
        });
    });
});
