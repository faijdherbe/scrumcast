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
    console.log(message);
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
		console.log(story);
		var entry = '<div class="col s12 card white hoverable" onClick="javascript:sendStory(fetchStory(' + idx + '));" >' +
		    '<div class="card-title" >' +
		    story.name + 
		 
		    '</div> ' +
		    '<div class="card-content">' +
		    '<p>' + converter.makeHtml(story.description) + '</p>' +
		    '</div>' +
		    
		    '</div> ';

		$('#stories').append(entry);
		
//		      + story.name + "</a></li>"); 
	    });
//	    sendStory({});
	})
	.error(function() {
	    sendStory({ title: "nok" });
	});
    
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

$('#main_card').hide();
