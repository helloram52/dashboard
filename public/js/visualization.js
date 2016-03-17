/*
 * Main visualization runner that parses json file in the below format
 * and initializes various visualization and their interactions.
 * {
 *	'A' : { // Business Unit
 *		2003 : { // Year
 *			1 : {	// Month
 *				71 : {	// Customer ID
 *					'MEXICO' : 123,	// Country Name and the revenue
 *					'AUS' : 1234,
 *					....,
 *					'TOTAL' : 1357 // TOTAL revenue for the customer
 *				},
 *				83 : {
 *					'MEXICO' : 123,
 *					'TOTAL' : 1357
 *				},
 *				....
 *				'TOTAL' : 1357 // Total revenue for this quarter
 *			},
 *			...
 *		....
 *	},
 *	...
 * }
 */
var Visualization = function() {
	this.canvasSelectorString = '';
	this.businessUnits = [];
	this.jsonObject = {};

	var parent = this;

	this.init = function(jsonObject, canvasSelectorString) {
		this.canvasSelectorString = canvasSelectorString;
		this.jsonObject = jsonObject;
		this.gatherData();

		this.chartSelections = {
			'PIECHART' : {},
			'BARCHART' : {},
			'CLUSTERCHART' : {}
		};
	},

	this.setBusinessUnitsFromJSON = function() {
		var inputData = this.jsonObject['ALLDATA'];
		var index = 0;
		for(var busUnit in inputData){
			this.businessUnits[index++] = busUnit;
		}
	},

	this.gatherData = function() {
		//initialise business Units for later use
		this.setBusinessUnitsFromJSON();
	},
	
	this.showBarChart =function(barChartData) {
		if(barChartData != undefined && barChartData.length != 0){
			$('#bar-div').html("");
			this.drawBarChart(barChartData, '#bar-div');
		}
	},

	this.showPieChart = function(pieChartData) {
		if(pieChartData != undefined && pieChartData.length != 0) {
			$('#pie-div').html("");
			Log('drawing pie chart');
			this.drawPieChart("Revenue", pieChartData, '#pie-div', "colorScale20", 10, 150, 5, 0);
		}
	},

	this.updateView = function(args, fromChartType) {
		//case 1: month or year is updated from the onChange event of year/month buttons:
		//	a. refresh data for all the charts by calling getData()
		//  b. redraw all charts
		if(fromChartType == 'REFRESH') {
			this.years = args['YEAR'];
			this.months = args['MONTH'];

			args['BUSINESSUNIT'] = this.businessUnits;
			args['CUSTOMER'] = [];

			var chartData = this.getData(args);

			this.showPieChart(chartData['PIECHART']);
			this.showBarChart(chartData['BARCHART']);
		}
		// Case 2: A selection is made in Pie chart
		// and the bar chart and it's successors charts should
		// propagate the selections made.
		// Note: This should be called with BUSINESSUNITS args
		else if(fromChartType == 'PIE') {
			// Save this for making cluster chart later
			this.businessUnits = args['BUSINESSUNITS'];

			args['YEAR'] = this.years;
			args['MONTH'] = this.months;
			args['CUSTOMER'] = [];

			var chartData = this.getData(args);
			this.showBarChart(chartData['BARCHART']);
		}
		// Case 3: A selection is made in Bar chart
		// and the cluster chart should propagate the selections made.
		// Note: This should be called with CUSTOMER args
		else {

		}
	},

	this.getAllData = function(currentYear) {

		//get required data from input object
		var inputData = this.jsonObject['ALLDATA'];
		var busUnitIndex = 0, customerIndex = 0, countryIndex=0, revenueByCustomer = 0, revenueByCountry = 0;
		var chartData = {};
		var pieChartDataArray = [], barChartDataArray = [], clusterChartDataArray = [];
		var customerJSON = {};
		var countryJSON = {};

		//iterate the inputData for all customers and compose output for pieChart, Barchart and clusterChart
		for(var busUnit in inputData) {
			var revenueByBusinessUnit = 0;
			//for each year accumulate the revenue for charts 
			var year = currentYear;
			//for each month accumulate the revenue for charts
			for(var month in inputData[busUnit][year]) {
				revenueByBusinessUnit += inputData[busUnit][year][month]['TOTAL'];
				var customers = inputData[busUnit][year][month];
				for(var customer in customers){
					//gather data for bar chart
					if(customer != 'TOTAL'){
						
						revenueByCustomer = customers[customer]['TOTAL'];
						
						if(customerJSON.hasOwnProperty(customer)){
							revenueByCustomer += customerJSON[customer];
							customerJSON[customer] = revenueByCustomer;
						}
						 else {
							customerJSON[customer] = revenueByCustomer;
						}
						//gather data for cluster chart
						for(var country in customers[customer]){

							if(country != 'TOTAL'){
								revenueByCountry = customers[customer][country];
								if(countryJSON.hasOwnProperty(country)){
									revenueByCountry += countryJSON[country];
									countryJSON[country] = revenueByCountry;
								}
								else{
									countryJSON[country] = revenueByCountry;	
								}
							}
						}
					}
				}	
			}
			//populate data for pie chart
			var pieChartData = {};
			pieChartData['label'] = busUnit;
			pieChartData['data'] = revenueByBusinessUnit;
			pieChartDataArray[busUnitIndex++] = pieChartData;
		}
		//populate data for bar chart
		for(customer in customerJSON){
			var barChartData = {};
			barChartData['label'] = customer;
			barChartData['data'] = customerJSON[customer];
			barChartDataArray[customerIndex++] = barChartData;
		}

		//populate data for cluster chart
		countryIndex =0;
		for(country in countryJSON){
			var clusterChartData = {};
			clusterChartData['label'] = country;
			clusterChartData['data'] = countryJSON[country];
			clusterChartDataArray[countryIndex++] = clusterChartData;
		}

		chartData['PIECHART'] = pieChartDataArray;
		chartData['BARCHART'] = barChartDataArray;
		chartData['CLUSTERCHART'] = clusterChartDataArray;

		return chartData;
	},

	/*
	 * Parses given input json to fetch data that .
	 * ChartData={
	 *	'BARCHART' : {label: <customer>, revenue: <revenue>},
	 *	'PIECHART' : {label: <BusinessUnit>, revenue: <revenue>},
	 *	'CLUSTERCHART' : {label: <country>, revenue: <revenue>}
	 * };
	 */
	this.getData = function(args) {

		var inputData = this.jsonObject['ALLDATA'];
		//verify whether expected fields are present in arguments
		var fields = ['BUSINESSUNIT', 'YEAR', 'MONTH', 'CUSTOMER'];
		var mandatoryFields = ['BUSINESSUNIT', 'YEAR', 'MONTH'];

		if(!requireFields(args, fields, mandatoryFields)){
			console.log("Visualization.js: getData():-Expected argument missing!");
			return {};
		}

		//get required data from input object
		var selectedBusinessUnits = args['BUSINESSUNIT'];
		var selectedYears = args['YEAR'];
		var selectedMonths = args['MONTH'];
		var selectedCustomers = args['CUSTOMER'];
		var busUnitIndex = 0, customerIndex = 0, countryIndex=0, revenueByCustomer = 0, revenueByCountry = 0;
		var chartData = {};
		var pieChartDataArray = [], barChartDataArray = [], clusterChartDataArray = [];
		var customerJSON = {};
		var countryJSON = {};

		//check whether arguments have valid data
		if(args['CUSTOMER'].length == 0) {
			//iterate the inputData for all customers and compose output for pieChart, Barchart and clusterChart
			for(var busUnit in selectedBusinessUnits) {
				var revenueByBusinessUnit = 0;
				//for each year accumulate the revenue for charts 
				for(var year in selectedYears) {
					//for each month accumulate the revenue for charts
					for(var month in selectedMonths) {
						revenueByBusinessUnit += inputData[selectedBusinessUnits[busUnit]][selectedYears[year]][selectedMonths[month]]['TOTAL'];
						var customers = inputData[selectedBusinessUnits[busUnit]][selectedYears[year]][selectedMonths[month]];
						for(var customer in customers){
							//gather data for bar chart
							if(customer != 'TOTAL'){
								
								revenueByCustomer = customers[customer]['TOTAL'];
								
								if(customerJSON.hasOwnProperty(customer)){
									revenueByCustomer += customerJSON[customer];
									customerJSON[customer] = revenueByCustomer;
								}
								 else {
									customerJSON[customer] = revenueByCustomer;
								}
								//gather data for cluster chart
								for(var country in customers[customer]){

									if(country != 'TOTAL'){
										revenueByCountry = customers[customer][country];
										if(countryJSON.hasOwnProperty(country)){
											revenueByCountry += countryJSON[country];
											countryJSON[country] = revenueByCountry;
										}
										else{
											countryJSON[country] = revenueByCountry;	
										}
									}
								}
							}
						}
					}	
				}
				//populate data for pie chart
				var pieChartData = {};
				pieChartData['label'] = selectedBusinessUnits[busUnit];
				pieChartData['data'] = revenueByBusinessUnit;
				pieChartDataArray[busUnitIndex++] = pieChartData;
			}
		}
		else {
			//iterate the inputData for selected customers and compose output for pieChart, Barchart and clusterChart
			for(var busUnit in selectedBusinessUnits) {
				var revenueByBusinessUnit = 0;
				//for each year accumulate the revenue for charts 
				for(var year in selectedYears) {
					//for each month accumulate the revenue for charts 
					for(var month in selectedMonths) {
						revenueByBusinessUnit += inputData[selectedBusinessUnits[busUnit]][selectedYears[year]][selectedMonths[month]]['TOTAL'];
						var customers = inputData[selectedBusinessUnits[busUnit]][selectedYears[year]][selectedMonths[month]];
						for(var customerPos in selectedCustomers){
							var customer = selectedCustomers[customerPos];
							//gather data for bar chart
								
							revenueByCustomer = customers[customer]['TOTAL'];
							
							if(customerJSON.hasOwnProperty(customer)){
								revenueByCustomer += customerJSON[customer];
								customerJSON[customer] = revenueByCustomer;
							}
							 else {
								customerJSON[customer] = revenueByCustomer;
							}
							//gather data for cluster chart
							for(var country in customers[customer]){

								if(country != 'TOTAL'){
									revenueByCountry = customers[customer][country];
									if(countryJSON.hasOwnProperty(country)){
										revenueByCountry += countryJSON[country];
										countryJSON[country] = revenueByCountry;
									}
									else{
										countryJSON[country] = revenueByCountry;	
									}
								}
							}
						}
					}	
				}
				//populate data for pie chart
				var pieChartData = {};
				pieChartData['label'] = selectedBusinessUnits[busUnit];
				pieChartData['data'] = revenueByBusinessUnit;
				pieChartDataArray[busUnitIndex++] = pieChartData;
			}

		}

		//populate data for bar chart
		for(customer in customerJSON){
			var barChartData = {};
			barChartData['label'] = customer;
			barChartData['data'] = customerJSON[customer];
			barChartDataArray[customerIndex++] = barChartData;
		}

		//populate data for cluster chart
		countryIndex =0;
		for(country in countryJSON){
			var clusterChartData = {};
			clusterChartData['label'] = country;
			clusterChartData['data'] = countryJSON[country];
			clusterChartDataArray[countryIndex++] = clusterChartData;
		}

		chartData['PIECHART'] = pieChartDataArray;
		chartData['BARCHART'] = barChartDataArray;
		chartData['CLUSTERCHART'] = clusterChartDataArray;

		return chartData;
	},

	/*
	 * Parses given input json to fetch data that .
	 * pieChartDataArray=[
	 *	{label: <busineessUnit>, revenue: <revenue>},
	 *	{label: <busineessUnit>, revenue: <revenue>}
	 * ];
	 */
	this.getPieChartData = function(JSONdata) {
		var pieChartDataArray = [], i = 0;

		for(var busUnit in JSONdata){
			var revenue = 0;
			for(var year in JSONdata[busUnit]){
				for(var month in JSONdata[busUnit][year]){
					revenue += JSONdata[busUnit][year][month]['TOTAL'];
				}	
			}

			var pieChartData = {};
			pieChartData['label'] = busUnit;
			pieChartData['revenue'] = revenue;
			pieChartDataArray[i++] = pieChartData;
		}

		return pieChartDataArray;
	},

	// pieName => A unique drawing identifier that has no spaces, no "." and no "#" characters.
	// dataset => Input Data for the chart, itself.
	// selectString => String that allows you to pass in
	//           a D3 select string.
	// colors => String to set color scale.  Values can be...
	//           => "colorScale10"
	//           => "colorScale20"
	//           => "colorScale20b"
	//           => "colorScale20c"
	// margin => Integer margin offset value.
	// outerRadius => Integer outer radius value.
	// innerRadius => Integer inner radius value.
	// sortArcs => Controls sorting of Arcs by value.
	//              0 = No Sort.  Maintain original order.
	//              1 = Sort by arc value size.
	this.drawPieChart = function(pieName, dataset, selectString, colors, margin, outerRadius, innerRadius, sortArcs) {
		// Color Scale Handling...
		var colorScale = d3.scale.category20c();
		switch (colors) {
			case "colorScale10":
				colorScale = d3.scale.category10();
				break;
			case "colorScale20":
				colorScale = d3.scale.category20();
				break;
			case "colorScale20b":
				colorScale = d3.scale.category20b();
				break;
			case "colorScale20c":
				colorScale = d3.scale.category20c();
				break;
			default:
				colorScale = d3.scale.category20c();
		};

		var canvasWidth = 700;
		var pieWidthTotal = outerRadius * 2;
		var pieCenterX = outerRadius + margin/2;
		var pieCenterY = outerRadius + margin/2;
		//var legendBulletOffset = 30;
		//var legendVerticalOffset = outerRadius - margin;
		//var legendTextOffset = 20;
		//var textVerticalSpace = 20;

		var canvasHeight = 0;
		var pieDrivenHeight = outerRadius*2 + margin*2;
		//var legendTextDrivenHeight = (dataset.length * textVerticalSpace) + margin*2;
		/*
		// Autoadjust Canvas Height
		if (pieDrivenHeight >= legendTextDrivenHeight)
			canvasHeight = pieDrivenHeight;
		else
			canvasHeight = legendTextDrivenHeight; */
		canvasHeight = pieDrivenHeight;
		var x = d3.scale.linear().domain([0, d3.max(dataset, function(d) { return d.data; })]).rangeRound([0, pieWidthTotal]);
		var y = d3.scale.linear().domain([0, dataset.length]).range([0, (dataset.length * 20)]);

		//tool tip
		var tip = d3.tip()
				.attr('class', 'd3-tip')
				.offset([0, 0])

		//handle mouseOver event
		var synchronizedMouseOver = function(d) {
			var arc = d3.select(this);
			var indexValue = arc.attr("index_value");

			var arcSelector = "." + "pie-" + pieName + "-arc-" + indexValue;
			var selectedArc = d3.selectAll(arcSelector);
			selectedArc.style("fill", "Maroon");

			var total = d3.sum(dataset.map(function(d) {
				return d.data;
			}));

			var percent = 0;

			if(total)
				percent = Math.round(1000 * d.data.data / total) / 10;
			var tableMessage = "<table border='2' align='center'><tr><td >BU</td><td bgcolor='green' align='center'>"+ d.data.label +"</td></tr><tr><td>Revenue</td><td bgcolor='green' align='center'> $"+ formatCurrency(d.data.data, 1) +"</td></tr><tr><td>Percentage</td><td bgcolor='green' align='center'>"+ percent +"%</td></tr></table>";

			//display percent value in tool tip for the seleceted arc
			tip.html(function(b) {
				var message = "<strong>"
					+ d.data.label
					+ ":</strong> <span style='color:red'>"
						+ percent
					+ "%</span>"
					+ " <br /><strong> Revenue:</strong> <span style='color:red'>"
					+ formatCurrency(d.data.data, 1)
					+ "</span>";

				return tableMessage;
			})
			tip.show();
		};

		function formatCurrency(num, digits) {
			var si = [
				{ value: 1E18, symbol: "E" },
				{ value: 1E15, symbol: "P" },
				{ value: 1E12, symbol: "T" },
				{ value: 1E9,  symbol: "B" },
				{ value: 1E6,  symbol: "M" },
				{ value: 1E3,  symbol: "k" }
				], i;
			for (i = 0; i < si.length; i++) {
				if (num >= si[i].value) {
					return (num / si[i].value).toFixed(digits).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1") + si[i].symbol;
				}
			}
			return num.toString();
		}
		//handle mouseOut event
		var synchronizedMouseOut = function(d) {
			var arc = d3.select(this);
			var indexValue = arc.attr("index_value");

			var arcSelector = "." + "pie-" + pieName + "-arc-" + indexValue;
			var selectedArc = d3.selectAll(arcSelector);
			var colorValue = selectedArc.attr("color_value");
			if(selectedArc.attr('selected') == '0')
				selectedArc.style("fill", colorValue);

			tip.hide();
		};
		
		/*	
		var synchronizedMouseMove = function(d) {
			tip.style('top', (d3.event.layerY + 1) + 'px')
				.style('left', (d3.event.layerX + 1) + 'px'); 
		} */
		var tweenPie = function (b) {
			b.innerRadius = 0;
			var i = d3.interpolate({
				startAngle: 0,
				endAngle: 0
			}, b);
			return function(t) {
				return arc(i(t));
			};
		};

		// Create a drawing canvas...
		var canvas = d3.select(selectString)
			.append("svg:svg") //create the SVG element inside the <body>
			.data([dataset]) //associate our data with the document
			.attr("width", canvasWidth) //set the width of the canvas
			.attr("height", canvasHeight) //set the height of the canvas
			.append("svg:g") //make a group to hold our pie chart
			.attr("transform", "translate(" + pieCenterX + "," + pieCenterY + ")") // Set center of pie

		canvas.call(tip); //attach tip to canvas div
		// Define an arc generator. This will create <path> elements for using arc data.
		var arc = d3.svg.arc()
			.innerRadius(innerRadius) // Causes center of pie to be hollow
			.outerRadius(outerRadius);

		// Define a pie layout: the pie angle encodes the value of dataset.
		// Since our data is in the form of a post-parsed CSV string, the
		// values are Strings which we coerce to Numbers.
		var pie = d3.layout.pie()
			.value(function(d) {
				return d.data;
			});

		if(sortArcs == 1) {
			pie.sort(function(a, b) {
				return b.data - a.data;
			});
		}
		else {
			// disable sorting of the entries since by default it's sorted by descending values.
			pie.sort(null);
		}

		// Select all <g> elements with class slice (there aren't any yet)
		var arcs = canvas.selectAll("g.slice")
			// Associate the generated pie data (an array of arcs, each having startAngle,
			// endAngle and value properties) 
			.data(pie)
			// This will create <g> elements for every "extra" data element that should be associated
			// with a selection. The result is creating a <g> for every object in the data array
			// Create a group to hold each slice (we will have a <path> and a <text>      // element associated with each slice)
		.enter().append("svg:a")
			.append("svg:g")
			.attr("class", "slice")    //allow us to style things in the slices (like text)
			// Set the color for each slice to be chosen from the color function defined above
			// This creates the actual SVG path using the associated data (pie) with the arc drawing function
			.style("stroke", "White" )
			.attr("d", arc);

		arcs.append("svg:path")
			// Set the color for each slice to be chosen from the color function defined above
			// This creates the actual SVG path using the associated data (pie) with the arc drawing function
			.style("fill", function(d, i) { return colorScale(i); } )
			.attr("color_value", function(d, i) { return colorScale(i); }) // Bar fill color...
			.attr("index_value", function(d, i) { return "index-" + i; })
			.attr('selected', function(d, i) { return '0';})
			.attr("class", function(d, i) { return "pie-" + pieName + "-arc-index-" + i; })
			.attr("d", arc)
			.on('mouseover', synchronizedMouseOver)
			.on("mouseout", synchronizedMouseOut)
			.on("mousedown", function(data) {
				var arc = d3.select(this);
				var indexValue = arc.attr("index_value");

				var arcSelector = "." + "pie-" + pieName + "-arc-" + indexValue;
				var selectedArc = d3.selectAll(arcSelector);

				// First time selected, push it to our list of stored business units
				// , mark it selected by coloring it in Maroon and then update the bar chart.
				if(selectedArc.attr('selected') == '0') {
					selectedArc.attr('selected', '1');

					selectedArc.style("fill", "Maroon");
					parent.chartSelections.PIECHART[data.data.label] = '1';

					parent.updateView({
						'BUSINESSUNIT' : [ Object.keys(parent.chartSelections.PIECHART) ],
					}, 'PIE');
					Log('sending updateview for unit(s) ' + [ Object.keys(parent.chartSelections.PIECHART) ] );
				}
				// If it's already selected, replace maroon with it's old color
				// and remove it from the stored list.
				else {
					var colorValue = selectedArc.attr("color_value");
					selectedArc.style("fill", colorValue);

					delete parent.chartSelections.PIECHART[data.data.label];
					selectedArc.attr('selected', '0');
				}
			})
			//.on("mousemove", synchronizedMouseMove)
			.transition()
			.ease("bounce")
			.duration(1000)
			//.delay(function(d, i) { return i * 50; })
			.attrTween("d", tweenPie);

		// Add a magnitude value to the larger arcs, translated to the arc centroid and rotated.
		arcs.filter(function(d) { return d.endAngle - d.startAngle > .2; }).append("svg:text")
			.attr("dy", ".35em")
			.attr("text-anchor", "middle")
			.attr("transform", function(d) { //set the label's origin to the center of the arc
				//we have to make sure to set these before calling arc.centroid
				d.outerRadius = outerRadius; // Set Outer Coordinate
				d.innerRadius = innerRadius; // Set Inner Coordinate
				return "translate(" + arc.centroid(d) + ")";
			})
			.style("fill", "White")
			.style("font", "normal 12px Arial")
			.text(function(d) { return d.data.label; });

		// Computes the angle of an arc, converting from radians to degrees.
		function angle(d) {
			var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
			return a > 90 ? a - 180 : a;
		}
		
	},


	this.drawBarChart = function(dataset, division){
		
		var margin = {top: 20, right: 20, bottom: 30, left: 40},
		width = 800 - margin.left - margin.right,
		height = 300 - margin.top - margin.bottom;
		
		/*var margin = {top: 20, right: 20, bottom: 30, left: 40},
		width = 960 - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom;
		*/
		var x = d3.scale.ordinal()
		.rangeRoundBands([0, width], .1);

		var y = d3.scale.linear()
		.range([height, 0]);

		var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
		.ticks(6);

		var tipBar = d3.tip()
				.attr('class', 'd3-tip');

		var svg = d3.select(division).append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		svg.call(tipBar);

		x.domain(dataset.map(function(d) { return d.label; }));
		y.domain([0, d3.max(dataset, function(d) { return d.data; })]);

		/*svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")");*/
				//.call(xAxis);

		svg.append("g")
				.attr("class", "y axis")
				.call(yAxis)
				.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 6)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text("Revenue");	

		console.log("before last section");

		svg.selectAll(".bar")
				.data(dataset)
				.enter().append("rect")
				.attr("class", "bar")
				.attr("x", function(d) { return x(d.label); })
				.attr("width", x.rangeBand())
				.on('mouseover', function(d){


				})
				.on('mouseout',tipBar.hide)
				.attr("y", function(d) { console.log(y(1000)); return y(d.data); })
				.attr("height", function(d) { return height - y(d.data); });

	
	function mouseOver() {
		
		/*var tableMessage = "<table border='2' align='center'><tr><td >Customer</td><td bgcolor='green' align='center'>"+ d.label +"</td></tr><tr><td>Revenue</td><td bgcolor='green' align='center'> $"+ formatCurrency(d.data, 1) +"</td></tr></table>";
		//display percent value in tool tip for the seleceted bar
		console.log(d.data);
		tipBar.html(function(b) {
			return tableMessage;
		});*/
		tipBar.html("working");
		tipBar.show();
	}

	}

	this.destroy = function() {

	}
};