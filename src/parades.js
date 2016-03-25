var Random = require("random-js");
var random = new Random(Random.engines.mt19937().autoSeed());

var games  = module.exports.games = [];

module.exports = function(io) {
    
    io.on('connection', function(socket) {
        
        socket.on('create game', function(username, options) {
            if(!playerInGame(socket.id)) {
                var gameId = initializeGame(socket.id, username, options);

                socket.emit('gameId');
                socket.on('start game', function() {
                    game[gameId].start();
                });
                
                socket.on('stop game', function() {
                    game[gameId].end();
                })
            }
        });
        
        socket.on('join game', function(gameId, username) {
            if(!playerInGame(socket.id) && typeof games[gameId] !== 'undefined') {
                games[gameId].playerJoin(socket.id, username);
            }
        });
        
        socket.on('disconnect', function() {
            console.log('User Disconnected');
        });
    });
}

/* Returns a random 5 digit number */

function generateGameId() {
    
    var gameId = '';
    for(var i = 0; i < 5; i++) {
        gameId += random.integer(0, 9);
    }
    return gameId;
}

/* Initializes game */
function initializeGame(socketId, username, options) {
    var newGame = new Game(socketId, username, options);
    var id = newGame.gameId;
    games[id] = game;
    return id;
}

/* Checks if player is in a game */
function playerInGame(socketId) {
    
    var inGame = false;
    games.forEach(function(value, index) {
        if(value.playerInGame(socketId)) {
            inGame = true;
        }
    });
    return inGame;
}

/* Game "class" */

function Game(socketId, username, options) {
    
    // Game ID
    this.gameId = generateGameId();
    while(typeof this.gameId === 'undefined') {
        this.gameId = generateGameId();
    }
    
    // Members array
    this.players = [];
    this.players[socketId] =
    {
        username  : username,
        team      : 'spectator',
        permission: 1,
    };
    
    // Options
    this.options = [];
    
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

// Returns a list of usernames for a certain team
Game.prototype.getTeam = function(team) {
    
    var players = [];
    this.players.forEach(function(value, index) {
        if(value.team === team) {
            players.push(value.username);
        }
    });
    return players;
}

// Starts the game when everyone is ready
Game.prototype.start = function() {
    if(!this.start) {
        // Start game
        console.log('I would start the game');
    }
}

// Stops the game
Game.prototype.end = function() {
    // Stop game
    console.log('I would stop the game');
}

// Makes a player join a game
Game.prototype.playerJoin = function(socket, username) {
    
    var socketId = socket.id;
    
    // Determine which team new guy should go on
    var blueCount = this.getTeam('blue').length;
    var redCount  = this.getTeam('red').length;
    
    if(blueCount < redCount) {
        var team = 'blue';
    } else {
        var team = 'red';
    }
    
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
    delete this.players[socketId];
}