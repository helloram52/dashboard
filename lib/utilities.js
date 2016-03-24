var fs = require('fs');

var fileExistsFn = function(filePath) {
	return fs.existsSync(filePath);
}

var buildCustomerObjectFn = function(customerRevenueMap, customerId, revenue, Country, prodMix, prodType, salesVolume, cost) {
	var revenueSum = 0, prodTypeRevenue = 0;

	//accumulate data for every customer
	if(customerRevenueMap.hasOwnProperty(customerId)) {

		revenueSum += customerRevenueMap[customerId]['TOTAL'];
		revenueSum += revenue;
		customerRevenueMap[customerId]['TOTAL'] = revenueSum;

		//accumulate data for every country
		if(customerRevenueMap[customerId].hasOwnProperty(Country)) {

			if(customerRevenueMap[customerId][Country].hasOwnProperty(prodMix)) {

				if(customerRevenueMap[customerId][Country][prodMix].hasOwnProperty(prodType)) {

					prodTypeRevenue = customerRevenueMap[customerId][Country][prodMix][prodType]['revenue'];
					customerRevenueMap[customerId][Country][prodMix][prodType]['revenue'] = revenue + prodTypeRevenue;

					var prodTypeVolume = customerRevenueMap[customerId][Country][prodMix][prodType]['volume'];
					customerRevenueMap[customerId][Country][prodMix][prodType]['volume'] = salesVolume + prodTypeVolume;

					var prodTypeCost = customerRevenueMap[customerId][Country][prodMix][prodType]['cost'];
					customerRevenueMap[customerId][Country][prodMix][prodType]['cost'] = cost + prodTypeCost;
				
				}
				else {

					customerRevenueMap[customerId][Country][prodMix][prodType] = {};
					customerRevenueMap[customerId][Country][prodMix][prodType]['revenue'] = revenue;
					customerRevenueMap[customerId][Country][prodMix][prodType]['volume'] = salesVolume;
					customerRevenueMap[customerId][Country][prodMix][prodType]['cost'] = cost;	
				}
			}
			else {

				customerRevenueMap[customerId][Country][prodMix] = {};
				customerRevenueMap[customerId][Country][prodMix][prodType] = {};
				customerRevenueMap[customerId][Country][prodMix][prodType]['revenue'] = revenue;
				customerRevenueMap[customerId][Country][prodMix][prodType]['volume'] = salesVolume;
				customerRevenueMap[customerId][Country][prodMix][prodType]['cost'] = cost;
			}
		}
		else {
			customerRevenueMap[customerId][Country] = {};
			customerRevenueMap[customerId][Country][prodMix] = {};
			customerRevenueMap[customerId][Country][prodMix][prodType] = {};
			customerRevenueMap[customerId][Country][prodMix][prodType]['revenue'] = revenue;
			customerRevenueMap[customerId][Country][prodMix][prodType]['volume'] = salesVolume;
			customerRevenueMap[customerId][Country][prodMix][prodType]['cost'] = cost;
		}
	}
	else {
		customerRevenueMap[customerId]={};
		customerRevenueMap[customerId]['TOTAL'] = revenue;
		customerRevenueMap[customerId][Country] = {};
		customerRevenueMap[customerId][Country][prodMix] = {};
		customerRevenueMap[customerId][Country][prodMix][prodType] = {};
		customerRevenueMap[customerId][Country][prodMix][prodType]['revenue'] = revenue;
		customerRevenueMap[customerId][Country][prodMix][prodType]['volume'] = salesVolume;
		customerRevenueMap[customerId][Country][prodMix][prodType]['cost'] = cost;
	}
}

var processDataFn = function(inputFile, outputFile) {
	// Get content from file
	 var contents = fs.readFileSync(inputFile);
	// Define to JSON type
	 var jsonContent = JSON.parse(contents);
	//output JSON 
	var revenueMaps = {};
	var yearMap = {};
	var yearList = [];
	/* revenueMaps format
	{
		BusinessUnit:{
			Year:{
				Month:{
					Customer:{
						TOTAL: <revenue>,
						<country>: {
							<prodMix>: <revenue>
						}
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
		var busUnit 	=object['Business Unit'];
		var revenue 	=object['Revenue'];
		var customerId 	=object['Customer'];
		var Country  	= object['Country'];
		var year 		= object['Year'];
		var month 		= object['Month'];
		var prodMix 	= object['Product Mix'];
		var prodType 	= object['Product TypeII'];
		var salesVolume = object['Sales Volume'];
		//var ROI	= object['Marketing ROI'];
		var cost = object['Cost'];
		//replace % symbol
		//ROI.replace('/[0-9]*\.?[0-9]+%/', "");
		//ROI = parseFloat(ROI);

		var monthRevenue = 0;
		//gather distinct years
		yearMap[year] = 1;
		//accumulate data for every business unit
		if(revenueMaps.hasOwnProperty(busUnit)) {

			//accumulate data for every year
			if(revenueMaps[busUnit].hasOwnProperty(year)) {

				//accumulate data for every month
				if(revenueMaps[busUnit][year].hasOwnProperty(month)) {

					monthRevenue += revenueMaps[busUnit][year][month]['TOTAL'];
					monthRevenue += revenue;
					revenueMaps[busUnit][year][month]['TOTAL']=monthRevenue;
					//accumulate data for every customer
					var customerRevenueMap = revenueMaps[busUnit][year][month];
					this.buildCustomerObject(customerRevenueMap,customerId, revenue, Country, prodMix, prodType, salesVolume, cost);

				}
				else {
					//initialize month property
					revenueMaps[busUnit][year][month] = {};
					revenueMaps[busUnit][year][month]['TOTAL'] = revenue;
				}

			}
			else {
				//initialize year property
				revenueMaps[busUnit][year] = {};
				//initialize month property
				revenueMaps[busUnit][year][month] = {};
				revenueMaps[busUnit][year][month]['TOTAL'] = revenue;
			}

		}
		else {
			//initialize business unit, year, month and customer properties
			revenueMaps[busUnit] = {};
			revenueMaps[busUnit][year] = {};
			revenueMaps[busUnit][year][month] = {};
			revenueMaps[busUnit][year][month]['TOTAL'] = revenue;
			revenueMaps[busUnit][year][month][customerId] = {};
			revenueMaps[busUnit][year][month][customerId]['TOTAL'] = revenue;
			revenueMaps[busUnit][year][month][customerId][Country] = {};
			revenueMaps[busUnit][year][month][customerId][Country][prodMix] = {};
			revenueMaps[busUnit][year][month][customerId][Country][prodMix][prodType] = {};
			revenueMaps[busUnit][year][month][customerId][Country][prodMix][prodType]['revenue'] = revenue;
			revenueMaps[busUnit][year][month][customerId][Country][prodMix][prodType]['volume'] = salesVolume;
			revenueMaps[busUnit][year][month][customerId][Country][prodMix][prodType]['cost'] = cost;
		}
	}

	//populate year list
	var index = 0;
	for(var year in yearMap) {
		yearList[index++] = year;
	}

	yearList.sort(function(a, b) {
		return b - a;
	});

	//write out the revenueMaps to output file
	var outputJSON = {
		'ALLDATA': revenueMaps,
		'YEARS': yearList
	};
	fs.writeFileSync(outputFile, JSON.stringify(outputJSON, null, 2));

}

module.exports = {
	fileExists: fileExistsFn,
	buildCustomerObject: buildCustomerObjectFn,
	processData: processDataFn

}