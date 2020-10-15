var express = require('express');
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var request = require('request');
var secrets = require('./secrets.js');

// Secrets are stored in seperate file for security
var secretsArray = secrets.secrets();
var client_id = secretsArray[0];
var client_secret = secretsArray[1];
var redirect_uri = secretsArray[2];

var generateRandomString = function(length) {
      var text = '';
      var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; // Base 62

      for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
};

var stateKey = 'spotify_auth_state';

var app = express();
app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

      var state = generateRandomString(16);
      res.cookie(stateKey, state);

      // requesting authorization from spotify
      var scope = 'user-read-private user-read-email playlist-read-private';
      res.redirect('https://accounts.spotify.com/authorize?' +
            querystring.stringify({
                  response_type: 'code',
                  client_id: client_id,
                  scope: scope,
                  redirect_uri: redirect_uri,
                  state: state,
                  // show_dialog: true // forces user to never auto log in
            }));
});

app.get('/callback', function(req, res) {

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
                        
                        var playlists = {
                              url: 'https://api.spotify.com/v1/me/playlists?' +
                              querystring.stringify({
                                    limit: 50
                              }),
                              headers: { 'Authorization': 'Bearer ' + access_token },
                              json: true
                        }

                        request.get(playlists, function(error, response, body) {
                              var playlists = body.items;
                              for (var key in playlists) {
                                    console.log(playlists[key].name);
                              }
                        });

                        // redirect user to playlists page once they've logged in
                        res.redirect('/playlists.html');
                } else {
                     res.redirect('/#' +
                     querystring.stringify({
                           error: 'invalid_token'
                     }));
               }
         });
      }
});

console.log('Listening on 8888');
app.listen(8888);
