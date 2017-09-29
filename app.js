var fs = require('fs');
var request = require('request');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var express = require('express');
var app = express();

///////////////////////////////////////////////////////////////////////////////

// See https://developer.spotify.com/web-api/authorization-guide/#authorization-code-flow
// for additional information about the Spotify web API that is used in this file.

var client_id = fs.readFileSync('PUBLIC_KEY', 'utf8');
var client_secret = fs.readFileSync('SECRET_KEY', 'utf8');
var redirect_uri = 'http://localhost:8888/oauth-callback/';

var spotify_access_token_key  = 'spotify_access_token';
var spotify_refresh_token_key = 'spotify_refresh_token';
var spotify_api_state_key     = 'spotify_api_state';

///////////////////////////////////////////////////////////////////////////////

function generateRandomStateString() {
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (var i = 0; i < 20; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

function getBase64AuthorizationHeader() {
	return 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'));
}

function setAccessTokenCookie(res, access_token, expires_in) {
	// Make access token cookie expire, so that the refresh token must be used
	// (remove 10 seconds so that we won't accidentally use it if it just expired)
	var expired_by_ms = Date.now() + (expires_in * 1000.0) - 10000.0;
	var options = { expires: new Date(expired_by_ms) };
	res.cookie(spotify_access_token_key, access_token, options);
}

///////////////////////////////////////////////////////////////////////////////

// Setup pug
app.set('views', './views');
app.set('view engine', 'pug');

// Setup middleware
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));

// Authentication middleware for handling refresh tokens and parsing the access token for further use
app.get('*', function(req, res, next) {

	var refresh_token = req.cookies ? req.cookies[spotify_refresh_token_key] : null;
	var access_token = req.cookies ? req.cookies[spotify_access_token_key] : null;

	if (refresh_token && !access_token) {

		// Get new access token from the refresh token

		var authOptions = {
			url: 'https://accounts.spotify.com/api/token',
			headers: { 'Authorization': getBase64AuthorizationHeader() },
			form: {
				grant_type: 'refresh_token',
				refresh_token: refresh_token
			},
			json: true
		};

		request.post(authOptions, function(error, response, body) {
			if (!error && response.statusCode === 200) {
				// New access token acquired, set cookie and store in locals
				setAccessTokenCookie(res, body.access_token, body.expires_in);
				res.locals.access_token = body.access_token;
				next();
			} else {
				// TODO: Handle any possible errors!
				console.log('Error: could not get access token from refresh token!');
			}
		});

	} else {

		res.locals.access_token = access_token;
		next();

	}

})

app.get('/', function(req, res) {

	// (from authentication middleware)
	var access_token = res.locals.access_token;

	if (access_token) {
		res.render('post-login');
	} else {
		res.render('pre-login');
	}

});

app.get('/login', function(req, res) {

	var state = generateRandomStateString();
	res.cookie(spotify_api_state_key, state);

	// TODO: Specify relevant scopes!
	var scope = 'user-read-private user-read-email';

	res.redirect('https://accounts.spotify.com/authorize?' +
		querystring.stringify({
			response_type: 'code',
			client_id: client_id,
			scope: scope,
			redirect_uri: redirect_uri,
			state: state,
			show_dialog: true /* mostly for debugging */
		}));
});

app.get('/oauth-callback', function(req, res) {

	// Make sure state is equal
	var state = req.query.state || null;
	var cookie_state = req.cookies ? req.cookies[spotify_api_state_key] : null;
	if (state == null || cookie_state == null || state !== cookie_state) {
		console.log('Error: invalid state parameter!');
		res.status(401).send('Error: you do not have permission to access this page!');
		return;
	} else {
		res.clearCookie(spotify_api_state_key);
	}

	// Check for error response
	var error = req.query.error || null;
	if (error) {
		// User did not give authorization, abort
		res.redirect('/');
		return;
	}

	// No error, authorization code should be available
	var code = req.query.code || null;
	var authOptions = {
		url: 'https://accounts.spotify.com/api/token',
		form: {
			code: code,
			redirect_uri: redirect_uri,
			grant_type: 'authorization_code'
		},
		headers: {
			'Authorization': getBase64AuthorizationHeader()
		},
		json: true
	};

	request.post(authOptions, function(err, response, body) {
		if (!err && response.statusCode === 200) {

			var access_token = body.access_token;
			var expires_in = body.expires_in;
			var refresh_token = body.refresh_token;

			// Set cookies and redirect back to main application
			setAccessTokenCookie(res, access_token, expires_in);
			res.cookie(spotify_refresh_token_key, refresh_token);
			res.redirect('/');

		} else {
			// TODO: Handle invalid_token error!
			console.log('Error: invalid_token!');
		}
	});

});

///////////////////////////////////////////////////////////////////////////////

app.listen(8888);
