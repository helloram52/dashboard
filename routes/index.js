var express = require('express');
var router = express.Router();
var request = require('request');
var utilities=require('../lib/utilities');

/* GET home page. */
router.get('/', function(req, res) {
	var outputFile='./public/data/processeddata.json';
	//if processed JSON doesn't exist, create one before rendering
	if(!utilities.fileExists(outputFile)) {
		var inputFile='./public/data/data.json';
		utilities.processData(inputFile, outputFile);
	}

	res.render('index', { title: 'D3 visualization demo' });
});

module.exports = router;