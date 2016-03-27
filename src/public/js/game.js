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

var socket = io();
var timer  = 0; // Time on timer in seconds

var $frames = $('.frame');

/* Menu */
var $menuFrame      = $('.menu-frame');
var $titleHeader    = $('.menu-frame .menu-title h1');
var $menuSelections = $('.menu-frame .menu-selections');
var $createGame     = $('.menu-frame .menu-selections div:first-child');
var $joinGame       = $('.menu-frame .menu-selections div:last-child');
var $usernameForm   = $('.menu-frame .inputUsername');
var $usernameInput  = $('.menu-frame .inputUsername .username');
var $usernameButton = $('.menu-frame .inputUsername button');

/* Create Game */
var $createGameFrame = $('.createGame-frame');
var $startGameButton = $('.createGame-frame .createGame-start');
var $roundTime       = $('.createGame-frame .createGame-options .roundTime');

/* Game Code */
var $gameCodeFrame  = $('.gameCode-frame');
var $gameCode       = $('.gameCode-frame .gameCode-code');
var $gameCodeReady  = $('.gameCode-frame .gameCode-ready');
var $gameCodeCancel = $('.gameCode-frame .gameCode-cancel');

/* Join Game */
var $joinGameFrame  = $('.joinGame-frame');
var $joinGameBack   = $('.joinGame-frame .back-header .back-to-menu');
var $joinGameError  = $('.joinGame-frame .back-header .wrong-gameCode');
var $joinGameForm   = $('.joinGame-frame .joinGame-submitCode');
var $joinGameCode   = $('.joinGame-frame .joinGame-submitCode input')
var $joinGameButton = $('.joinGame-frame .joinGame-submitCode button');

/* Actual Game */
var $gameFrame        = $('.game-frame');
var $gameOverlay      = $('.game-frame .game-startOverlay');
var $gameStartNumbers = $('.game-frame .game-startOverlay .game-startingNumbers');
var $gameTeamColor    = $('.game-frame .game-header .team-color');
var $gameBlueScore    = $('.game-frame .game-header .game-score .game-blueScore .blue-score');
var $gameRedScore     = $('.game-frame .game-header .game-score .game-redScore .red-score');
var $gameCodeCard     = $('.game-frame .game-header .game-gameCode');
var $gameGameCode     = $('.game-frame .game-header .game-gameCode strong');
var $gameCategory     = $('.game-frame .game-round .game-category strong');
var $gameTimer        = $('.game-frame .game-round .game-timer');
var $guessedCorrect   = $('.game-frame .game-round .guessed-correct');
var $leaveGame        = $('.game-frame .leave-game');

/* Team Lists */
var $teamBlue = $('.team-blue');
var $teamRed  = $('.team-red');

function showMenu() {
    $titleHeader.css('top', '-100vh');
    // Hide frames in case we have to skip multiple
    $frames.not('.active').not($menuFrame).css('visibility', 'hidden');
    $frames.removeClass('active');
    
    // Transition frames to the right
    $frames.not($menuFrame).animate({
        right: '-100%'
    }, 600, 'easeOutCubic', function() {
        $frames.css('visibility', 'visible');
    });
    
    // Show Menu
    $menuFrame.animate({
        right: 0
    }, 600, 'easeOutCubic', function() {
        $menuFrame.addClass('active');
    });
    
    // Trigger the bounce animation for the menu title
    $titleHeader.delay(100).animate({
        top: 0
    }, 1500, 'easeOutBounce');
}

function transitionLeft($fromFrame, $toFrame) {
    $frames.removeClass('active');
    
    // Transition original frame to the right
    $fromFrame.animate({
        right: '-100%'
    }, 600, 'easeOutCubic');
    
    // Bring next frame from the left
    $toFrame.animate({
        right: 0
    }, 600, 'easeOutCubic', function() {
        $toFrame.addClass('active');
    });
}

function transitionRight($fromFrame, $toFrame) {
    $frames.removeClass('active');
    
    // Transition original frame to the left
    $fromFrame.animate({
        right: '100%'
    }, 600, 'easeOutCubic');
    
    
    // Bring next frame from the right
    $toFrame.animate({
        right: 0
    }, 600, 'easeOutCubic', function() {
        $toFrame.addClass('active');
    });
}

function updateGameStatus(gameStatus) {
    // Update scoreboard
    $gameBlueScore.text(gameStatus.score.blue);
    $gameRedScore.text(gameStatus.score.red);
    
    // Update current round
    console.log(gameStatus.round.category);
    $gameCategory.text(gameStatus.round.category);
    timer = gameStatus.round.currentTime;
    updateTimer(timer);
}

function updatePlayerList(players) {
    
    $teamBlue.html('');
    $teamRed.html('');
    var blueTeam = players.blue;
    var redTeam  = players.red;
    
    for(var i = 0; i < players.blue.length; i++) {
        $teamBlue.append('<li class="list-group-item list-group-item-info">' + players.blue[i] + '</li>');
    }
    for(var i = 0; i < players.red.length; i++) {
        $teamRed.append('<li class="list-group-item list-group-item-danger">' + players.red[i] + '</li>');
    }
}

function updatePlayerStatus(playerData) {
    $gameTeamColor.removeClass('blue').removeClass('red').addClass(playerData.team);
}

function updateTimer(seconds) {
    console.log(seconds);
    if(seconds < 0) {
        seconds = 0;
    }
    
    var secondValue = seconds % 60;
    var minuteValue = (seconds - secondValue) / 60;
    
    // Add leading zero
    var secondString = secondValue.toString();
    if(secondString.length < 2) {
        secondString += '0';
    }
    
    $gameTimer.text(minuteValue + ':' + secondString);
}

function startingAnimation() {
    $gameOverlay.fadeIn();
    $gameStartNumbers.delay(1000).show().text('3');
    $gameStartNumbers.delay(2000).text('2');
    $gameStartNumbers.delay(3000).text('1');
    $gameStartNumbers.delay(4000).text('GO!');
    $gameOverlay.delay(5000).fadeOut();
    $gameStartNumbers.delay(6000).hide();
}

/* Make the buttons work */

$('.back-to-menu').click(showMenu);

// Menu

// Disable button when input is empty
$usernameInput.bind('keydown keyup', function(event) {
    $usernameButton.prop('disabled', this.value === '');
});

// Emit username when the form is submitted
$usernameForm.submit(function(event) {
    event.preventDefault();
    socket.emit('username', $usernameInput.val());
    $usernameForm.fadeOut();
    $menuSelections.delay(400).fadeIn();
});

$createGame.click(function() {
    transitionRight($menuFrame, $createGameFrame);
});

$joinGame.click(function() {
    transitionRight($menuFrame, $joinGameFrame);
});

// Create Game

$startGameButton.click(function() {
    var roundTime = parseInt($roundTime.val(), 10);
    socket.emit('create game', {
        roundTime: roundTime
    });
    
    socket.on('game id', function(id) {
        $gameCode.text(id);
        $gameGameCode.text(id);
        transitionRight($createGameFrame, $gameCodeFrame);
    });
});

// Game Code

$gameCodeReady.click(function() {
    $gameCodeCard.show();
    $guessedCorrect.show();
    transitionRight($gameCodeFrame, $gameFrame);
});

$gameCodeCancel.click(function() {
    socket.emit('leave game');
    transitionLeft($gameCodeFrame, $createGameFrame);
});

// Join Game

// Disable button when input is empty
$joinGameCode.bind('keydown keyup', function(event) {
    $joinGameButton.prop('disabled', this.value === '');
});

// Emit 'join game' when the form is submitted
$joinGameForm.submit(function(event) {
    event.preventDefault();
    socket.emit('join game', $joinGameCode.val());
    
    socket.on('join game response', function(success, playerData, gameData) {
        if(success) {
            $joinGameError.fadeOut();
            
            // Prepare game
            updatePlayerStatus(playerData);
            updateGameStatus(gameData);
            
            transitionRight($joinGameFrame, $gameFrame);
        } else {
            $joinGameError.fadeIn();
        }
    });
});

$joinGameBack.click(function() {
    $joinGameError.fadeOut();
});

// Actual Game

$leaveGame.click(function() {
    socket.emit('leave game');
    showMenu();
    $gameCodeCard.hide();
    $guessedCorrect.hide();
});

socket.on('game status', updateGameStatus);
socket.on('player list', updatePlayerList);

/* Actually do stuff */

$menuFrame.css('right', 0);
$menuSelections.hide();
$usernameButton.prop('disabled', $usernameInput.val() === '');

$joinGameButton.prop('disabled', $joinGameCode.val() === '');
$joinGameError.hide();

$gameCodeCard.hide();
$guessedCorrect.hide();

$gameOverlay.hide();
$gameStartNumbers.hide();
updateTimer(timer);

showMenu();

socket.on('debug', function(data) {
    console.log('debug');
    console.log(data);
});