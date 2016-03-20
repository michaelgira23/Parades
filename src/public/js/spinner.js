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

// Dummy Parades category
var categories =
{
	'Superheroes': [
		'Supermanny',
		'Manbat',
		'Spooderman',
		'Phil',
		'Arm-fall-off-man',
	],

	'Cool people': [
		'Not parker',
		'Michael',
	]
};

// Requires jQuery and the jQuery Easing Plugin
function spin() {
	var $spinner         = $('.spinner');
    var $spinnerCategory = $('.spinner-category');
	var $spinnerTrigger  = $('.spinner-trigger');
	
	$spinnerTrigger.click(function() {
		var category = getRandomJSONIndex(categories);
		var values   = categories[category];
		var chosen   = getRandomFromArray(values);
        
        $spinner.html('');
        $spinnerCategory.text(category);
        
        // Create card that will be chosen
        $spinner.append('<div class="chosen card">' + chosen + '</div>');
        var $chosenCard = $('.card.chosen');
        
        var cardsOnEachSide = 50;
        
        // Append other decoy cards
        for(var i = 0; i < cardsOnEachSide; i++) {
            var card = '<div class="card">' + getRandomFromArray(values) + '</div>';
            $spinner.append(card);
            $chosenCard.before(card);
        }
        
        var $cards    = $spinner.find('.card');
        var $lastCard = $cards.last();
        
        // Get width of decoy cards, so we know by how much we should slide
        var cardsWidth = 0;
        for(var i = 0; i < cardsOnEachSide - 1; i++) {
            cardsWidth += $cards.eq(i).outerWidth();
        }
        
        // Spin animation
        
        $lastCard.css('marginRight', cardsWidth * 2);
        $lastCard.animate({
            marginRight: 0,
        }, 3000, 'easeOutQuint', function() {
            $chosenCard.addClass('card-success');
            $chosenCard.animate({
                marginLeft : cardsWidth,
                marginRight: cardsWidth,
            });
        });
        
	});
}

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}
	
function getRandomFromArray(array) {
	return array[getRandomInt(0, array.length)];
}

function getRandomJSONIndex(json) {
	var listOfIndexes = [];
	
	for(var category in categories) {
		listOfIndexes.push(category);
	}
	return getRandomFromArray(listOfIndexes);
}