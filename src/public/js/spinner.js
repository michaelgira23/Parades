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

// Requires jQuery
(function() {
	$spinnerTrigger = $('.spinner-trigger');
	$spinner        = $('.spinner');
	
	$spinnerTrigger.click(function() {
		var category = getRandomJSONIndex(categories);
		var values   = categories[category];
		console.log(category, values);
	});
})();

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