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
var pendingStealResponse = false;

module.exports = function(io) {

    io.on('connection', function(socket) {
        socket.on('username', function(username) {
            var permission = 0;
            
            socket.on('create game', function(options) {
                if(!playerInGame(socket.id)) {
                    
                    var gameId = initializeGame(io, socket.id, username, options);
                    var game   = games[gameId];
                    permission = 1;
                    
                    socket.emit('game id', gameId);
                    
                    socket.on('change category', function() {
                        if(permission === 1 && gameExists(gameId) && !game.inRound) {
                            game.chooseCategory();
                            game.drawValue();
                            game.emitGuessing();
                        }
                    });

                    socket.on('change value', function() {
                        if(permission === 1 && gameExists(gameId) && !game.inRound) {
                            game.drawValue();
                            game.emitGuessing();
                        }
                    });

                    socket.on('game ready', function() {
                        if(permission === 1 && gameExists(gameId) && !game.inRound) {
                            game.startRound();
                        }
                    });

                    socket.on('guessed correct', function() {
                        if(permission === 1 && gameExists(gameId) && game.inRound) {
                            game.endRound();
                        }
                    });
                    
                    socket.on('steal round', function(success) {
                        if(permission === 1 && gameExists(gameId) && pendingStealResponse) {
                            if(success) {
                                // Opposite team should get the score
                                if(game.round.team === 'blue') {
                                    var stealTeam = 'red';
                                } else {
                                    var stealTeam = 'blue';
                                }
                                game.score[stealTeam]++;
                                success = true;
                            } else {
                                success = false;
                            }
                            game.emitStatus();
                            game.emit('stole round', {
                                team   : pendingStealResponse,
                                success: success,
                            });
                            pendingStealResponse = false;
                            setTimeout(function() {
                                game.resetRound();
                            }, 5000);
                        }
                    });

                    socket.on('leave game', function() {
                        if(gameExists(gameId)) {
                            permission = 0;
                            game.endGame();
                        }
                    });

                    // Also stop game if leader disconnects
                    socket.on('disconnect', function() {
                        if(gameExists(gameId)) {
                            permission = 0;
                            game.endGame();
                        }
                    });
                }
            });

            socket.on('join game', function(gameId) {
                if(!playerInGame(socket.id) && gameExists(gameId)) {
                    
                    var permission = 0;
                    var game = games[gameId];
                    game.playerJoin(socket, username);
                    
                    // Send player data and game data
                    socket.emit('join game response', true, game.players[socket.id], game.getStatus());

                    socket.on('leave game', function() {
                        if(gameExists(gameId)) {
                            game.playerLeave(socket.id);
                        }
                    });

                    // Leave if player disconnects
                    socket.on('disconnect', function() {
                        if(gameExists(gameId)) {
                            game.playerLeave(socket.id);
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
    this.io = io;

    // Game ID
    this.gameId = generateGameId();
    while(gameExists(this.gameId)) {
        this.gameId = generateGameId();
    }

    // Members array
    this.leaderId = socketId;
    this.leader   =
    {
        username  : username,
        team      : 'spectator',
    };
    this.players = {};
    this.players[socketId] = this.leader;

    // Options
    this.options = {};

    // Round Time
    if(typeof options.roundTime === 'number' && options.roundTime !== NaN) {
        this.options.roundTime = options.roundTime;
    } else {
        this.options.roundTime = 90;
    }

	// Same Category
	if(!options.sameCategory) {
		this.options.sameCategory = false;
	} else {
		this.options.sameCategory = true;
	}

    // General values
    this.score = {};
    this.score.blue = 0;
    this.score.red  = 0;

    this.round = {};

    // Generate random team
    if(random.integer(0, 1)) {
        this.round.team  = 'blue';
    } else {
        this.round.team  = 'red';
    }

    this.round.currentTime = this.options.roundTime;
    // Sets both round.category and round.guessing
    this.drawValue();
    
    this.inRound = false;

    this.emitStatus();
    this.emitPlayers();
    this.emitGuessing();
	
	console.log('Game created with the Game ID of ' + this.gameId);
}

// Returns a JSON containing stats about the current round
Game.prototype.getStatus = function() {
    var response = {};

    response.leader = this.leader;
    response.score = this.score;
    response.inRound = this.inRound;
    
    response.round = {};
    response.round.team = this.round.team;
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

// Emits something only to the leader
Game.prototype.emitToLeader = function(event, data) {
    this.io.to(this.leaderId).emit(event, data);
}

// Emits something to everyone EXCEPT the leader
Game.prototype.emitExceptLeader = function(event, data) {
	var that = this;
    var io = this.io;
    _.each(this.players, function(value, key) {
		if(key !== that.leaderId) {
        	io.to(key).emit(event, data);
		}
    });
}

// Emit to leader category and value they're guessing
Game.prototype.emitGuessing = function() {
    this.emitToLeader('guessing', {
        team    : this.round.team,
        category: this.round.category,
        value   : this.round.guessing,
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

// Draws a random category and returns it
Game.prototype.chooseCategory = function() {
    this.round.category = categories.getRandomCategory();
    return this.round.category;
}

// Draws a random value to guess, also chooses a category if it is unset
Game.prototype.drawValue = function() {
    if(typeof this.round.category === 'undefined') {
        this.chooseCategory();
    }
    this.round.guessing = categories.getRandomValue(this.round.category);
    return this.round.guessing;
}

// Starts a new round
Game.prototype.startRound = function() {
    if(!this.inRound) {
        // this.emit is out of scope in setTimeout function
        var that = this;

        this.emitStatus();
        this.emitGuessing();
        this.emit('start animation');
        this.inRound = true;

        // Starting animation takes 5 seconds
        this.round.currentTime = this.options.roundTime;
        
        setTimeout(function() {
            that.emit('count down', that.round.currentTime);

            that.timer = setInterval(function() {
                if(that.round.currentTime - 1 < 0) {
                    // Round is over
                    that.endRound();
                } else {
                    that.round.currentTime--;
                }
            }, 1000);
        }, 5000);
    }
}

Game.prototype.endRound = function() {
    if(this.inRound && typeof this.timer !== 'undefined') {
        
        this.inRound = false;
        clearInterval(this.timer);
        this.emit('stop timer', this.round.currentTime);

        if(this.round.currentTime <= 0) {
            // Team lost
            // Determine which team can "steal" the round
            if(this.round.team === 'blue') {
                var stealTeam = 'red';
            } else {
                var stealTeam = 'blue';
            }
            
            pendingStealResponse = stealTeam;
            this.emit('team steal', {
                team     : this.round.team,
                stealTeam: stealTeam,
            });
        } else {
            // Team won
            this.emit('team won', this.round.team);
            
            this.score[this.round.team]++;
            this.emitStatus();
            
            var that = this;
            setTimeout(function() {
                that.resetRound();
            }, 5000);
        }
    }
}

Game.prototype.resetRound = function() {
    // Alternate teams
    if(this.round.team === 'blue') {
        this.round.team = 'red';
    } else {
        this.round.team = 'blue';
    }
	if(!this.options.sameCategory) {
		this.chooseCategory();
	}
    this.drawValue();
    this.emitStatus();
    this.emitGuessing();
    this.emitToLeader('reset round');
}

// Stops the game
Game.prototype.endGame = function() {
    this.emitExceptLeader('end game');
	console.log('Game ' + this.gameId + ' ended! Final Score: Blue - ' + this.score.blue + ' Red - ' + this.score.red);
    delete games[this.gameId];
}

// Makes a player join a game
Game.prototype.playerJoin = function(socket, username) {
	
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
    delete this.players[socketId];
    this.emitPlayers();
}
