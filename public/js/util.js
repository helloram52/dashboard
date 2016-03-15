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