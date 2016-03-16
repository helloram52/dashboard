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