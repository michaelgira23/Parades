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
var leader = false;
var timer;

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

/* Choose Category */
var $categoryFrame     = $('.chooseCategory-frame');
var $guessingCategory  = $('.chooseCategory-frame .category .guessingCategory');
var $guessingTeam      = $('.chooseCategory-frame .guessing .guessingTeam');
var $guessingValue     = $('.chooseCategory-frame .guessing .guessingValue');
var $guessingGameReady = $('.chooseCategory-frame .gameReady');
var $anotherCategory   = $('.chooseCategory-frame .anotherCategory');
var $anotherValue      = $('.chooseCategory-frame .anotherValue');

/* Actual Game */
var $gameFrame          = $('.game-frame');
var $gameOverlay        = $('.game-frame .game-startOverlay');
var $gameStartNumbers   = $('.game-frame .game-startOverlay .game-startingNumbers');
var $gameOverlayMessage = $('.game-frame .game-startOverlay .game-overlayMessage');
var $gameTeamColor      = $('.game-frame .game-header .team-color');
var $gameBlueScore      = $('.game-frame .game-header .game-score .game-blueScore .blue-score');
var $gameRedScore       = $('.game-frame .game-header .game-score .game-redScore .red-score');
var $gameGameCodeLabel  = $('.game-frame .game-header .game-gameCode span')
var $gameGameCode       = $('.game-frame .game-header .game-gameCode strong');
var $gameCategory       = $('.game-frame .game-round .game-category strong');
var $gameTimer          = $('.game-frame .game-round .game-timer');
var $guessedCorrect     = $('.game-frame .game-round .guessed-correct');
var $gameGuessingLabel  = $('.game-frame .game-round .game-guessing');
var $gameGuessingTeam   = $('.game-frame .game-round .game-guessing strong:first-child');
var $gameGuessingValue  = $('.game-frame .game-round .game-guessing strong:last-child');
var $gameStealWrong     = $('.game-frame .game-round .steal-wrong');
var $gameStealRight     = $('.game-frame .game-round .steal-right');
var $leaveGame          = $('.game-frame .leave-game');

/* Team Lists */
var $teamBlue = $('.team-blue');
var $teamRed  = $('.team-red');

String.prototype.capitalize = function() {
    return this[0].toUpperCase() + this.slice(1);
}

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

    if(!leader) {
        $gameGameCodeLabel.text('Leader is');
        $gameGameCode.text(gameStatus.leader.username);
    }

    // Update current round
    $gameCategory.text(gameStatus.round.category);
    if(gameStatus.inRound) {
        countDownTimer(gameStatus.round.currentTime);
    } else {
        updateTimer(gameStatus.round.currentTime);
    }
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

function updateGuessing(guessing) {
    // Capitalize team
    var team = guessing.team.capitalize();
    
    $guessingCategory.text(guessing.category);
    $guessingTeam.text(team + ' Team');
    $guessingValue.text(guessing.value);
    
    $gameGuessingTeam.text(team + ' Team');
    $gameGuessingValue.text(guessing.value);
}

function updateTimer(seconds) {
    if(seconds < 0) {
        seconds = 0;
    }

    var secondValue = seconds % 60;
    var minuteValue = (seconds - secondValue) / 60;

    // Add leading zero
    var secondString = secondValue.toString();
    if(secondString.length < 2) {
        secondString = '0' + secondString;
    }

    $gameTimer.text(minuteValue + ':' + secondString);
}

// Will count down the number of seconds on the timer
function countDownTimer(seconds) {
    updateTimer(seconds);
    timer = setInterval(function() {

        // Stop timer if person left the game
        if(!$gameFrame.hasClass('active')) {
            clearInterval(timer);
        }
        if(--seconds >= 0) {
            updateTimer(seconds);
        }
    }, 1000);
}

// Animation that count down. Takes 5 seconds.
function startingAnimation() {
    $gameOverlay.fadeIn('500');
    setTimeout(function() {
        $gameStartNumbers.text('3').show();
        setTimeout(function() {
            $gameStartNumbers.text('2');
            setTimeout(function() {
                $gameStartNumbers.text('1');
                setTimeout(function() {
                    $gameStartNumbers.text('GO!');
                    setTimeout(function() {
                        $gameOverlay.fadeOut('500');
                        setTimeout(function() {
                            $gameStartNumbers.hide();
                            if(leader) {
                                $guessedCorrect.fadeIn();
                            }
                        }, 500);
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 1000);
    }, 500);
}

// Display a message using the fade overlay. Lasts 1 second more than the given milliseconds
function displayMessage(milliseconds, message) {
    $gameOverlayMessage.text(message).show();
    $gameOverlay.fadeIn('500');
    setTimeout(function() {
        $gameOverlay.fadeOut('500');
        $gameOverlayMessage.hide();
    }, milliseconds);
}

/* Make the buttons work */

$('.back-to-menu').click(showMenu);

/* Menu */

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

/* Create Game */

$startGameButton.click(function() {
    leader = true;
    var roundTime = parseInt($roundTime.val(), 10);
    socket.emit('create game', {
        roundTime: roundTime
    });

    socket.on('game id', function(id) {
        $gameCode.text(id);
        $gameGameCodeLabel.text('Gamecode');
        $gameGameCode.text(id);
        transitionRight($createGameFrame, $gameCodeFrame);
    });
});

/* Game Code */

$gameCodeReady.click(function() {
    $gameGuessingLabel.show();
    transitionRight($gameCodeFrame, $categoryFrame);
});

$gameCodeCancel.click(function() {
    socket.emit('leave game');
    transitionLeft($gameCodeFrame, $createGameFrame);
});

/* Choose Categories */

$guessingGameReady.click(function() {
    transitionRight($categoryFrame, $gameFrame);
    setTimeout(function() {
        socket.emit('game ready');
    }, 800);
});

$anotherCategory.click(function() {
    socket.emit('change category');
});

$anotherValue.click(function() {
    console.log('help')
    socket.emit('change value');
});

/* Join Game */

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

/* Actual Game */

$guessedCorrect.click(function() {
    socket.emit('guessed correct');
});

$gameStealWrong.click(function() {
    socket.emit('steal round', false);
});

$gameStealRight.click(function() {
    socket.emit('steal round', true);
});

$leaveGame.click(function() {
    socket.emit('leave game');
    showMenu();
    $guessedCorrect.hide();
    $gameGuessingLabel.hide();
    leader = false;
});

// Update values
socket.on('game status', updateGameStatus);
socket.on('player list', updatePlayerList);
socket.on('guessing', updateGuessing);

// Game components
socket.on('start animation', startingAnimation);
socket.on('count down', countDownTimer);
socket.on('stop timer', function(seconds) {
    clearInterval(timer);
    updateTimer(seconds);
    $guessedCorrect.fadeOut();
});

// End of round messages
socket.on('team won', function(team) {
    displayMessage(team.capitalize() + ' Team won!');
});

socket.on('team steal', function(teams) {
    displayMessage(2000, teams.team.capitalize() + ' Team lost!');
    setTimeout(function() {
        displayMessage(4000, teams.stealTeam.capitalize() + ' Team has the chance to steal the round.');
        setTimeout(function() {
            $gameStealWrong.fadeIn();
            $gameStealRight.fadeIn();
        }, 5000);
    }, 3000);
});

socket.on('stole round', function(stealers) {
    if(stealers.success) {
        displayMessage(4000, stealers.team + ' guessed correctly!');
    } else {
        displayMessage(4000, stealers.team + ' guessed wrongly!');
    }
});

/* Actually do stuff */

$menuFrame.css('right', 0);
$menuSelections.hide();
$usernameButton.prop('disabled', $usernameInput.val() === '');

$joinGameButton.prop('disabled', $joinGameCode.val() === '');
$joinGameError.hide();

$guessedCorrect.hide();
$gameGuessingLabel.hide();
$gameOverlay.hide();
$gameStartNumbers.hide();
$gameOverlayMessage.hide();
$gameStealWrong.hide();
$gameStealRight.hide();
updateTimer(0);

showMenu();

socket.on('debug', function(data) {
    console.log('debug');
    console.log(data);
});
