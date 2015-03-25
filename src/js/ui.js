/* global VolumeDetails, MashupPlatform, JSTACK  */

var UI = (function () {
	'use strict';


	/*****************************************************************
	****************************COSNTANTS*****************************
	*****************************************************************/

	var NONUSABLEWIDTH = 158;

	// Colors
	var RED = 'rgb(217, 83, 79)';
	var GREEN = 'green';
	var AMBAR = 'rgb(239, 163, 0)';
	var GRAY = 'gray';


	var statuses = {

		// GREEN
		'available': {
			'class': 'glyphicon glyphicon-ok  fa-inverse',
			'color': GREEN
		},
		'in-use': {
			'class': 'glyphicon glyphicon-ok  fa-inverse',
			'color': GREEN
		},

		// AMBAR
		'creating': {
			'class': 'fa fa-spinner fa-pulse  fa-inverse',
			'color': AMBAR
		},
		'attaching': {
			'class': 'fa fa-repeat fa-spin  fa-inverse',
			'color': AMBAR
		},

		// RED
		'error': {
			'class': 'fa fa-trash  fa-inverse',
			'color': RED
		},
		'deleting': {
			'class': 'fa fa-trash fa-inverse',
			'color': RED,
			'animation': 'working-animation'
		},
		'error_deleting': {
			'class': 'fa fa-arrows-alt  fa-inverse',
			'color': RED
		}
	};


	/*****************************************************************
	****************************VARIABLES*****************************
	*****************************************************************/

	var getVolumeDetailsSuccess, receiveVolumeId, onError, initEvents,
		checkVolumeDetails, getDisplayableAddresses, refreshSuccess,
		setNameMaxWidth;

	var delay, prevRefresh, error, deleting;


	/*****************************************************************
	***************************CONSTRUCTOR****************************
	*****************************************************************/  

	function UI () {

		delay = 5000;
		prevRefresh = false;
		error = false;

		initEvents.call(this);
		this.buildDefaultView();
	}


	/*****************************************************************
	*****************************PUBLIC*******************************
	*****************************************************************/

	UI.prototype = {

		buildDetailView: function buildDetailView (volumeData) {

			var statusTooltip = 'Status: ' + volumeData.status;
			var displayableSize = volumeData.size + ' GB';

			// Adjust refresh delay
			delay = (volumeData.status !== null && volumeData.status !== 'available' && volumeData.status !== 'in-use') ? 1000 : 5000;

			// Hide other views
			$('#error-view').addClass('hide');
			$('#default-view').addClass('hide');
			$('body').removeClass('stripes angled-135');

			// Fields
			$('#volume-name').text(volumeData.display_name);
			$('#volume-name').attr('title', volumeData.display_name);
			$('#volume-id > span').text(volumeData.id);
			$('#volume-availability-zone > span').text(volumeData.availability_zone);
			$('#volume-size > span').text(displayableSize);
			$('#volume-created > span').text(volumeData.created_at);
			$('#volume-description > span').text(volumeData.display_description);
			
			// Status
			$('#volume-status').removeClass('working-animation');
			$('#volume-status > div > i').removeClass();

			$('#volume-status > div > i').addClass(statuses[volumeData.status].class);
			$('#volume-status').css('background-color', statuses[volumeData.status].color);

			if (volumeData.status === 'deleting') {
				$('#volume-status > div > i').addClass(statuses.deleting.class);
				$('#volume-status').css('background-color', statuses.deleting.color);
				$('#volume-status').addClass(statuses.deleting.animation);
			}
			else {
				$('#volume-status > div > i').addClass(statuses[volumeData.status].class);
				$('#volume-status').css('background-color', statuses[volumeData.status].color);
			}

			// Set name max-width
			setNameMaxWidth(NONUSABLEWIDTH);

			// Fix tooltips
			$('#volume-status').attr('title', statusTooltip);
			$('#volume-status').attr('data-original-title', $('#volume-status').attr('title'));
			$('#volume-status').attr('title', '');

			$('#volume-name').attr('data-original-title', $('#volume-name').attr('title'));
			$('#volume-name').attr('title', '');

			// Initialize tooltips
			$('[data-toggle="tooltip"]').tooltip();

			// Build
			$('#detail-view').removeClass('hide');
		},

		buildDefaultView: function buildDefaultView () {

			// Hide other views
			$('#error-view').addClass('hide');
			$('#detail-view').addClass('hide');
			$('body').addClass('stripes angled-135');

			// Build
			$('#default-view').removeClass('hide');
		},

		deleteVolume: function deleteVolume () {
		
			if (!checkVolumeDetails.call(this)) {
				MashupPlatform.widget.log('Error: No volume received yet.');
				return;
			}

			this.volumeDetails.deleteVolume(undefined, onError.bind(this));
		},

		attachVolume: function attachVolume (instanceId) {
		
			if (!checkVolumeDetails.call(this)) {
				MashupPlatform.widget.log('Error: No volume received yet.');
				return;
			}

			this.volumeDetails.attachVolume(instanceId, null, onError.bind(this));
		},

		detachVolume: function detachVolume (instanceId) {
		
			if (!checkVolumeDetails.call(this)) {
				MashupPlatform.widget.log('Error: No volume received yet.');
				return;
			}

			this.volumeDetails.detachVolume(instanceId, null, onError.bind(this));
		},

		createSnapshot: function createSnapshot (name, description) {
		
			if (!checkVolumeDetails.call(this)) {
				MashupPlatform.widget.log('Error: No volume received yet.');
				return;
			}

			this.volumeDetails.createSnapshot(name, description, null, onError.bind(this));
		},

		deleteSnapshot: function deleteSnapshot (snapshotId) {
		
			if (!checkVolumeDetails.call(this)) {
				MashupPlatform.widget.log('Error: No volume received yet.');
				return;
			}

			this.volumeDetails.deleteSnapshot(snapshotId, null, onError.bind(this));
		},

		getSnapshotList: function getSnapshotList () {
		
			if (!checkVolumeDetails.call(this)) {
				MashupPlatform.widget.log('Error: No volume received yet.');
				return;
			}

			this.volumeDetails.getSnapshotList(null, onError.bind(this));
		},

		refresh: function refresh () {

			if (!checkVolumeDetails.call(this)) {
				MashupPlatform.widget.log('Error: No volume received yet.');
				return;
			}

			this.volumeDetails.getVolumeDetails(refreshSuccess.bind(this), onError.bind(this));
		},

		buildErrorView: function buildErrorView (errorResponse) {

			// Hide other views
			$('#default-view').addClass('hide');
			$('#detail-view').addClass('hide');
			$('body').addClass('stripes angled-135');

			// Build
			if (errorResponse.message) {
				$('#error-view').text(errorResponse.message);
			}
			else {
				$('#error-view').text(errorResponse);
			}
			
			$('#error-view').removeClass('hide');
		}
	};


	/*****************************************************************
	***************************PRIVATE********************************
	*****************************************************************/

	checkVolumeDetails = function checkVolumeDetails () {
		
		if (!this.volumeDetails) {
			return false;
		}

		return true;
	};

	setNameMaxWidth = function setNameMaxWidth (nonUsableWidth) {

		var bodyWidth = $('body').attr('width');

		if (bodyWidth >= 360) {
			$('#volume-name').css('max-width', bodyWidth - nonUsableWidth);
		}
		else {
			$('#volume-name').css('max-width', 360 - nonUsableWidth);
		}
	};

    initEvents = function initEvents () {

    	// Register callback for input endpoint
		MashupPlatform.wiring.registerCallback('volume_id', receiveVolumeId.bind(this));

		// Register resize callback
		MashupPlatform.widget.context.registerCallback(function (newValues) {
			if ('heightInPixels' in newValues || 'widthInPixels' in newValues) {

				// Set body size
				$('body').attr('height', newValues.heightInPixels);
				$('body').attr('width', newValues.widthInPixels);

				// Set name max-width
				setNameMaxWidth(NONUSABLEWIDTH);

			}
		});

		// Init click events
		$('#refresh-button').click(function () {
			$('#refresh-button > i').addClass('fa-spin');
			this.refresh.call(this);
		}.bind(this));
		$('#volume-terminate').click(function () {
			this.deleteVolume.call(this);
		}.bind(this));
		$('#volume-image > span').click(function () {

			var id = $(this).text();
			var data = {
				id: id,
				access: JSTACK.Keystone.params.access
			};

			MashupPlatform.wiring.pushEvent('image_id', JSON.stringify(data));
		});			

	};


	/*****************************************************************
	***************************HANDLERS*******************************
	*****************************************************************/

	getVolumeDetailsSuccess = function getVolumeDetailsSuccess (volumeData) {
		
		// Keep refreshing if no errors
		if (!error) {
			this.buildDetailView(volumeData.volume);
			
			setTimeout(function () {
				this.volumeDetails.getVolumeDetails(getVolumeDetailsSuccess.bind(this), onError.bind(this));
			}.bind(this), delay);
		}
		else {
			prevRefresh = false;
		}
	};

	refreshSuccess = function refreshSuccess (volumeData) {
		// Stop spin animation
		$('#refresh-button > i').removeClass('fa-spin');

		this.buildDetailView(volumeData.volume);
	};

	onError = function onError (errorResponse) {

		// Build default view if flag deleting is true and error is 404
		if (errorResponse.message === '404 Error') {
			this.buildDefaultView();
		}
		else {
			error = true;
			this.buildErrorView(errorResponse);
			MashupPlatform.widget.log('Error: ' + JSON.stringify(errorResponse));
		}
		
	};

	receiveVolumeId = function receiveVolumeId (wiringData) {
		wiringData = JSON.parse(wiringData);

		JSTACK.Keystone.params.access = wiringData.access;
		JSTACK.Keystone.params.token = wiringData.access.token.id;
		JSTACK.Keystone.params.currentstate = 2;

		this.volumeDetails = new VolumeDetails(wiringData.id);
		error = false;

		if (!prevRefresh) {
			prevRefresh = true;
			this.volumeDetails.getVolumeDetails(getVolumeDetailsSuccess.bind(this), onError.bind(this));	
		}
		else {
			this.volumeDetails.getVolumeDetails(refreshSuccess.bind(this), onError.bind(this));
		}
		
	};


	return UI;
})();