// Move to database later maybe
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
        'Surprisingly, Michael',
	],

    'Weird Song': [
        'Song 1',
        'Song 2',
        'Everything in Dawson\'s playlist',
    ],
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
