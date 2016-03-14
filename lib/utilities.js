var fs = require('fs');

var fileExistsFn = function(filePath) {
	return fs.existsSync(filePath);
}

var buildCustomerObjectFn = function(customerRevenueMap,customerId, revenue, Country) {

	var revenueSum = 0, countryRevenue = 0;

	//accumulate data for every customer
	if(customerRevenueMap.hasOwnProperty(customerId)) {
			
		revenueSum += customerRevenueMap[customerId]['TOTAL'];
		revenueSum += revenue;
		customerRevenueMap[customerId]['TOTAL'] = revenueSum;

		//accumulate data for every country
		if(customerRevenueMap[customerId].hasOwnProperty(Country)){

			countryRevenue = customerRevenueMap[customerId][Country];
			customerRevenueMap[customerId][Country] = revenue + countryRevenue;

		}
		else{

			customerRevenueMap[customerId][Country] = revenue;
		}
	}
	else{
		
		customerRevenueMap[customerId]={};
		customerRevenueMap[customerId]['TOTAL'] = revenue;
		customerRevenueMap[customerId][Country] = revenue;
	}
}

var processDataFn = function(inputFile, outputFile) {
	// Get content from file
	 var contents = fs.readFileSync(inputFile);
	// Define to JSON type
	 var jsonContent = JSON.parse(contents);
	//output JSON 
	var revenueMaps={};
	/* revenueMaps format
	{
		BusinessUnit:{
			Year:{
				Month:{
					Customer:{
						TOTAL: <revenue>,
						<country>: <revenue>
					}
				}
			}

		}
	}
	*/
	//parse input JSON and accumulate the totals in output JSON
	for(var index in jsonContent) {
		//get content for each object
		var object 		=jsonContent[index];	
		var busUnit 	=object['BusinessUnit'];
		var revenue 	=object['Revenue'];
		var customerId 	=object['Customer'];
		var Country  	= object['Country'];
		var year 		= object['Year'];
		var month 		= object['Month'];

		//accumulate data for every business unit
		if(revenueMaps.hasOwnProperty(busUnit)){

			//accumulate data for every year
			if(revenueMaps[busUnit].hasOwnProperty(year)){

				//accumulate data for every month
				if(revenueMaps[busUnit][year].hasOwnProperty(month)){

					//accumulate data for every customer
					var customerRevenueMap = revenueMaps[busUnit][year][month];
					this.buildCustomerObject(customerRevenueMap,customerId, revenue, Country);

				}
				else{
					//initialize month property
					revenueMaps[busUnit][year][month] = {};
				}

			}
			else{
				//initialize year property
				revenueMaps[busUnit][year] = {};
				//initialize month property
				revenueMaps[busUnit][year][month] = {};
			}

		}
		else{
			//initialize business unit, year, month and customer properties
			revenueMaps[busUnit] = {};
			revenueMaps[busUnit][year] = {};
			revenueMaps[busUnit][year][month] = {};
			revenueMaps[busUnit][year][month][customerId] = {};
			revenueMaps[busUnit][year][month][customerId]['TOTAL'] = revenue;
			revenueMaps[busUnit][year][month][customerId][Country] = revenue;

		}

	}

	//write out the revenueMaps to output file
	fs.writeFileSync(outputFile,JSON.stringify(revenueMaps, null, 0));

}

module.exports = {

	fileExists: fileExistsFn,
	buildCustomerObject: buildCustomerObjectFn,
	processData: processDataFn

}