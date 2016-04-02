var port = 420;

var http    = require('http');
var express = require('express');
var app     = express();
var server  = http.Server(app);
var io      = require('socket.io')(server);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/html/game.html');
});

server.listen(port, function() {
	console.log('Server listening on *:' + port);
});

/* Initialize Game */
require(__dirname + '/parades.js')(io);
