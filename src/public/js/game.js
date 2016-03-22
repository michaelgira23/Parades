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

var $frames = $('.frame');

/* Menu */
var $menuFrame   = $('.menu-frame');
var $titleHeader = $('.menu-title h1');
var $createGame  = $('.menu-selections div:first-child');
var $joinGame    = $('.menu-selections div:last-child');

/* Create Game */
var $createGameFrame = $('.createGame-frame');
var $startGameButton = $('.createGame-frame .createGame-start');

/* Game Code */
var $gameCodeFrame  = $('.gameCode-frame');
var $gameCodeReady  = $('.gameCode-frame .gameCode-ready');
var $gameCodeCancel = $('.gameCode-frame .gameCode-cancel');

/* Join Game */
var $joinGameFrame  = $('.joinGame-frame');
var $joinGameButton = $('.joinGame-frame button');

/* Actual Game */
var $gameFrame = $('.game-frame'); // Your game-frame frame game is lame
var $leaveGame = $('.game-frame .leave-game'); // Lame

function showMenu() {
    $titleHeader.css('top', '-100vh');
    $frames.not('.active').css('visibility', 'hidden');
    $frames.removeClass('active');
    
    $frames.not($menuFrame).animate({
        right: '-100%'
    }, 600, 'easeOutCubic', function() {
        
        $frames.css('visibility', 'visible');
        
        $menuFrame.animate({
            right: 0
        }, 600, 'easeOutCubic', function() {
            $menuFrame.addClass('active');
        });
        
        $titleHeader.animate({
            top: 0
        }, 1500, 'easeOutBounce');
        
    });
}

function transitionLeft($fromFrame, $toFrame) {
    $frames.removeClass('active');
    
    $fromFrame.animate({
        right: '-100%'
    }, 600, 'easeOutCubic', function() {
        
        $toFrame.animate({
            right: 0
        }, 600, 'easeOutCubic', function() {
            $toFrame.addClass('active');
        });
    });
}

function transitionRight($fromFrame, $toFrame) {
    $frames.removeClass('active');
    
    $fromFrame.animate({
        right: '200%'
    }, 600, 'easeOutCubic', function() {
        
        $toFrame.animate({
            right: 0
        }, 600, 'easeOutCubic', function() {
            $toFrame.addClass('active');
        });
    });
}

/* Make the buttons work */

$('.back-to-menu').click(showMenu);

// Menu

$createGame.click(function() {
    transitionRight($menuFrame, $createGameFrame);
});

$joinGame.click(function() {
    transitionRight($menuFrame, $joinGameFrame);
});

// Create Game

$startGameButton.click(function() {
    // Do some logic to start a game with options
    transitionRight($createGameFrame, $gameCodeFrame);
});

// Game Code

$gameCodeReady.click(function() {
    transitionRight($gameCodeFrame, $gameFrame);
});

$gameCodeCancel.click(function() {
    // Do some logic to stop the game
    transitionLeft($gameCodeFrame, $createGameFrame);
});

// Join Game

$joinGameButton.click(function() {
    transitionRight($joinGameFrame, $gameFrame);
});

// Actual Game

$leaveGame.click(function() {
    // Do some logic to leave Parades game
    showMenu();
});

/* Actually do stuff */

$menuFrame.css('right', 0);
showMenu();