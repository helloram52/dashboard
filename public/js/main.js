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

	$('.btn-group .btn').on('click', function() {
		// Queuing up the update event as the bug in bootstrap
		// doesn't toggle the button's active class as soon as
		// the click happened.
		$(this).delay(100).queue(updateYearQtrMonthButtons);
	});
	// Handle Qtr/Year/Month checkbox clicks
	// In Qtr and Year groups, ALL checkbox and the rest of the buttons are mutually exclusive
	// i.e If a QTR-1 checkbox is selected, ALL shouldn't appear selected.
	var updateYearQtrMonthButtons = function() {
		var self = $(this);
		var checkbox = self.find(':checkbox');
		// return if there isn't a checkbox within the btn-group.
		// Unlikely to happen.
		if(checkbox.length == 0)
			return;

		var checkboxID = checkbox.attr('id');
		var state = self.hasClass('active');
		console.log("checkbox id: " + checkboxID + " state: " + state);

		// If it's a month button, just update the respective quarter(s).
		if(self.parent().hasClass('month-group')) {
			updateQuarter(checkboxID, self.hasClass('active'));
			preserveMonthValidity();
		}
		else {
			// If non-ALL QTR checkboxes are selected, uncheck 'ALL' checkbox
			if (checkboxID.match(/all/) == null) {
				//alert('checkbox clicked');
				var allCheckbox = self.parent().find(":first")
				if(allCheckbox.hasClass("active")) {
					console.log("\tunchecked");
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
			var selectedQuarters = getSelectedQuarters();
			// Preserve the validity of the quarter selections/unselections
			// when a qtr-group button is set active/inactive.
			if(self.parent().hasClass('qtr-group'))
				preserveQuarterValidity(selectedQuarters);
		}
		$(this).dequeue();
	};
});

// Returns an array of id of the selected quarters
function getSelectedQuarters() {
	var selectedQuarters = [];
	$('.qtr-group .btn').each(function(index) {
		if($(this).hasClass('active'))
			selectedQuarters.push($(this).find(':checkbox').attr('id'));
	});

	return selectedQuarters;
}

// Returns an array of id of the selected months
function getSelectedMonths() {
	var selectedMonths = [];
	$('.month-group .btn').each(function(index) {
		if($(this).hasClass('active'))
			selectedMonths.push($(this).find(':checkbox').attr('id'));
	});

	return selectedMonths;
}

/*
 * Handles the below cases for the Qtr button group
 * - If all the buttons aren't active, make the 'ALL' button active.
 * - If a qtr is selected, only it's respective months should be selected
 * 	and the other months should get unselected.
 */
function preserveQuarterValidity(selectedQuarters) {
	console.log('presqtr: selectedQuarters: ' + selectedQuarters);
	var monthsToAppearSelected = [], allFlag = false;
	if(selectedQuarters && selectedQuarters.length > 0) {
		for(var i=0;i < selectedQuarters.length;i++) {
			// If ALL quarter checkbox is selected we've to select all checkboxes
			// Break and set all flag.
			if(selectedQuarters[i] == 'qtr-all') {
				allFlag = true;
				break;
			}
			$.merge(monthsToAppearSelected, qtrIDToMonthsIDMap[ selectedQuarters[i] ]);
		}
	}
	else {
		allFlag = true;
	}

	// If allFlag is set, simulate all click.
	if(allFlag) {
		var allParentDiv = $('#qtr-all').parent();
		if(!allParentDiv.hasClass('active'))
			allParentDiv.addClass('active');
		updateMonths('qtr-all', true);
	}
	else {
		console.log('monthsToAppearSelected: ' + monthsToAppearSelected + ' getSelectedMonths: ' + getSelectedMonths());
		// Uncheck the ones that don't correspond to the current quarter selection
		// Note: Checking the respective months would be taken care by updateMonths func
		$.each(getSelectedMonths(), function(index, value) {
			console.log("elem: '" + value + "' index: '" + InList(monthsToAppearSelected, value));
			// If an option that shouldn't be selected is currently selected, unselect it.
			if(InList(monthsToAppearSelected, value) == -1) {
				console.log("removing active for element:" + value);
				$('#'+value).parent().removeClass('active');
			}
		});
	}
}

/*
 * Handles the below cases for the month button group
 * - If a month is set inactive, disable the respective Qtr. Also 
 * if this is the last button to be set inactive, simulat 'ALL' button's click event.
 */
function preserveMonthValidity() {
	
}

/*
 * Updates the respective Qtr button whenever a month is clicked. Handles the below cases.
 * - If ALL currently appears selected and the current month is deselected, then we should clear
 *	the ALL selection. Similarl thing applies for other QTR boxes as well.
 * - When all the months are deselected, 'ALL' checkbox should be enabled.
 * - 
 */
function updateQuarter(checkboxID, checkboxState) {
	console.log("updateqtr, checkbox id:" + checkboxID + " state:" + checkboxState);
	var monthID = monthsToIDMap[checkboxID];
	var qtrToCheck;
	if(monthID <= 3) {
		qtrToCheck = 'qtr1';
	}
	else if(monthID >= 4 && monthID <= 6) {
		qtrToCheck = 'qtr2';
	}
	else if(monthID >= 7 && monthID <= 9) {
		qtrToCheck = 'qtr2';
	}
	else if(monthID >= 10 && monthID <= 12) {
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
	console.log("updatemonths, checkbox id:" + checkboxID + " state:" + checkboxState);
	var qtrsToCheck;
	if(checkboxID === 'qtr-all')
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
			console.log('\t\tcurrent state: ' + labelDiv.hasClass('active'));
			if(labelDiv.hasClass('active') && !checkboxState) {
				labelDiv.removeClass('active');
				console.log('\t\t\tsetting ON');
			}
			else if(!labelDiv.hasClass('active') && checkboxState) {
				labelDiv.addClass('active');
				console.log('\t\t\tsetting OFF');
			}
		});
	});
}