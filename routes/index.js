var express = require('express');
var router = express.Router();
var request = require('request');
var utilities=require('../lib/utilities');
var zlib = require('zlib');
var fs=require('fs');
var outputFile='./public/data/processeddata.json';

/* GET home page. */
router.get('/', function(request, response) {
	//if processed JSON doesn't exist, create one before rendering
	if(!utilities.fileExists(outputFile)) {
		var inputFile = './public/data/data.json';
		utilities.processData(inputFile, outputFile);
	}

	var yearList = ['2003', '2004', '2005'];
	//console.log('yearlist type:' + typeof yearlist);

	response.render('index', {
		title: 'D3 visualization demo',
		years : yearList
	});
});

router.get('/getGraphJSON', function(request, response) {
	// Note: We've compression enabled in app.js using compression lib.
	// So, we don't need compress this json file.
	response.json(JSON.parse(fs.readFileSync(outputFile)));
});

module.exports = router;