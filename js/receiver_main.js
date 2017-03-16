window.onload = function() {
    cast.receiver.logger.setLevelValue(0);
    window.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    console.log('Starting Receiver Manager');

    // handler for the 'ready' event
    castReceiverManager.onReady = function(event) {
        console.log('Received Ready event: ' + JSON.stringify(event.data));
        window.castReceiverManager.setApplicationState("Application status is ready...");
    };

    // handler for 'senderconnected' event
    castReceiverManager.onSenderConnected = function(event) {
        console.log('Received Sender Connected event: ' + event.data);
        console.log(window.castReceiverManager.getSender(event.data).userAgent);
    };

    // handler for 'senderdisconnected' event
    castReceiverManager.onSenderDisconnected = function(event) {
        console.log('Received Sender Disconnected event: ' + event.data);
        if (window.castReceiverManager.getSenders().length == 0) {
			window.close();
		}
    };

    // handler for 'systemvolumechanged' event
    castReceiverManager.onSystemVolumeChanged = function(event) {
        console.log('Received System Volume Changed event: ' + event.data['level'] + ' ' +
					event.data['muted']);
    };

    // create a CastMessageBus to handle messages for a custom namespace
    window.messageBus =
        window.castReceiverManager.getCastMessageBus(
            'urn:x-cast:net.faijdherbe.pokercast');

    // handler for the CastMessageBus message event
    window.messageBus.onMessage = function(event) {
        //console.log('Message [' + event.senderId + ']: ' + event.data);
        // display the message from the sender
		showStory(JSON.parse(event.data));
		//        displayText(event.data);
        // inform all senders on the CastMessageBus of the incoming message event
        // sender message listener will be invoked
        window.messageBus.send(event.senderId, event.data);
    }

    // initialize the CastReceiverManager with an application status message
    window.castReceiverManager.start({statusText: "Application is starting"});
    console.log('Receiver Manager started');
};

// utility function to display the text message in the input field
function displayText(text) {
    //console.log(text);
    document.getElementById("message").innerHTML=text;
    window.castReceiverManager.setApplicationState(text);
};

var lastStoryId = -1;
function showStory(data) {
    var defaults = {
		name: "-",
		estimate: "-",
		labels: ["a", "b"],
		description: "-",
		progress: ""
    };

    data = $.extend({}, defaults, data);

	$('body').show();

    var converter = new showdown.Converter();
	converter.setFlavor('github');

	var	htmlTitle = converter.makeHtml(data.name),
		htmlDescription = converter.makeHtml(data.description);

    var labels = jQuery.map( data.labels, function( l ) {
		return l.name;
    }).join(', ');

	var estimate = data.estimate;

	if("-1" == data.estimate || "-" == data.estimate) {
		estimate = "?";
	}

    $('#title').html(htmlTitle);
    $('#estimate').text(estimate);
    $('#labels').text(labels);
    $('#description').html(htmlDescription);
	$('#story_type').text(data.story_type);
	$('#story_id').text('#' + data.id);
	$('#progress').text(data.progress);

    if(lastStoryId != data.id){
		start = new Date;
    }
    lastStoryId = data.id;
    console.log(data.id + "::" + data.estimate);

	$('#statusbar').removeClass('chore');
	$('#statusbar').removeClass('release');
	$('#statusbar').removeClass('bug');
	$('#statusbar').removeClass('feature');
	$('#statusbar').addClass(data.story_type);
	resetAll();
}

function pretty_time_string(num) {
    return ( num < 10 ? "0" : "" ) + num;
}

var start = null;

setInterval(function() {
    if (null == start) {
		return;
    }
    var total_seconds = (new Date - start) / 1000;

    var hours = Math.floor(total_seconds / 3600);
    total_seconds = total_seconds % 3600;

    var minutes = Math.floor(total_seconds / 60);
    total_seconds = total_seconds % 60;

    var seconds = Math.floor(total_seconds);

    hours = pretty_time_string(hours);
    minutes = pretty_time_string(minutes);
    seconds = pretty_time_string(seconds);

    var currentTimeString = hours + ":" + minutes + ":" + seconds;

    $('#timer').text(currentTimeString);
}, 1000);
