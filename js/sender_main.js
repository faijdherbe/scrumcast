var namespace = 'urn:x-cast:net.faijdherbe.pokercast';
var session = null;

/**
 * Call initialization for Cast
 */
if (!chrome.cast || !chrome.cast.isAvailable) {
    setTimeout(initializeCastApi, 1000);
}

/**
 * initialization
 */
function initializeCastApi() {
    var sessionRequest = new chrome.cast.SessionRequest(applicationID);
    var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
					      sessionListener,
					      receiverListener);

    chrome.cast.initialize(apiConfig, onInitSuccess, onError);
};

/**
 * initialization success callback
 */
function onInitSuccess() {
    appendMessage("onInitSuccess");
}

/**
 * initialization error callback
 */
function onError(message) {
    appendMessage("onError: "+JSON.stringify(message));
}

/**
 * generic success callback
 */
function onSuccess(message) {
    appendMessage("onSuccess: "+message);
}

/**
 * callback on success for stopping app
 */
function onStopAppSuccess() {
    appendMessage('onStopAppSuccess');
}

/**
 * session listener during initialization
 */
function sessionListener(e) {
    appendMessage('New session ID:' + e.sessionId);
    session = e;
    session.addUpdateListener(sessionUpdateListener);  
    session.addMessageListener(namespace, receiverMessage);
}

/**
 * listener for session updates
 */
function sessionUpdateListener(isAlive) {
    var message = isAlive ? 'Session Updated' : 'Session Removed';
    message += ': ' + session.sessionId;
    appendMessage(message);
    if (!isAlive) {
	session = null;
    }
};

/**
 * utility function to log messages from the receiver
 * @param {string} namespace The namespace of the message
 * @param {string} message A message string
 */
function receiverMessage(namespace, message) {
    appendMessage("receiverMessage: "+namespace+", "+message);
};

/**
 * receiver listener during initialization
 */
function receiverListener(e) {
    if( e === 'available' ) {
	appendMessage("receiver found");
    }
    else {
	appendMessage("receiver list empty");
    }
}

/**
 * stop app/session
 */
function stopApp() {
    session.stop(onStopAppSuccess, onError);
}

/**
 * send a message to the receiver using the custom namespace
 * receiver CastMessageBus message handler will be invoked
 * @param {string} message A message string
 */
function sendStory(story) {
    if (session!=null) {
	
	session.sendMessage(namespace, story, onSuccess.bind(this, "Message sent: " + story), onError);
    }
    else {
	chrome.cast.requestSession(function(e) {
            session = e;
            session.sendMessage(namespace, story, onSuccess.bind(this, "Message sent: " + story), onError);
	}, onError);
    }
}

/**
 * append message to debug message window
 * @param {string} message A message string
 */
function appendMessage(message) {
    //console.log(message);
    //var dw = document.getElementById("debugmessage");
    //dw.innerHTML += '\n' + JSON.stringify(message);
};

/**
 * utility function to handle text typed in by user in the input field
 */
function update() {
    //
    sendStory({
	title: "dingen"
    });
}

/**
 * handler for the transcribed text from the speech input
 * @param {string} words A transcibed speech string
 */
function transcribe(words) {
    sendMessage(words);
}

var stories = [];

function fetchStory(idx) {
    return stories[idx];
}

function searchPivotal() {
    var projectID = $('#project').val();
    
    jQuery.ajax({
	url: "https://www.pivotaltracker.com/services/v5/projects/" + projectID + "/search?query=" + encodeURIComponent($('#search').val()),
	headers: {
	    "X-TrackerToken": pivotalToken
	}
    })
	.success(function(data){
	    stories = data.stories.stories;
	    
	    $('#stories').html("");
	    var converter = new showdown.Converter();
	    
	    jQuery.each(stories, function(idx, story) {

		var entry = '<a href="javascript:selectStory(' + idx + '); " class="collection-item story_' + idx  + '">' + story.name  + '</a>';

		$('#stories').append(entry);		
	    });
	    currentStoryIndex = -1;
	    
	})
	.error(function() {
	    sendStory({ title: "nok" });
	});
    
}

    $('.story_details').hide();
var currentStoryIndex = -1;
function selectStory(idx) {
    if(-1 != currentStoryIndex) {
	// deselect
	$('.story_' + currentStoryIndex).removeClass('active'); 
    }
    $('.story_details').show();
    
    $('.story_details .card').pushpin({ top: $('.story_details').offset().top });

    $('.story_' + idx).addClass('active'); 
    currentStoryIndex = idx;

    var story = stories[idx];
    $("#story_name").text(story.name);
    //$("#story_estimate").text(story.estimate);
    if(story.estimate > 0) {
	$('#story_estimate option[value="' + story.estimate + '"]').prop('selected', true);
    } else {
	$('#story_estimate option:eq(0)').prop('selected', true);
    }	
    $('select').material_select();
    
    $("#story_description").text(story.description);
    $("#story_labels").text(story.labels);

    sendStory(story);
}

function login(form) {
    var token = $('#pivotaltoken').val();
    
    var url = "https://www.pivotaltracker.com/services/v5/me";

    jQuery.ajax({
	url: url,
	headers: {
	    "X-TrackerToken": token
	}
    }).success(function(data) {
	//api_token
	pivotalToken = token;
	$('#projects-list').html(
	    '<select id="project">' + jQuery.map(data.projects, function(p) {
		return '<option value="'+ p.project_id +'">' + p.project_name + '</option>';
	    }).join(' ') + '</select>'
	);
	$('#login_card').hide();
	$('#main_card').show();
	$('select').material_select();
    }).error(function(data) {
	console.log('error');
    });
}

function updateEstimate(selectInput) {
    stories[currentStoryIndex].estimate = $("#story_estimate").val();
    sendStory(stories[currentStoryIndex]);
    console.log($("#story_estimate").val() + "::::" + stories[currentStoryIndex].estimate );
}


$('#main_card').hide();

