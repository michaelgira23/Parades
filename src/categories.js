var Random = require("random-js");
var random = new Random(Random.engines.mt19937().autoSeed());
var _      = require('underscore');

// Move to database later maybe
var categories =
{
	'Superheroes': [
		'Squirrel Girl',
		'The Dog-Welder',
		'Big Bertha',
		'Howard the Duck',
		'Brother Power the Geek',
		'Dazzler'
	],

	'Cool people': [
		'Not parker',
		'Michael',
        'Surprisingly, Michael'
	],

    'Oldie Music': [
        'Old Time Rock and Roll',
        'Yellow Submarine',
        'White Room',
		'Pinball Wizard',
		'Like a Rolling Stone'
    ],
	
	'Memes': [
		'Pepe',
		'Spoodermen',
		'None of my business',
		'Most interesting man alive',
		'Willy Wonka'
	]
};

/* Returns an array of categories */

function getCategories() {
    var categoryList = [];
    _.each(categories, function(value, key) {
        categoryList.push(key);
    });
    return categoryList;
}

/* Returns an array of values from a certain category */

function getValues(category) {
    return typeof categories[category] === 'undefined' ? false : categories[category];
}

/* Returns a random category */

function getRandomCategory() {
    var categoryList = getCategories();
    var index = random.integer(0, categoryList.length - 1);
    return categoryList[index];
}

/* Returns a random value from a category */

function getRandomValue(category) {
    var values = getValues(category);
    if(values) {
        var index = random.integer(0, values.length - 1);
        return values[index];
    } else {
        return false;
    }
}

module.exports.getCategories     = getCategories;
module.exports.getValues         = getValues;
module.exports.getRandomCategory = getRandomCategory;
module.exports.getRandomValue    = getRandomValue;
