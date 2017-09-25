var express = require('express');
var app = express();

// Setup static hosting path and
app.use(express.static(__dirname + '/public'));

app.get('/login', function(req, res) {
	// TODO: Handle login!
	res.send('logging in!');
});

app.listen(8888);
