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

var $frames      = $('.frame');

/* Menu */
var $menuFrame   = $('.menu-frame');
var $titleHeader = $('.menu-title h1');
var $createGame  = $('.menu-selections div:first-child');
var $joinGame    = $('.menu-selections div:last-child');

/* Create Game */
var $createFrame = $('.createGame-frame');

function showMenu() {
    $titleHeader.css('top', '-100vh');
    $frames.removeClass('active');
    
    $frames.not('.menu-frame').animate({
        right: '-100vw'
    }, 600, 'easeOutCubic', function() {
        
        $menuFrame.animate({
            left: 0
        }, 600, 'easeOutCubic', function() {
            $menuFrame.addClass('active');
        });
        
        $titleHeader.animate({
            top: 0
        }, 1500, 'easeOutBounce');
    });
    
    $createGame.click(createGame);
    $joinGame.click(joinGame);
}

function createGame() {
    $frames.removeClass('active');
    
    $menuFrame.animate({
        left: '-100vw'
    }, 600, 'easeOutCubic', function() {
        
        $createFrame.animate({
            right: 0
        }, 600, 'easeOutCubic', function() {
            $createFrame.addClass('active');
        });
    });
    
}

function joinGame() {
    
}

$('.back-to-menu').click(showMenu);

// Actual logic

$menuFrame.css('right', 0);
showMenu();