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
			'BUBBLECHART' : {}
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

	this.showBubbleChart =function(bubbleChartData) {
		if(bubbleChartData != undefined && bubbleChartData.length != 0){
			$('#bubble-div').html('');
			parent.chartSelections.BUBBLECHART = {};
			this.drawBubbleChart(bubbleChartData, '#bubble-div');
		}
		else {
			Log('no data for bubble chart');
		}
	},

	this.showBarChart =function(barChartData) {
		if(barChartData != undefined && barChartData.length != 0) {
			// Clear the previous bar chart and the div that stores the selections made in them.
			$('#barcanvas-div').html('');
			$('#bar-div > #barselection-div').html('');
			parent.chartSelections.BARCHART = {};
			this.drawBarChart(barChartData, '#barcanvas-div', 350, 350);
		}
		else {
			Log('no data for bar chart');
		}
	},

	this.showPieChart = function(pieChartData) {
		if(pieChartData != undefined && pieChartData.length != 0) {
			$('#pie-div').html('');
			Log('drawing pie chart');
			parent.chartSelections.PIECHART = {};
			this.drawPieChart("Revenue", pieChartData, '#pie-div', 300, "colorScale20", 10, 120, 5, 0);
		}
		else {
			Log('no data to draw pie chart');
		}
	},

	this.updateView = function(args, fromChartType) {
		//case 1: month or year is updated from the onChange event of year/month buttons:
		//	a. refresh data for all the charts by calling getData()
		//  b. redraw all charts
		if(fromChartType == 'REFRESH') {
			this.years = args['YEAR'];
			this.months = args['MONTH'];
			// reset business units to include ALL
			this.setBusinessUnitsFromJSON();

			args['BUSINESSUNIT'] = this.businessUnits;
			args['CUSTOMER'] = [];

			var chartData = this.getData(args);
			Log('initialising pie, bar & bubble charts');

			this.showPieChart(chartData['PIECHART']);
			this.showBarChart(chartData['BARCHART']);
			this.showBubbleChart(chartData['BUBBLECHART']);
		}
		// Case 2: A selection is made in Pie chart
		// and the bar chart and it's successors charts should
		// propagate the selections made.
		// Note: This should be called with BUSINESSUNITS args
		else if(fromChartType == 'PIE') {
			// If no business units are selected, default to the
			// units from json. Otherwise, use the current selections.
			if(args['BUSINESSUNIT'].length == 0) {
				Log('business unit length is zero.. pulling data from json');
				this.setBusinessUnitsFromJSON();
				args['BUSINESSUNIT'] = this.businessUnits;
			}
			else {
				this.businessUnits = args['BUSINESSUNIT'];
				Log('using bu from pie:' + this.businessUnits);
			}

			args['YEAR'] = this.years;
			args['MONTH'] = this.months;
			args['CUSTOMER'] = [];

			var chartData = this.getData(args);
			Log('updating bar charts');
			this.showBarChart(chartData['BARCHART']);
			this.showBubbleChart(chartData['BUBBLECHART']);
		}
		// Case 3: A selection is made in Bar chart
		// and the bubble chart should propagate the selections made.
		// Note: This should be called with CUSTOMER args
		else if(fromChartType == 'BAR') {
			args['YEAR'] = this.years;
			args['MONTH'] = this.months;
			args['BUSINESSUNIT'] = this.businessUnits;

			var chartData = this.getData(args);
			Log('updating bubble charts');
			this.showBubbleChart(chartData['BUBBLECHART']);
		}
	},
	/*
	 * Parses given input json to fetch data that .
	 * ChartData={
	 *	'BARCHART' : {label: <customer>, revenue: <revenue>},
	 *	'PIECHART' : {label: <BusinessUnit>, revenue: <revenue>},
	 *	'BUBBLECHART' : {label: <country>, revenue: <revenue>}
	 * };
	 */
	this.getData = function(args) {

		var inputData = this.jsonObject['ALLDATA'];
		//verify whether expected fields are present in arguments
		var fields = ['BUSINESSUNIT', 'YEAR', 'MONTH', 'CUSTOMER'];
		var mandatoryFields = ['BUSINESSUNIT', 'YEAR', 'MONTH'];

		if(!requireFields(args, fields, mandatoryFields)) {
			Log("Visualization.js: getData():-Expected argument missing!");
			return {};
		}

		//get required data from input object
		var selectedBusinessUnits = args['BUSINESSUNIT'];
		var selectedYears = args['YEAR'];
		var selectedMonths = args['MONTH'];
		var selectedCustomers = args['CUSTOMER'];
		var busUnitIndex = 0, customerIndex = 0, countryIndex=0, revenueByCustomer = 0, revenueByProdMix = 0;
		var chartData = {};
		var pieChartDataArray = [], barChartDataArray = [], bubbleChartDataArray = [];
		var customerJSON = {};
		var countryJSON = {};

		//check whether arguments have valid data
		if(args['CUSTOMER'].length == 0) {
			//iterate the inputData for all customers and compose output for pieChart, Barchart and bubbleChart
			for(var busUnit in selectedBusinessUnits) {
				//set the busUnit as value, rather than index. (to improve readablity)
				var selectedBusUnit = selectedBusinessUnits[busUnit];
				var revenueByBusinessUnit = 0;
				//for each year accumulate the revenue for charts 
				for(var year in selectedYears) {
					//set the year as value, rather than index. (to improve readablity)
					var selectedYear = selectedYears[year];
					//check whether year property is present for this object
					if(inputData[selectedBusUnit].hasOwnProperty(selectedYear)) {
						//for each month accumulate the revenue for charts
						for(var month in selectedMonths) {
							//set the year as value, rather than index. (to improve readablity)
							var selectedMonth = selectedMonths[month];
							//check whether month property is present for this object
							if(inputData[selectedBusUnit][selectedYear].hasOwnProperty(selectedMonth)) {

								revenueByBusinessUnit += inputData[selectedBusUnit][selectedYear][selectedMonth]['TOTAL'];
								var customers = inputData[selectedBusUnit][selectedYear][selectedMonth];
								
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
										//gather data for bubble chart
										for(var country in customers[customer]){

											if(country != 'TOTAL'){
												
												for(var prodMix in customers[customer][country]) {

													if(countryJSON.hasOwnProperty(country)) {

														revenueByProdMix = customers[customer][country][prodMix];

														if(countryJSON[country].hasOwnProperty(prodMix)){

															revenueByProdMix += countryJSON[country][prodMix];
															countryJSON[country][prodMix] = revenueByProdMix;

														}
														else {
															countryJSON[country][prodMix] = revenueByProdMix;
														}
													}
													else{

														countryJSON[country] = {};
														countryJSON[country][prodMix] = customers[customer][country][prodMix];
													}
												}
											}
										}
									}
								}
							}
						}	
					}
				}
				//populate data for pie chart
				var pieChartData = {};
				pieChartData['label'] = selectedBusUnit;
				pieChartData['data'] = revenueByBusinessUnit;
				pieChartDataArray[busUnitIndex++] = pieChartData;
			}
		}
		else {
			//iterate the inputData for selected customers and compose output for pieChart, Barchart and bubbleChart
			for(var busUnit in selectedBusinessUnits) {
				var revenueByBusinessUnit = 0;
				//set the busUnit as value, rather than index. (to improve readablity)
				var selectedBusUnit = selectedBusinessUnits[busUnit];
				//for each year accumulate the revenue for charts 
				for(var year in selectedYears) {
					//set the year as value, rather than index. (to improve readablity)
					var selectedYear = selectedYears[year];
					//check whether year property is present for this object
					if(inputData[selectedBusUnit].hasOwnProperty(selectedYear)) {					
						//for each month accumulate the revenue for charts 
						for(var month in selectedMonths) {
							//set the year as value, rather than index. (to improve readablity)
							selectedMonth = selectedMonths[month];
							//check whether month property is present for this object
							if(inputData[selectedBusUnit][selectedYear].hasOwnProperty(selectedMonth)) {
								revenueByBusinessUnit += inputData[selectedBusUnit][selectedYear][selectedMonth]['TOTAL'];
								var customers = inputData[selectedBusUnit][selectedYear][selectedMonth];

								for(var customerPos in selectedCustomers) {

									var customer = selectedCustomers[customerPos];
									//gather data for bar chart
									//check whether customer property is present for this object
									if(customers.hasOwnProperty(customer)) {

										revenueByCustomer = customers[customer]['TOTAL'];
										
										if(customerJSON.hasOwnProperty(customer)){
											revenueByCustomer += customerJSON[customer];
											customerJSON[customer] = revenueByCustomer;
										}
										 else {
											customerJSON[customer] = revenueByCustomer;
										}
										//gather data for bubble chart
										for(var country in customers[customer]){

											if(country != 'TOTAL'){

												for(var prodMix in customers[customer][country]){

													if(countryJSON.hasOwnProperty(country)) {
															revenueByProdMix = customers[customer][country][prodMix];

															if(countryJSON[country].hasOwnProperty(prodMix)){

																revenueByProdMix += countryJSON[country][prodMix];
																countryJSON[country][prodMix] = revenueByProdMix;

															}
															else {
																countryJSON[country][prodMix] = revenueByProdMix;
															}
													}
													else {
														countryJSON[country] = {};
														countryJSON[country][prodMix] = customers[customer][country][prodMix];
													}
												}
											}
										}
									}
								}
							}
						}
					}	
				}
				//populate data for pie chart
				var pieChartData = {};
				pieChartData['label'] = selectedBusUnit;
				pieChartData['data'] = revenueByBusinessUnit;
				pieChartDataArray[busUnitIndex++] = pieChartData;
			}

		}

		//populate data for bar chart
		for(customer in customerJSON) {
			var barChartData = {};
			barChartData['label'] = customer;
			barChartData['data'] = customerJSON[customer];
			barChartDataArray[customerIndex++] = barChartData;
		}

		//populate data for bubble chart

		/*{
			"Name" 		: country,
			"children"	: [
				{"Name": <prodMix>, "size": <revenue>},
				{"Name": <prodMix>, "size": <revenue>}
			]
		}
			
		*/
		var bubbleChartArray = [];
		var bubbleChartData = { 
			Name: "Bubble",
			children: bubbleChartArray
		};

		var countryIndex = 0;
		for(country in countryJSON) {

			var bubbleChart = {};
			bubbleChart['name'] = country;
			bubbleChart['children'] =[];

			var prodIndex = 0;
			for(var prodMix in countryJSON[country]) {

				bubbleChart['children'][prodIndex] ={};
				bubbleChart['children'][prodIndex]['name'] = prodMix;
				bubbleChart['children'][prodIndex]['size'] = countryJSON[country][prodMix];
				prodIndex++;
			}
			bubbleChartArray[countryIndex++] = bubbleChart;
		}

		chartData['PIECHART'] = pieChartDataArray;
		chartData['BARCHART'] = barChartDataArray;
		chartData['BUBBLECHART'] = bubbleChartData;

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
	this.drawPieChart = function(pieName, dataset, selectString, canvasWidth, colors, margin, outerRadius, innerRadius, sortArcs) {
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
			selectedArc.style("fill", "maroon");

			var total = d3.sum(dataset.map(function(d) {
				return d.data;
			}));

			var percent = 0;
			if(total)
				percent = Math.round(1000 * d.data.data / total) / 10;

			var tooltipHTML = "<table class='pie-tooltip'>"
				+ "<tbody>"
					+ "<tr>"
						+ "<th colspan=2>" + d.data.label + "</th>"
					+ "</tr>"
					+ "<tr>"
						+ "<td>"
							+ percent + "%"
						+ "</td>"
						+ "<td class='value'> $" + formatCurrency(d.data.data, 1, 'M') + "</td>"
					+ "</tr>"
				+ "</tbody>"
			+ "</table>";

			//display percent value in tool tip for the seleceted arc
			tip.html(tooltipHTML);
			tip.show();
		};

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
			.call(tip); //attach tip to svg group

		// Define an arc generator. This will create <path> elements for using arc data.
		var arc = d3.svg.arc()
			.innerRadius(innerRadius) // Causes center of pie to be hollow
			.outerRadius(outerRadius);

		var arcOver = d3.svg.arc()
			.outerRadius(outerRadius + 10);

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
				var currentArc = d3.select(this);
				var indexValue = currentArc.attr("index_value");

				var arcSelector = "." + "pie-" + pieName + "-arc-" + indexValue;
				var selectedArc = d3.selectAll(arcSelector);

				// First time selected, push it to our list of stored business units
				// , mark it selected by coloring it in Maroon and then update the bar chart.
				if(selectedArc.attr('selected') == '0') {
					selectedArc.attr('selected', '1');
					currentArc.attr("stroke","white")
						.transition()
						.duration(1000)
						.attr("d", arcOver)             
						.attr("stroke-width", 6);

					//selectedArc.style("fill", "Maroon");
					parent.chartSelections.PIECHART[data.data.label] = '1';

					parent.updateView({
						'BUSINESSUNIT' : Object.keys(parent.chartSelections.PIECHART),
					}, 'PIE');
				}
				// If it's already selected, replace maroon with it's old color
				// and remove it from the stored list.
				else {
					//var colorValue = selectedArc.attr("color_value");
					//selectedArc.style("fill", colorValue);

					delete parent.chartSelections.PIECHART[data.data.label];
					selectedArc.attr('selected', '0');

					currentArc.transition()            
						.attr("d", arc)
						.attr("stroke","none");

					parent.updateView({
						'BUSINESSUNIT' : Object.keys(parent.chartSelections.PIECHART),
					}, 'PIE');
				}
			})
			//.on("mousemove", synchronizedMouseMove)
			.transition()
			.ease("bounce")
			.duration(1000)
			//.delay(function(d, i) { return i * 50; })
			.attrTween("d", tweenPie);

		// Add a magnitude value to the larger arcs, translated to the arc centroid and rotated.
		arcs.filter(function(d) { return d.endAngle - d.startAngle > .2; })
			.append("svg:text")
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

	this.drawBarChart = function(dataset, selectString, width, height) {
		var elt = d3.select(selectString);
		var stockData = null,
			yMax;
		var totalRevenue = d3.sum(dataset.map(function(d) {
			return d.data;
		}));

		var tip = d3.tip()
			.attr('class', 'd3-tip')
			.offset([0, 0]);

		var mouseDownEventHandler = function(element, data) {
			var currentBar = d3.select(element);
			// First time selected, push it to our list of stored customer units
			// , mark it selected by coloring it in Maroon and then update the bar chart.
			if(currentBar.attr('selected') == '0') {
				currentBar.attr('selected', '1');
				currentBar.style("fill", "maroon");

				parent.chartSelections.BARCHART[ data[0] ] = '1';
				parent.updateView({
					'CUSTOMER' : Object.keys(parent.chartSelections.BARCHART),
				}, 'BAR');
			}
			// If it's already selected, replace maroon with it's old color
			// and remove it from the stored list.
			else {
				delete parent.chartSelections.BARCHART[ data[0] ];
				currentBar.attr('selected', '0');

				// this should reflect the color of the bar originally
				// which is currently set to a constant in barchart.js
				currentBar.style("fill", "steelblue");
				parent.updateView({
					'CUSTOMER' : Object.keys(parent.chartSelections.BARCHART),
				}, 'BAR');
			}

			var selectionsHTML = '';
			for(var barSelections in parent.chartSelections.BARCHART) {
				selectionsHTML += '| <strong>' + barSelections + '</strong> ';
			}
			if(selectionsHTML != '')
				selectionsHTML += "|";
			$('#bar-div > #barselection-div').html(selectionsHTML);

			// The current selection is returned so that we could render selected charts on them
			return Object.keys(parent.chartSelections.BARCHART);
		};

		function showHover(element, d) {
			var percent = 0;
			percent = Math.round(1000 * d[1] / totalRevenue) / 10;

			var currentBar = d3.select(element);
			currentBar.style('fill', 'maroon');

			var tooltipHTML = "<table class='pie-tooltip'>"
				+ "<tbody>"
					+ "<tr>"
						+ "<th colspan=2>" + d[0] + "</th>"
					+ "</tr>"
					+ "<tr>"
						+ "<td>"
							+ percent + "%"
						+ "</td>"
						+ "<td class='value'> $" + formatCurrency(d[1], 1, 'M') + "</td>"
					+ "</tr>"
				+ "</tbody>"
			+ "</table>";

			//display percent value in tool tip for the seleceted arc
			tip.html(tooltipHTML);
			tip.show();

/*
			var hoverDiv = d3.selectAll("#hover");
			var html = '<h2>' + d[0] + '</h2>';
			html += '<div class="key-value"><div class="value">' + percent + '%</div><div class="key">Revenue Percentage</div></div>';
			html += '<div class="key-value"><div class="value">' + d3.format("$,.3r")(+d[1]) + "m" + '</div><div class="key"> Revenue </div></div>';
			hoverDiv.html(html);
			hoverDiv.style("opacity", 1);
*/
		}

		function hideHover(element, d) {
			var currentBar = d3.select(element);
			// If this isn't selected by mouse, restore the original color
			if(currentBar.attr('selected') == '0')
				currentBar.style("fill", 'steelblue');
/*
			var hoverDiv = d3.selectAll("#hover");
			hoverDiv.style("opacity", 1e-6);
*/
			tip.hide();
		}

		var rangeWidget = d3.elts.startEndSlider().minRange(1000);//.scale;
		//d3.select('body').datum([{start: new Date("2001-01-01"), end: new Date("2002-01-01")}]).call(mySlider);
		var milDol = function(v) { return d3.format("$,.0f")(v)};
		var myChart = d3.elts.barChart()
			.width(width)
			.height(height)
			.yMin(0)
			.rangeWidget(rangeWidget)
			.yAxis(d3.svg.axis().orient("left").tickSize(6, 0).tickFormat(milDol))
			.xDomain([0, 13]) // Controls the number of bars that appear in the chart at any time(slider should be used to see the further ones)
			.xAxisIfBarsWiderThan(11)
			.xAxisAnimate(false)
			.mouseOver(function(el, d) { showHover(el, d) })
			.mouseOut(function(el, d) { hideHover(el, d) })
			.mouseDown(function(el, d) { return mouseDownEventHandler(el, d); })
			.margin({top: 40, right: 20, bottom: 60, left: 100})
			.attachTip(tip);

		redraw = function(sortCol) {
			stockData = _.sortBy(stockData, function(d) { if (sortCol === 1) return -d[1]; else return d[0]; });
			myChart.yMax(function(data) {
				var high = d3.max(data, function(d) {return d[1]}); 
				return high; // scales up small values, but not to the top
			});
			elt.datum(stockData).call(myChart);
		}

		stockData = _.map(dataset, function(d) {
			return [ d.label, d.data ];
		});
		yMax = d3.max(stockData, function(d) {return d[1]});
		redraw(1);
	},
/*
		var JSONdata = convertDataForBarChart(dataset);
		var yAxisData = JSONdata['dataArray'];
		var labelData = JSONdata['labelArray'];

		Log("drawing bar chart");
		
		c3.generate({
			bindto: division,
			data: {
			  columns: [
				yAxisData
			  ],
			  axes: {
				customers : 'y'
			  },
			  types: {
				customers : 'bar' // ADD
			  }
			},
			tooltip: {
			  contents: function (d, defaultTitleFormat, defaultValueFormat, color) {

			  	//format currency to have commas
				var revenue = d[0].value.toFixed(0).replace(/./g, function(c, i, a) {
					return i && c !== "." && ((a.length - i) % 3 === 0) ? ',' + c : c;
				});

				var tooltipHTML = "<table class='pie-tooltip'>"
							+ "<tbody>"
								+ "<tr>"
									+ "<th colspan=2>" + d[0].x + "</th>"
								+ "</tr>"
								+ "<tr>"
									+ "<td class='value'> $" + revenue + "</td>"
								+ "</tr>"
							+ "</tbody>"
						+ "</table>";

			    return tooltipHTML;
				//return defaultValueFormat;
			  }
			},
			axis: {
			  y: {
			  	type: 'bar',
			  	tick: {
			  		count: 6,
			  		format: function(x){

		  				var revenue = x.toFixed(0).replace(/./g, function(c, i, a) {
							return i && c !== "." && ((a.length - i) % 3 === 0) ? ',' + c : c;
						});

						return "$"+revenue;

			  		}
			  	},
				label: {
				  text: 'Revenue',
				  position: 'outer-middle'
				}
			  },
			  y2: {
				show: false,
				label: {
				  text: 'Y2 Label',
				  position: 'outer-middle'
				}
			  }
			}
		});

		 //c3-event-rect c3-event-rect-12

		d3.selectAll('.c3-event-rect')
			.on('click', function(value, index) {
				d3.select('.c3-event-rect-' + index).style('fill', 'yellow').style('opacity', '1');
				Log("index = " + index + " value = " + columnData[index]);
			});
	},

	this.drawBarChart = function(dataset, division){		
		var margin = {top: 20, right: 20, bottom: 30, left: 40},
		width = 800 - margin.left - margin.right,
		height = 300 - margin.top - margin.bottom;
		
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

		svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")");
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

		svg.selectAll(".bar")
				.data(dataset)
				.enter().append("rect")
				.attr("class", "bar")
				.attr("x", function(d) { return x(d.label); })
				.attr("width", x.rangeBand())
				.on('mouseover', function(d){


				})
				.on('mouseout',tipBar.hide)
				.attr("y", function(d) { return y(d.data); })
				.attr("height", function(d) { return height - y(d.data); });

	function mouseOver(d) {
		
		var tableMessage = "<table border='2' align='center'><tr><td >Customer</td><td bgcolor='green' align='center'>"+ d.label +"</td></tr><tr><td>Revenue</td><td bgcolor='green' align='center'> $"+ formatCurrency(d.data, 1) +"</td></tr></table>";
		//display percent value in tool tip for the seleceted bar
		console.log(d.data);
		tipBar.html(function(b) {
			return tableMessage;
		});
		tipBar.show();
	}

	}*/

	this.drawBubbleChart = function(root, division) {

		var margin = 20,
		diameter = 340;

		var color = d3.scale.linear()
		.domain([-1, 5])
		.range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
		.interpolate(d3.interpolateHcl);

		var pack = d3.layout.pack()
		.padding(2)
		.size([diameter - margin, diameter - margin])
		.value(function(d) { return d.size; })

		var svg = d3.select(division).append("svg")
		.attr("width", diameter)
		.attr("height", diameter)
		.append("g")
		.attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

		var focus = root,
		nodes = pack.nodes(root),
		view;

		var circle = svg.selectAll("circle")
		.data(nodes)
		.enter().append("circle")
		.attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
		.style("fill", function(d) { return d.children ? color(d.depth) : null; })
		.on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); });

		var text = svg.selectAll("text")
		.data(nodes)
		.enter().append("text")
		.attr("class", "bubble-label")
		.style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
		.style("display", function(d) { return d.parent === root ? "inline" : "none"; })
		.text(function(d) { return d.name; });

		var node = svg.selectAll("circle,text");

		d3.select(division)
		//.style("background", color(-1))
		.on("click", function() { zoom(root); });

		zoomTo([root.x, root.y, root.r * 2 + margin]);

		function zoom(d) {
		var focus0 = focus; focus = d;

		var transition = d3.transition()
		.duration(d3.event.altKey ? 7500 : 750)
		.tween("zoom", function(d) {
		  var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
		  return function(t) { zoomTo(i(t)); };
		});

		transition.selectAll("text")
		.filter(function(d) { 
			if(!d) 
				return false;
			return d.parent === focus || this.style.display === "inline"; })
		.style("fill-opacity", function(d) { 
			if(!d) 
				return false;
			return d.parent === focus ? 1 : 0; })
		.each("start", function(d) { 
			if (d && d.parent === focus) this.style.display = "inline"; })
		.each("end", function(d) { if (d && d.parent !== focus) this.style.display = "none"; });
		}

		function zoomTo(v) {
		var k = diameter / v[2]; view = v;
		node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
		circle.attr("r", function(d) { return d.r * k; });
		}

		d3.select(self.frameElement).style("height", diameter + "px");
	},

	this.destroy = function() {

	}
};