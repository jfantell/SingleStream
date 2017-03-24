/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = 'e33583a1a5dc40caa8430fe0424d6eb2'; // Your client id
var client_secret = '272be14c65414ca8a3f13cdd991d0594'; // Your secret
var redirect_uri = 'http://localhost:3000/callbackSpotify'; // Your redirect uri

var TokenProvider = require('refresh-token');
 
var spotifyTokenProvider = new TokenProvider('https://accounts.spotify.com/api/token', {
  refresh_token: '', 
  client_id: 'e33583a1a5dc40caa8430fe0424d6eb2', 
  client_secret: '272be14c65414ca8a3f13cdd991d0594'
});


/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());

app.get('/spotify', function(req, res) {

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
        spotifyTokenProvider.refresh_token = refresh_token;
        // console.log("Refresh token " + refresh_token);
        // console.log("Access token " + access_token);

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
app.get("/test", function(req, res) {
  spotifyTokenProvider.getToken(function (err, token) {
    // console.log("Refresh token " + spotifyTokenProvider.refresh_token);
    // console.log("Access token: " + token);
    // console.log("Access token error: " + err);
    var options = {
        url: 'https://api.spotify.com/v1/me/following?type=artist',
        headers: { 'Authorization': 'Bearer ' + token },
        json: true
    };
    // use the access token to access the Spotify Web API
    request.get(options, function(error, response, body) {
      console.log(body);
    });
    res.end();
  });
});


console.log('Listening on 3000');
app.listen(3000);
