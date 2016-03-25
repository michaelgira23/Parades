var Random = require("random-js");
var random = new Random(Random.engines.mt19937().autoSeed());
var _      = require('underscore');

var games  = module.exports.games = {};
var gameCodeLength = 4;

module.exports = function(io) {
    
    io.on('connection', function(socket) {
        console.log(games);
        socket.on('username', function(username) {
            
            socket.on('create game', function(options) {
                if(!playerInGame(socket.id)) {
                    
                    var gameId = initializeGame(socket.id, username, options);
                    socket.emit('game id', gameId);
                    
                    console.log(games[gameId].players);
                    
                    socket.on('start game', function() {
                        games[gameId].start();
                        console.log(games[gameId].players);
                    });

                    socket.on('leave game', function() {
                        games[gameId].end();
                        console.log(games[gameId].players);
                    });
                    
                    // Also stop game if leader disconnects
                    socket.on('disconnect', function() {
                        games[gameId].end();
                        console.log(games[gameId].players);
                    });
                }
            });
            
            socket.on('join game', function(gameId) {
                if(!playerInGame(socket.id) && typeof games[gameId] !== 'undefined') {
                    
                    games[gameId].playerJoin(socket, username);
                    socket.emit('join game response', true);
                    console.log(games[gameId].players);
                    
                    socket.on('leave game', function() {
                        games[gameId].playerLeave(socket.id);
                    })
                    
                    // Leave if player disconnects
                    socket.on('disconnect', function() {
                        games[gameId].playerLeave(socket.id);
                        console.log(games[gameId].players);
                    });
                } else {
                    socket.emit('join game response', false);
                }
            });
        });
    });
}

/* Returns a random 5 digit number */

function generateGameId() {
    var gameId = '';
    for(var i = 0; i < gameCodeLength; i++) {
        gameId += random.integer(0, 9);
    }
    return gameId;
}

/* Initializes game */
function initializeGame(socketId, username, options) {
    console.log('Initialize Game');
    var newGame = new Game(socketId, username, options);
    var id = newGame.gameId;
    games[id] = newGame;
    return id;
}

/* Checks if player is in a game */
function playerInGame(socketId) {
    var inGame = false;
    _.each(games, function(value, key) {
        if(value.playerInGame(socketId)) {
            inGame = true;
        }
    });
    return inGame;
}

/* Game "class" */

function Game(socketId, username, options) {
    console.log('Create game instance');
    
    // Game ID
    this.gameId = generateGameId();
    while(typeof games[this.gameId] !== 'undefined') {
        this.gameId = generateGameId();
    }
    
    // Members array
    this.players = {};
    this.players[socketId] =
    {
        username  : username,
        team      : 'spectator',
        permission: 1,
    };
    
    // Options
    this.options = {};
    
    // Round Time
    if(typeof options.roundTime === 'number' && options.roundTime !== NaN) {
        this.options.roundTime = options.roundTime;
    } else {
        this.options.roundTime = 90;
    }
    
    // General values
    this.blueScore = 0;
    this.redScore  = 0;
    
    this.started   = false;
}

// Emits something to everyone in the game
Game.prototype.emit = function(event, data) {
    _.each(this.players, function(value, key) {
        io.to(key).emit(event, data);
    });
}

Game.prototype.getStatus = function() {
    var response = {};
    
    response.score = {};
    response.score.blue = this.blueScore;
    response.score.red  = this.redScore;
    
    response.options = this.options;
    
    response.teams = {};
    response.teams.spectator = this.getTeam('spectator');
    response.teams.blue = this.getTeam('blue');
    response.teams.red  = this.getTeam('red');
}

// Returns a list of usernames for a certain team
Game.prototype.getTeam = function(team) {
    var players = [];
    _.each(this.players, function(value, key) {
        if(value.team === team) {
            players.push(value.username);
        }
    });
    return players;
}

// Starts the game when everyone is ready
Game.prototype.start = function() {
    console.log('Start game');
    if(!this.start) {
        // Start game
        console.log('I would start the game');
    }
}

// Stops the game
Game.prototype.end = function() {
    console.log('End game');
    // Stop game
    console.log('I would stop the game');
}

// Makes a player join a game
Game.prototype.playerJoin = function(socket, username) {
    console.log('Player ' + username + ' joined');
    
    var socketId = socket.id;
    
    // Determine which team new guy should go on
    var blueCount = this.getTeam('blue').length;
    var redCount  = this.getTeam('red').length;
    
    if(blueCount < redCount) {
        var team = 'blue';
    } else {
        var team = 'red';
    }
    socket.emit('team', team);
    
    this.players[socketId] =
    {
        username  : username,
        team      : team,
        permission: 0,
    };
}

// Checks if a player's socket id is currently in the game
Game.prototype.playerInGame = function(socketId) {
    return typeof this.players[socketId] !== 'undefined';
}

// Change player's team
Game.prototype.playerChangeTeam = function(socketId, team) {
    if(this.playerInGame(socketId)) {
        this.players[socketId].team = team;
    }
}

// Makes a player leave a game
Game.prototype.playerLeave = function(socketId) {
    console.log('Player ' + this.players[socketId].username + ' left');
    delete this.players[socketId];
}