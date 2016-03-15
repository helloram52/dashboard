var chartVisualization;
$(document).ready(function() {
	$.get("/getGraphJSON", function(jsonData) {
		$('.loadingbtn').css('display', 'none');
		// Set Years field using the json.

		// Initialize chart visualization
		chartVisualization = new Visualization();
		chartVisualization.init(jsonData, '#canvas-div');
	});

	// Handle Qtr/Year checkbox clicks
	// ALL checkbox and the rest of the buttons are mutually exclusive
	// i.e If a QTR-1 checkbox is selected, ALL shouldn't appear selected.
	// Note: Only ALL checkbox has id set.
	$('.btn-group .btn').on('click', function() {
		var self = $(this);
		var checkbox = self.find(':checkbox');
		// return if there isn't a checkbox within the btn-group.
		// Unlikely to happen.
		if(checkbox.length == 0)
			return;

		// Clear ALL checkbox only if the clicked checkbox doesn't have an id
		if (checkbox.attr('id') === undefined) {
			//alert('checkbox clicked');
			var allCheckbox = self.parent().find(":first")
			if(allCheckbox.hasClass("active")) {
				allCheckbox.removeClass("active");
			}
			return;
		}
		// If ALL is checked, uncheck other selections.
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
	});
});