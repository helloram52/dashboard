var express = require('express');
var router = express.Router();
var request = require('request');
var utilities = require('../lib/utilities');
var fs = require('fs');
var outputFile = './public/data/processeddata.json';

/* GET home page. */
router.get('/', function(request, response) {
	//if processed JSON doesn't exist, create one before rendering
	if(!utilities.fileExists(outputFile)) {
		var inputFile = './public/data/data.json';
		utilities.processData(inputFile, outputFile);
	}

	// Read the unique list of years from the processed json and create the year nav bar
	var fileContents = fs.readFileSync(outputFile);
	var dataJSON = JSON.parse(fileContents);

	response.render('index', {
		title: 'D3 visualization demo',
		years : dataJSON['YEARS']
	});
});

router.get('/getGraphJSON', function(request, response) {
	// Note: We've compression enabled in app.js using compression lib.
	// So, we don't need compress this json file.
	response.json(JSON.parse(fs.readFileSync(outputFile)));
});

module.exports = router;