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
	this.data = {};
	this.canvasSelectorString = '';

	this.init = function(jsonObject, canvasSelectorString) {
		this.data = jsonObject;
		this.canvasSelectorString = canvasSelectorString;
		this.parseData();

		//var dataset2 = this.getPieChartData(jsonObject);
		//this.drawPieChart("Revenue", dataset1, this.canvasSelectorString, "colorScale20", 10, 100, 5, 0);
		//this.UpdateView(jsonObject, ['I','H'], [2000], [1], [15,12,1]);


		//var args={'BUSSINESSUNIT' : businessUnits, 'YEAR': years, 'MONTH' : months, 'CUSTOMER': customers};
		var result=this.getAllData(jsonObject['ALLDATA']);

		console.log(result);

		//this.updateView(jsonObject, ['I','H'], [2000], [1], [15,12,1]);
		this.showPieChart(result['PIECHART']);
		this.showBarChart(result['BARCHART']);
		//this.showClusterChart();
	},

	this.parseData = function() {

	},
	

	this.showBarChart =function(barChartData) {

		if(barChartData.length != 0){
			this.drawBarChart(barChartData, '#pie-div');
		}
	},

	this.showPieChart =function(pieChartData) {

		if(pieChartData.length != 0){
			this.drawPieChart("Revenue", pieChartData, '#pie-div', "colorScale20", 10, 100, 5, 0);
		}
	},

	this.updateView = function(jsonObject, businessUnits, years, months, customers) {

	},

	this.getAllData = function(inputData) {

		//get required data from input object
		var busUnitIndex = 0, customerIndex = 0, countryIndex=0, revenueByCustomer = 0, revenueByCountry = 0;
		var chartData = {};
		var pieChartDataArray = [], barChartDataArray = [], clusterChartDataArray = [];
		var customerJSON = {};
		var countryJSON = {};

		//iterate the inputData for all customers and compose output for pieChart, Barchart and clusterChart
		for(var busUnit in inputData) {
			var revenueByBusinessUnit = 0;
			//for each year accumulate the revenue for charts 
			for(var year in inputData[busUnit]) {
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
			}
			//populate data for pie chart
			var pieChartData = {};
			pieChartData['label'] = busUnit;
			pieChartData['data'] = revenueByBusinessUnit;
			pieChartData['link'] = "";
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
	this.getData = function(inputData, args) {

		//verify whether expected fields are present in arguments
		var fields = ['BUSSINESSUNIT', 'YEAR', 'MONTH', 'CUSTOMER'];
		var mandatoryFields = ['BUSSINESSUNIT', 'YEAR', 'MONTH'];

		if(!requireFields(args, fields, mandatoryFields)){
			console.log("Expected argument missing!");
			return {};
		}

		//get required data from input object
		var selectedBusinessUnits = args['BUSSINESSUNIT'];
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
				pieChartData['link'] = "";
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
				pieChartData['link'] = "";
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
		var pieWidthTotal = outerRadius * 2;;
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
				var message = "<strong>"+d.data.label+":</strong> <span style='color:red'>" + percent + "%</span>"+" <br /><strong> Revenue:</strong> <span style='color:red'>" + formatCurrency(d.data.data, 1) + "</span>";
				return tableMessage;
						//<br> <strong>"+ Revenue+":</strong> <span style='color:red'>" + d.data.dat + "%</span>";
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
			.attr("xlink:href", function(d) { return d.data.link; })
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
			.attr("class", function(d, i) { return "pie-" + pieName + "-arc-index-" + i; })
			.attr("d", arc)
			.on('mouseover', synchronizedMouseOver)
			.on("mouseout", synchronizedMouseOut)
			//.on("mousemove", synchronizedMouseMove)
			.transition()
			.ease("bounce")
			.duration(200)
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
		width = 300 - margin.left - margin.right,
		height = 300 - margin.top - margin.bottom;
		
		/*var margin = {top: 20, right: 20, bottom: 30, left: 40},
		width = 960 - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom;
		*/
		var x = d3.scale.ordinal()
		.rangeRoundBands([0, width], .1);

		var y = d3.scale.linear()
		.range([height, 0]);

		var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");

		var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
		.ticks(10, "%");

		var svg = d3.select(division).append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		x.domain(dataset.map(function(d) { return d.label; }));
		y.domain([0, d3.max(dataset, function(d) { return d.data; })]);

		svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

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
		.attr("x", function(d) { console.log("label:"+d.label+" data:"+d.data); return x(d.label); })
		.attr("width", x.rangeBand())
		.attr("y", function(d) { return y(d.data); })
		.attr("height", function(d) { return height - y(d.data); });

	}

	this.destroy = function() {

	}
};