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

		// Let's update the view for every year/month update
		gatherMonthYearsDataAndUpdateVisualization();
		$(this).dequeue();
	};
});

function gatherMonthYearsDataAndUpdateVisualization() {
	var selectedMonths = getSelectedMonths();
	var selectedYears = getSelectedYears();

	chartVisualization.updateView({
		'month' : selectedMonths,
		'year' : selectedYears
	});
}

// Returns an array of id of the selected years
function getSelectedYears() {
	var selectedQuarters = [];
	$('.year-group .btn').each(function(index) {
		if($(this).hasClass('active'))
			selectedQuarters.push($(this).find(':checkbox').attr('id'));
	});

	return selectedQuarters;
}

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
 * - If all the quarters aren't active, make the 'ALL' button active.
 * - If a qtr is selected, only it's respective months should appear selected i.e. disable the rest
 * - If 4 quarters are selected, deselect all of them and set ALL active.
 */
function preserveQuarterValidity(selectedQuarters) {
	var monthsToAppearSelected = [], allFlag = false;
	var selectedMonths = getSelectedMonths();

	if(selectedQuarters && selectedQuarters.length > 0) {
		// If all the 4 quarters are selected, deselect all of them
		// and then set 'ALL' quarter.
		if(selectedQuarters.length == 4) {
			allFlag = true;
		}
		else {
			for(var i=0;i < selectedQuarters.length;i++) {
				/*
				// If ALL quarter checkbox is selected, we've to select all checkboxes
				// Break and set all flag. Ideally this shouldn't happen since we unset
				// other quarters when all is selected.
				if(selectedQuarters[i] == 'qtr-all') {
					allFlag = true;
					break;
				}
				*/
				$.merge(monthsToAppearSelected, qtrIDToMonthsIDMap[ selectedQuarters[i] ]);
			}
		}
	}
	else {
		// If no quarters and months appear selected, then set 'ALL' qtr
		if(selectedMonths.length == 0)
			allFlag = true;
	}

	// If allFlag is set, set the ALL qtr active and uncheck the other qtrs.
	if(allFlag) {
		setAllQtrActive();
	}
	else {
		// Uncheck the ones that don't correspond to the current quarter selection
		// Note: Checking the respective months would be taken care by updateMonths func
		$.each(selectedMonths, function(index, value) {
			// If an option that shouldn't be selected is currently selected, unselect it.
			if(InList(monthsToAppearSelected, value) == -1) {
				$('#' + value).parent().removeClass('active');
			}
		});
	}
}

function setAllQtrActive() {
	var allParentDiv = $('#qtr-all').parent();
	if(!allParentDiv.hasClass('active'))
		allParentDiv.addClass('active');
	updateMonths('qtr-all', true);
	uncheckNonAllQTRButtons();
}

/*
 * Handles the below cases for the month button group
 * - Select a quarter box if all of it's respective months are active.
 */
function preserveMonthValidity() {
	var selectedMonths = getSelectedMonths();

	if(selectedMonths.length == 0) {
		setAllQtrActive();
		return;
	}

	$.each(['qtr1', 'qtr2', 'qtr3', 'qtr4'], function(index, quarter) {
		var allMonthsInQtrActive = true;

		for(var i=0;i<qtrIDToMonthsIDMap[quarter].length;i++) {
			var month = qtrIDToMonthsIDMap[quarter][i];

			if(InList(selectedMonths, month) == -1) {
				allMonthsInQtrActive = false;
				break;
			}
		}

		var labelDiv = $('#' + quarter).parent();
		if(!labelDiv.hasClass('active') && allMonthsInQtrActive) {
			labelDiv.addClass('active');
		}
			
	})
}

/*
 * Updates the respective Qtr button whenever a month is clicked. Handles the below cases.
 * - If ALL currently appears selected and the current month is deselected, then we should clear
 *	the ALL selection. Similar this applies for other QTR boxes as well.
 * - When all the months are deselected, 'ALL' checkbox should be enabled.
 * - 
 */
function updateQuarter(checkboxID, checkboxState) {
	var monthID = monthsToIDMap[checkboxID];
	var qtrToCheck;
	if(monthID <= 3) {
		qtrToCheck = 'qtr1';
	}
	else if(monthID >= 4 && monthID <= 6) {
		qtrToCheck = 'qtr2';
	}
	else if(monthID >= 7 && monthID <= 9) {
		qtrToCheck = 'qtr3';
	}
	else if(monthID >= 10 && monthID <= 12) {
		qtrToCheck = 'qtr4';
	}

	if(qtrToCheck) {
		var qtrParentDiv = $('#' +  qtrToCheck).parent();
		var allQtrParentDiv = $('#qtr-all').parent();
		if(!qtrParentDiv)
			return;

		if(checkboxState) {
			// If the month's respective QTR isn't active and all other months
			// in the respective qtr are active, then set the QTR active.
			// Note: The above should be done only if the number of months active isn't 12.
			// Otherwise, we should set ALL active.
			if(!qtrParentDiv.hasClass('active')) {
				var selectedMonths = getSelectedMonths();

				if(selectedMonths.length == 12) {
					allQtrParentDiv.addClass('active');
					uncheckNonAllQTRButtons();
				}
				else {
					var allMonthsInQtrActive = true;
					for(var i=0;i<qtrIDToMonthsIDMap[qtrToCheck].length;i++) {
						var month = qtrIDToMonthsIDMap[qtrToCheck][i];
						if(month == checkboxID)
							continue;

						if(InList(selectedMonths, month) == -1) {
							allMonthsInQtrActive = false;
							break;
						}
					}

					if(allMonthsInQtrActive) {
						qtrParentDiv.addClass('active');
					}
				}

			}
		}
		else {
			// If qtr is active but it's respective month isn't, set the qtr inactive
			if(qtrParentDiv.hasClass('active')) {
				qtrParentDiv.removeClass('active');
			}
			// If ALL QTR is active but at least one month isn't, set ALL to inactive
			if(allQtrParentDiv.hasClass('active')) {
				allQtrParentDiv.removeClass('active');
			}
		}
	}
}

// Handles the case where all the qtr-x buttons are active.
// Instead of showing all qtr-x buttons as active, we show 'ALL' as active.
function uncheckNonAllQTRButtons() {
	$.each(['qtr1', 'qtr2', 'qtr3', 'qtr4'], function(index, quarter) {
		var labelDiv = $('#' + quarter).parent();
		if(labelDiv.hasClass('active'))
			labelDiv.removeClass('active');
	})
}

function updateMonths(checkboxID, checkboxState) {
	var qtrsToCheck;
	if(checkboxID === 'qtr-all')
		qtrsToCheck = ['qtr1', 'qtr2', 'qtr3', 'qtr4'];
	else
		qtrsToCheck = [ checkboxID ];

	$.each(qtrsToCheck, function(quarterIndex, quarter) {
		// For each month within the quarter to check, find the respective parent
		// and set/remove its active class based on the given checkboxState
		$.each(qtrIDToMonthsIDMap[quarter], function(monthIndex, month) {
			var labelDiv = $('#' + month).parent();
			// If there isn't a parent, exit.
			if(!labelDiv)
				return;
			if(labelDiv.hasClass('active') && !checkboxState) {
				labelDiv.removeClass('active');
			}
			else if(!labelDiv.hasClass('active') && checkboxState) {
				labelDiv.addClass('active');
			}
		});
	});
}