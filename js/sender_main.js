var namespace = 'urn:x-cast:net.faijdherbe.pokercast';
var session = null;
$.cookie.json = true;

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

	var progress = "";

	if(stories.length > 0 && -1 != currentStoryIndex) {
		progress = (currentStoryIndex+1) + "/"+ stories.length;
	}

	var data = $.extend({}, {
		progress: progress
	}, story);

    if (session!=null) {

		session.sendMessage(namespace, data, onSuccess.bind(this, "Message sent: " + data), onError);
    }
    else {


		chrome.cast.requestSession(function(e) {
            session = e;
            session.sendMessage(namespace, data, onSuccess.bind(this, "Message sent: " + data), onError);
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

	$.cookie('last-project', projectID);

	var pivoToken = getPivotalToken();
	if(false == pivoToken) {
		return;
	}

	var search = $('#search').val();
	$.cookie('last-search', search);

    jQuery.ajax({
		url: "https://www.pivotaltracker.com/services/v5/projects/" + projectID + "/search?query=" + encodeURIComponent(search) + '&fields=:default,stories(stories(:default,comments(:default,person)))',
		headers: {
			"X-TrackerToken": pivoToken
		}
    })
		.success(function(data){
			stories = data.stories.stories.reverse();
			loadStories(stories);
		})
		.error(function() {
			//sendStory({ title: "nok" });
		});

}


function showPreviousSprint() {
    var projectID = $('#project').val();

	$.cookie('last-project', projectID);

	var pivoToken = getPivotalToken();
	if(false == pivoToken) {
		return;
	}
	var currentSprintQuery = "/iterations?limit=1&offset=-1&scope=done&fields=:default,stories(:default,comments(:default,person))";

    jQuery.ajax({
		url: "https://www.pivotaltracker.com/services/v5/projects/" + projectID + currentSprintQuery,
		headers: {
			"X-TrackerToken": pivoToken
		}
    })
		.success(function(data){
			stories = data[0].stories;
			console.log(data);
			loadStories(stories);
		})
		.error(function() {
			//sendStory({ title: "nok" });
		});
}

function showCurrentSprint() {
    var projectID = $('#project').val();

	$.cookie('last-project', projectID);

	var pivoToken = getPivotalToken();
	if(false == pivoToken) {
		return;
	}
	var currentSprintQuery = "/iterations?limit=1&offset=0&scope=current&fields=:default,stories(:default,comments(:default,person))";

    jQuery.ajax({
		url: "https://www.pivotaltracker.com/services/v5/projects/" + projectID + currentSprintQuery,
		headers: {
			"X-TrackerToken": pivoToken
		}
    })
		.success(function(data){
			stories = data[0].stories;
			console.log(stories);
			loadStories(stories);
		})
		.error(function() {
			//sendStory({ title: "nok" });
		});
}

function loadStories(stories) {


			$('#stories').html("");

			jQuery.each(stories, function(idx, story) {
				var entry = '<div class="col l12 m12 s12 story_'+idx+'" id="story_' +idx+'">' + generateStoryContent(idx, story) + '</div>';
//				var entry = '<a href="javascript:selectStory(' + idx + '); " class="collection-item story_' + idx  + '">' + story.name  + '</a>';

				$('#stories').append(entry);			});

			 $('.modal-trigger').leanModal();
			currentStoryIndex = -1;

}

function updateStoryCard(idx, story) {
	$('#story_' + idx).html(generateStoryContent(idx, story));

}
function generateStoryContent(idx, story) {

	var entry = '<div class="card"><div class="card-content">';
	entry += '<div class="card-title">' + story.name + '</div>';
	entry += story.labels.map(function(l){
		return l.name;
	}).join(', ');
	entry += '</div><div class="card-action">';

	entry += '<a href="javascript:selectStory(' + idx + ');">open</a>';

	entry += '<a href="javascript:markStory('+idx+')">mark</a>';
	entry += '<span class="right">' + [story.story_type, story.current_state].join(', ') + '</span>';
	entry += '</div>';

	return entry;
}

//$('.story_details').hide();
var currentStoryIndex = -1;
function selectStory(idx) {
    if(-1 != currentStoryIndex) {
		// deselect
		$('.story_' + currentStoryIndex).removeClass('active');
    }
	markStory(idx, false);
//    $('.story_details').show();

//    $('.story_details .card').pushpin({ top: $('.story_details').offset().top });

    $('.story_' + idx).addClass('active');
    currentStoryIndex = idx;

    var story = stories[idx];
    $("#story_name").text(story.name);
    //$("#story_estimate").text(story.estimate);


	if(story.estimate >= 0) {
		$('#story_estimate option[value="' + story.estimate + '"]').prop('selected', true);
	} else {
		$('#story_estimate option:eq(0)').prop('selected', true);
	}

	$('#story_type option[value="' + story.story_type + '"]').prop('selected', true);

	$('select').material_select();

	var desc = '';
	if(undefined != story.description) {


		desc = getConverter().makeHtml(story.description);
	}

    $("#story_description").html(desc);
	$("#story_kind").text(story.story_type);
	$("#story_state").text(story.current_state);
    $("#story_labels").html(story.labels.map(function(e) {
		return '<div class="chip">' + e.name + '</div>';
	}).join(' '));

    sendStory(story);

	$('.story-activity-container').html('');
//	$('.story-activity-button').show();

	loadActivity(idx);

	$('#story-modal').openModal();
}

function reloadStory(idx) {

    var projectID = $('#project').val();
	story = stories[idx];

	var pivoToken = getPivotalToken();
	if(false == pivoToken) {
		return;
	}

	jQuery.ajax({
		url: "https://www.pivotaltracker.com/services/v5/projects/" + projectID + "/stories/" + story.id + '?fields=:default,comments(:default,person)',
		headers: {
			"X-TrackerToken": pivoToken
		}
    }).success(function(data){
		stories[idx] = data;
		updateStoryCard(idx, data);
		selectStory(idx);

	}) .error(function() {
	});
}


function openInPivotal(storyId) {
	window.open('https://pivotaltracker.com/story/show/'+ fetchStory(storyId).id, '_blank');
}

function updateEstimate(selectInput) {

    var projectID = $('#project').val();

	var pivoToken = getPivotalToken();
	if(false == pivoToken) {
		return;
	}
	var idx = currentStoryIndex;


    stories[idx].estimate = $("#story_estimate").val();
	story = stories[idx];
    sendStory(story);


	var estimate = story.estimate;
	if(estimate == "-1") {
		estimate = "null";
	}


	jQuery.ajax({
		url: "https://www.pivotaltracker.com/services/v5/projects/" + projectID + "/stories/" + story.id,
		type: 'PUT',
		contentType: 'application/json',
		headers: {
			"X-TrackerToken": pivoToken
		},
		data: '{"estimate": ' + estimate + '}'
    }).success(function(data){
		stories[idx] = data;
		updateStoryCard(idx, data);
		selectStory(idx);

	}) .error(function() {
	});

    console.log($("#story_estimate").val() + "::::" + stories[currentStoryIndex].estimate );
}


function updateStoryType(selectInput) {

    var projectID = $('#project').val();

	var pivoToken = getPivotalToken();
	if(false == pivoToken) {
		return;
	}
	var idx = currentStoryIndex;


    stories[idx].story_type = $("#story_type").val();
	story = stories[idx];
    sendStory(story);


	jQuery.ajax({
		url: "https://www.pivotaltracker.com/services/v5/projects/" + projectID + "/stories/" + story.id,
		type: 'PUT',
		contentType: 'application/json',
		headers: {
			"X-TrackerToken": pivoToken
		},
		data: '{"story_type": "' + story.story_type + '"}'
    }).success(function(data){
		stories[idx] = data;
		updateStoryCard(idx, data);
		selectStory(idx);

	}) .error(function() {
	});

    console.log($("#story_estimate").val() + "::::" + stories[currentStoryIndex].estimate );
}


function getConverter() {
	var converter = new showdown.Converter({
		simplifiedAutoLink: true,
		strikethrough: true,
	});
	return converter;
}

function loadActivity(idx) {

    var projectID = $('#project').val();
	story = stories[idx];
	$('.story-activity-button').hide();

	if(undefined == story.comments) {

		return;
	}
/*
	var pivoToken = getPivotalToken();
	if(false == pivoToken) {
		return;
	}



	jQuery.ajax({
		url: "https://www.pivotaltracker.com/services/v5/projects/" + projectID + "/stories/" + story.id + '/comments?fields=person,text,created_at',
		headers: {
			"X-TrackerToken": pivoToken
		}
    }).success(function(data){
*/
	data = story.comments;
		$(".story-activity-container").html(
			'<div class="row">'
				+ jQuery.map(data, function(c) {
					var commentString = '';

					commentString +=   '<div class="card col l12 s12 m12">';
					commentString +=     '<div class="card-content">';

					commentString +=     '<span class="card-title">' + c.person.name + '</span>';
					commentString +=     '<div class="section"><p>' + getConverter().makeHtml(c.text) + '</p></div>';
					commentString +=  	 '<div class="section"><span class="right grey-text text-lighten-1"><i>' + c.created_at + '</i></span></div>';
					commentString +=     '</div>';
					commentString +=   '</div>';


					return commentString;
				}).join('')
				+ '</div>'
		);
/*
	}) .error(function() {
	});
*/
}

function getPivotalToken() {
	var token = $.cookie('pivotal-token');
	if(undefined == token) {
		document.location = 'index.html';
		return false;
	}
	return token;
}

function markStory(idx, toggle = true) {
	var elem = $('.story_' + idx + ' .card');
	var css = 'orange lighten-5';
	if(toggle) {
		elem.toggleClass(css);
	} else {
		elem.addClass(css);
	}
}

/// bootstrap
$(document).ready(function() {

	if(false == getPivotalToken()) {
		return;
	}
	$.cookie.json = true;

	var me = $.cookie('pivotal-me');

	$('#projects-list').html(
		'<select id="project">' + jQuery.map(me.projects, function(p) {
			return '<option value="'+ p.project_id +'">' + p.project_name + '</option>';
		}).join(' ') + '</select>'
	);

	if (undefined != (lastSearch = $.cookie('last-search'))) {
		$('#search').val(lastSearch);
	}
	if (undefined != (lastProject = $.cookie('last-project'))) {
		$('#projects-list option[value="' + lastProject + '"]').prop('selected', true);
	}

});
