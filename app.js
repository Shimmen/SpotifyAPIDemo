var fs = require('fs');
var request = require('request');
var querystring = require('querystring');

var express = require('express');
var app = express();

var client_id = '942817181f7f4d0a92bdff56b87e1b50';
var client_secret = fs.readFileSync('SECRET_KEY', 'utf8');
var redirect_uri = 'http://localhost:8888/oauth-callback/';

// Setup static hosting path
app.use(express.static(__dirname + '/public'));

/*
app.get('/', function(req, res) {

	// TODO: Do stuff!

});
*/

app.get('/login', function(req, res) {

	// TODO: Use state!
	var state = '';

	// TODO: Specify relevant scopes!
	var scope = 'user-read-private user-read-email';

	res.redirect('https://accounts.spotify.com/authorize?' +
		querystring.stringify({
			response_type: 'code',
			client_id: client_id,
			scope: scope,
			redirect_uri: redirect_uri,
			state: state
		}));
});

app.get('/oauth-callback', function(req, res) {

	var error = req.query.error || null;
	var code = req.query.code || null;
	var state = req.query.state || null;

	if (error) {
		// TODO: Handle error, maybe redirect to some error page?
		console.log('User did not authorize this app!');
	}

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

	request.post(authOptions, function(err, response, body) {
		if (!err && response.statusCode === 200) {

			var access_token = body.access_token;
			var refresh_token = body.refresh_token;

			// Redirect back to main application with
			res.redirect('/?' +
				querystring.stringify({
					"access_token": access_token,
					"refresh_token": refresh_token
				}));

		} else {
			// TODO: Handle invalid_token error!
			console.log('invalid_token error!');
		}
	});

});

app.listen(8888);
