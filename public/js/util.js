/*
 * This file contains all the utility functions
 */

var debug = true;
function Log(logMsg) {
	if(debug)
		console.log(logMsg);
}

function isObject (obj) {
   return obj && (typeof obj  === "object");
}

function isArray (obj) { 
  return isObject(obj) && (obj instanceof Array);
}

function getSortedKeys(object) {
	var keys = [];
	for(var key in obj) {
		if(obj.hasOwnProperty(key))
			keys.push(key);
	}

	return keys.sort();
}

// Returns index if the value is found in the given array. -1 otherwise.
function InList(arr, value) {
	for(var i=0;i<arr.length;i++) {
		if(arr[i] == value)
			return i;
	}
	return -1;
}

/* Given a number like 123456789 and the number of digits to follow after the decimal,
 * returns the formatted currency i.e. '123.45 B' (for digits=2)
 * k - thousands
 * M - million
 * B - billion
 * T - trillion
 * P - quadrillionth
 * E - quintillionth
 */
function formatCurrency(num, digits) {
	var si = [
		{ value: 1E18, symbol: "E" },
		{ value: 1E15, symbol: "P" },
		{ value: 1E12, symbol: "T" },
		{ value: 1E9,  symbol: "B" },
		{ value: 1E6,  symbol: "M" },
		{ value: 1E3,  symbol: "k" }
	];

	for (var i = 0; i < si.length; i++) {
		if (num >= si[i].value) {
			return (num / si[i].value).toFixed(digits).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1") + ' ' + si[i].symbol;
		}
	}
	return num.toString();
}


//checks whether mandatory arguments are present
function requireFields(args, fields, mandatoryFields){

	//check whether field is valid
	for(var index in fields) {

		if(!args.hasOwnProperty(fields[index])) {
			Log('Invalid Field : ' + fields[index] + ' found.');
			return false;
		}
	}

	for(var index in mandatoryFields) {
		var fieldName = mandatoryFields[index];
		//check whether mandatory field is not empty
		if(args.hasOwnProperty(fieldName)) {
			if(isArray(args[fieldName])) {
				if(args[fieldName].length == 0) {
					Log('mandatory field : ' + fields[index] + ' found with length zero.');
					return false;
				}
			}
			else if(isObject(args[fieldName])) {
				if(args[fieldName].keys().length == 0) {
					Log('mandatory field : ' + fields[index] + ' found  with key size zero.');
					return false;
				}
			}
		}
	}
	return true;
}

function convertDataForBarChart(JSONdata) {
	//input format
	/*
		JSONdata = [
		
		{'label', <customer>, 'data', <revenue>},
		{'label', <customer>, 'data', <revenue>},
		
		]	
	*/
	//output format
	/*
		JSONdata = [
		
		{'label', <customer>, 'data', <revenue>},
		{'label', <customer>, 'data', <revenue>},
		
		]	
	*/
	var dataArray = ['customers'], index1 = dataArray.length;
	var labelArray = ['customers'], index2 = labelArray.length;
	
	for(var i=0; i<JSONdata.length; i++) {
		dataArray[index1++] = JSONdata[i]['data'];
		labelArray[index2++] = JSONdata[i]['label'];
		//console.log(JSONdata[i]['label']+" "+JSONdata[i]['data']);
	}

	return {
		'dataArray' : dataArray,
		'labelArray': labelArray 
	};
}

/*
 * Provides sprintf functionality. Examples:
 * - "This is an test {0}, {1}, {2}".format(1, 2, 3)
 * - "This is an test {0}, {1}, {2}".format([1, 2, 3])
 */
String.prototype.format = function() {
	var str = this.toString();
	if (!arguments.length)
		return str;

	var args = typeof arguments[0],
		args = (("string" == args || "number" == args) ? arguments : arguments[0]);
	for (arg in args)
		str = str.replace(RegExp("\\{" + arg + "\\}", "gi"), args[arg]);
	return str;
}