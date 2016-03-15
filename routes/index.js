var express = require('express');
var router = express.Router();
var request = require('request');
var utilities=require('../lib/utilities');
var zlib = require('zlib');
var fs=require('fs');
var outputFile='./public/data/processeddata.json';

/* GET home page. */
router.get('/', function(req, res) {

	//if processed JSON doesn't exist, create one before rendering
	if(!utilities.fileExists(outputFile)) {
		var inputFile='./public/data/data.json';
		utilities.processData(inputFile, outputFile);
	}

	res.render('index', { title: 'D3 visualization demo' });
});

router.get('/getGraphJSON', function(req, res) {

	res.json(JSON.parse(fs.readFileSync(outputFile)));
	
});


module.exports = router;