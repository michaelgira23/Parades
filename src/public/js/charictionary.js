var currentPercent = 0;
var height;
var width;
var perimeter;

var $svgbar = $('.red-bar');
var $redirect = $('.REDIRECT');
var $dawson = $('.DAWSON');

$redirect.hide();
$dawson.hide();

function updateDimensions() {
    // Get permineter of window
    height = window.innerHeight;
    width  = window.innerWidth;
    perimeter = (height * 2) + (width * 2);
    
    updatePercent(currentPercent);
}

function updatePercent(percent) {
    currentPercent = percent;
    var offest = ((100-percent) / 100 ) * perimeter;
    $svgbar.css('stroke-dasharray', perimeter).css('stroke-dashoffset', offest);
}

updateDimensions();
window.addEventListener('resize', updateDimensions);

$redirect.fadeIn();
setTimeout(function() {
    $dawson.fadeIn();
}, 1000);

setTimeout(function() {
    window.location = 'https://michaelgira.me/parades';
}, 3000);