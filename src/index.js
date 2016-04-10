// MUST CREATE CONFIG.JS ON EACH MACHINE
try {
    var config  = require(__dirname + '/config.js');
} catch(e) {
    throw Error('YOU MUST CREATE A CONFIG.JS - REFER TO CONFIG.JS.EXAMPLE');
}

var http    = require('http');
var express = require('express');
var app     = express();
var server  = http.Server(app);
var io      = require('socket.io')(server);
var fs      = require('fs');

app.get('/parades/js/game.js', renderGameJS);
app.get('/js/game.js', renderGameJS);

// For localhost and production (under /parades directory)
app.use(express.static(__dirname + '/public'));
app.use('/parades', express.static(__dirname + '/public'));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/html/game.html');
});

// Dawson we can compromise
app.get('/charictionary', function(req, res) {
    console.log('Somebody joined with a Charictionary client...');
	res.writeHeader(200, {'Content-Type': 'text/html'});
    var file = fs.readFileSync(__dirname + '/html/game.html', 'utf-8');
    // Swap 'Parades' and 'Charictionary'
    file = file.split('Charictionary').join('[[Placeholder]]');
    file = file.split('Parades').join('Charictionary');
    file = file.split('[[Placeholder]]').join('Parades');
    res.end(file);
});

server.listen(config.port, function() {
	console.log('Server listening on *:' + config.port);
});

/* Initialize Game */
require(__dirname + '/parades.js')(io);

function renderGameJS(req, res) {
    res.writeHeader(200, {'Content-Type': 'application/javascript'});
    var file = fs.readFileSync(__dirname + '/public/js/game.js', 'utf-8');
    if(!config.localhost) {
        file = file.replace('io();', 'io.connect("https://michaelgira.me", {path: "/parades/socket.io"});');
    }
    res.end(file);
}
