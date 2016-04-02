/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Michael Gira
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var Random = require("random-js");
var random = new Random(Random.engines.mt19937().autoSeed());
var _      = require('underscore');

var categories = require(__dirname + '/categories.js');

var games  = module.exports.games = {};
var gameCodeLength = 4;

module.exports = function(io) {

    io.on('connection', function(socket) {
        socket.on('username', function(username) {

            socket.on('create game', function(options) {
                if(!playerInGame(socket.id)) {

                    var gameId = initializeGame(io, socket.id, username, options);
                    socket.emit('game id', gameId);

                    socket.on('start game', function() {
                        if(gameExists(gameId)) {
                            games[gameId].startGame();
                        }
                    });

                    socket.on('guessed correct', function() {
                        if(gameExists(gameId)) {

                        }
                    });

                    socket.on('leave game', function() {
                        if(gameExists(gameId)) {
                            games[gameId].endGame();
                        }
                    });

                    // Also stop game if leader disconnects
                    socket.on('disconnect', function() {
                        if(gameExists(gameId)) {
                            games[gameId].endGame();
                        }
                    });
                }
            });

            socket.on('join game', function(gameId) {
                if(!playerInGame(socket.id) && gameExists(gameId)) {

                    games[gameId].playerJoin(socket, username);
                    // Send player data and game data
                    socket.emit('join game response', true, games[gameId].players[socket.id], games[gameId].getStatus());

                    socket.on('leave game', function() {
                        if(gameExists(gameId)) {
                            games[gameId].playerLeave(socket.id);
                        }
                    });

                    // Leave if player disconnects
                    socket.on('disconnect', function() {
                        if(gameExists(gameId)) {
                            games[gameId].playerLeave(socket.id);
                        }
                    });
                } else {
                    socket.emit('join game response', false, null, null);
                }
            });
        });
    });
}

/* Determine if a game already exists */
function gameExists(id) {
    return typeof games[id] !== 'undefined';
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
function initializeGame(io, socketId, username, options) {
    console.log('Initialize Game');
    var newGame = new Game(io, socketId, username, options);
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

function Game(io, socketId, username, options) {
    console.log('Create game instance');
    this.io = io;

    // Game ID
    this.gameId = generateGameId();
    while(gameExists(this.gameId)) {
        this.gameId = generateGameId();
    }

    // Members array
    this.leader  = username;
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

    this.round = {};
    this.round.team  = 'Blue';
    this.round.category    = 'Unknown';
    this.round.guessing    = 'Unknown';
    this.round.currentTime = this.options.roundTime;

    this.gameStarted = false;
    this.inRound     = false;

    this.emitStatus();
    this.emitPlayers();
}

// Returns a JSON containing stats about the current round
Game.prototype.getStatus = function() {
    var response = {};

    response.leader = this.leader;

    response.score = {};
    response.score.blue = this.blueScore;
    response.score.red  = this.redScore;

    response.inRound = this.inRound;
    response.round = {};
    response.round.category = this.round.category;
    response.round.currentTime = this.round.currentTime;

    return response;
}

// Emits something to everyone in the game
Game.prototype.emit = function(event, data) {
    var io = this.io;
    _.each(this.players, function(value, key) {
        io.to(key).emit(event, data);
    });
}

// Emits an array of players to everyone in the game
Game.prototype.emitPlayers = function() {
    var playersList  = {};

    playersList.blue = [];
    playersList.red  = [];
    playersList.spectator = [];

    _.each(this.players, function(value, key) {
        playersList[value.team].push(value.username);
    });

    this.emit('player list', playersList);
}

// Emits game status to all players in the game
Game.prototype.emitStatus = function() {
    this.emit('game status', this.getStatus());
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
Game.prototype.startGame = function() {
    if(!this.gameStarted) {
        this.startRound();
    }
}

Game.prototype.chooseCategory = function() {
    if(this.round.category === 'Unknown') {
        this.round.category = getRandomCategory;
    }
}

// Starts a new round
Game.prototype.startRound = function() {
    console.log('Start game');
    // this.emit is out of scope in setTimeout function
    var that = this;
    this.gameStarted = true;

    this.emitStatus();
    this.emit('start animation');

    // Starting animation takes 5 seconds
    this.round.currentTime = this.options.roundTime;
    this.inRound = true;
    setTimeout(function() {
        that.emit('count down', that.round.currentTime);

        that.timer = setInterval(function() {
            if(--that.round.currentTime <= 0) {
                // Round is over
                that.endRound();
            }
        }, 1000);
    }, 5000);
}

Game.prototype.endRound = function() {
    if(this.inRound && typeof this.timer !== 'undefined') {
        this.inRound = false;
        clearInterval(this.timer);

        var timeLeft = this.options.roundTime - this.round.currentTime;

        if(timeLeft <= 0) {
            // Team lost

            // Determine which team can "steal" the round
            if(this.round.team === 'blue') {
                var stealTeam = 'red';
            } else {
                var stealTeam = 'blue';
            }

            this.emit('team steal', stealTeam);
        } else {
            // Team won
            this.emit('team won', this.round.team);
        }
    }
}

// Stops the game
Game.prototype.endGame = function() {
    console.log('End game');
    this.emit('end game');
    delete games[this.gameId];
}

// Makes a player join a game
Game.prototype.playerJoin = function(socket, username) {
    console.log('Player ' + username + ' joined');

    // Determine which team new guy should go on
    var blueCount = this.getTeam('blue').length;
    var redCount  = this.getTeam('red').length;

    if(blueCount > redCount) {
        var team = 'red';
    } else {
        var team = 'blue';
    }

    this.players[socket.id] =
    {
        username  : username,
        team      : team,
        permission: 0,
    };

    this.emitPlayers();
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
    console.log('Player left');
    delete this.players[socketId];
    this.emitPlayers();
}
