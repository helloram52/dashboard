var chartVisualization;
var monthsToIDMap = {
	'jan' : 1,
	'feb' : 2,
	'mar' : 3,
	'apr' : 4,
	'may' : 5,
	'jun' : 6,
	'jul' : 7,
	'aug' : 8,
	'sept' : 9,
	'oct' : 10,
	'nov' : 11,
	'dec' : 12
};

// Maps qtr ids to month ids
var qtrIDToMonthsIDMap = {
	'qtr1' : [
		'jan',
		'feb',
		'mar'
	],
	'qtr2' : [
		'apr',
		'may',
		'jun',
	],
	'qtr3' : [
		'jul',
		'aug',
		'sept',
	],
	'qtr4' : [
		'oct',
		'nov',
		'dec',
	]
};

$(document).ready(function() {
	$.get("/getGraphJSON", function(jsonData) {
		$('.loadingbtn').css('display', 'none');
		// Set Years field using the json.

		// Initialize chart visualization
		chartVisualization = new Visualization();
		chartVisualization.init(jsonData, '#canvas-div');
	});

	// Handle Qtr/Year/Month checkbox clicks
	// In Qtr and Year groups, ALL checkbox and the rest of the buttons are mutually exclusive
	// i.e If a QTR-1 checkbox is selected, ALL shouldn't appear selected.
	$('.btn-group .btn').on('click', function() {
		var self = $(this);
		var checkbox = self.find(':checkbox');
		// return if there isn't a checkbox within the btn-group.
		// Unlikely to happen.
		if(checkbox.length == 0)
			return;

		var checkboxID = checkbox.attr('id');
		console.log("checkbox id:" + checkboxID);
		
		// If it's a month button, just update the respective quarter button.
		if(self.hasClass('month-group')) {
			updateQuarter(checkboxID, self.hasClass('active'));
		}
		else {
			// If non-ALL QTR checkboxes are selected, uncheck 'ALL' checkbox
			if (checkboxID != 'ALL') {
				//alert('checkbox clicked');
				var allCheckbox = self.parent().find(":first")
				if(allCheckbox.hasClass("active")) {
					allCheckbox.removeClass("active");
				}
			}
			// If ALL is checked, uncheck all other selections.
			else {
				self.parent().children().each(function(i) {
					// Skip if this is the ALL checkbox
					if($(this).is(checkbox))
						return;
					if( $(this).hasClass("active") ) {
						$(this).removeClass("active");
					}
				});
			}
			// Also select the respective month checkboxes
			updateMonths(checkboxID, self.hasClass('active'));
		}
	});
});

// Updates the respective Qtr button whenever a month is clicked.
function updateQuarter(checkboxID, checkboxState) {
	var monthID = monthsToIDMap(checkboxID);
	var qtrToCheck;
	if(checkboxID <= 3) {
		qtrToCheck = 'qtr1';
	}
	else if(checkboxID >= 4 && checkboxID <= 6) {
		qtrToCheck = 'qtr2';
	}
	else if(checkboxID >= 7 && checkboxID <= 9) {
		qtrToCheck = 'qtr2';
	}
	else if(checkboxID >= 10 && checkboxID <= 12) {
		qtrToCheck = 'qtr2';
	}
	if(qtrToCheck) {
		var qtrParentDiv = $('#' +  qtrToCheck).parent();
		if(!qtrParentDiv)
			return;
		if(qtrParentDiv.hasClass('active') && !checkboxState) {
			qtrParentDiv.removeClass('active');
			console.log('\t\tsetting ON ' + qtrToCheck);
		}
		else if(!qtrParentDiv.hasClass('active') && checkboxState) {
			qtrParentDiv.addClass('active');
			console.log('\t\tsetting OFF ' + qtrToCheck);
		}
	}

}

function updateMonths(checkboxID, checkboxState) {
	var qtrsToCheck;
	if(checkboxID === 'ALL')
		qtrsToCheck = ['qtr1', 'qtr2', 'qtr3', 'qtr4'];
	else
		qtrsToCheck = [ checkboxID ];

	$.each(qtrsToCheck, function(quarterIndex, quarter) {
		console.log('updating quarter : ' + quarter);
		// For each month within the quarter to check, find the respective parent
		// and set/remove its active class based on the given checkboxState
		$.each(qtrIDToMonthsIDMap[quarter], function(monthIndex, month) {
			console.log('\tupdating month : ' + month);
			var labelDiv = $('#' + month).parent();
			// If there isn't a parent, exit.
			if(!labelDiv)
				return;
			if(labelDiv.hasClass('active') && !checkboxState) {
				labelDiv.removeClass('active');
				console.log('\t\tsetting ON');
			}
			else if(!labelDiv.hasClass('active') && checkboxState) {
				labelDiv.addClass('active');
				console.log('\t\tsetting OFF');
			}
		});
	});
}