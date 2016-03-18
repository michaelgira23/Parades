var port = 666;

var http    = require('http');
var express = require('express');
var app     = express();
var server  = http.Server(app);
var io      = require('socket.io');

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/html/index.html');
});

server.listen(port, function() {
	console.log('Server listening on *:' + port);
});