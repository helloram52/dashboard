/*
 * This file contains all the utility functions
 */

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
	console.log('searching in arr: ' + arr + ' 4 val:' + value);
	for(var i=0;i<arr.length;i++) {
		if(arr[i] == value)
			return i;
	}
	return -1;
}

//checks whether mandatory arguments are present
function requireFields(args, fields, mandatoryFields){

	//check whether field is valid
	for(var index in fields){

		if(!args.hasOwnProperty(fields[index])){
			return false;
		}	
	}

	for(var index in mandatoryFields){

		//check whether mandatory field is not empty
		if(args.hasOwnProperty(mandatoryFields[index])){
			
			if(args[mandatoryFields[index]].length == 0)
				return false;
		}
	}
	return true;
}