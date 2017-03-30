var peer = new Peer({key: 'jmikr170cgv0wwmi'});

peer.on('open', function(id) {
	console.log('My peer ID is: ' + id);

});

var conn = peer.connect('TOO');

// Receive messages
conn.on('data', function(data) {
	if("welcome" == data.message) {
	    $("#profile").addClass('hidden');
		$('#pokercards').removeClass("hidden");
	}
});

conn.on('open', function(conn) {
    $("#connecting").addClass('hidden');
	$('#profile').removeClass("hidden");
})

function sendPoints(score, el) {
	conn.send({
		score: score
	});
    $('.card').removeClass("selected");
    $(el).addClass("selected");
}
var avatar_id = 1;
function selectAvatar(id) {
    $(".avatar").removeClass("selected");
    $(".avatar_"+id).addClass("selected");
	avatar_id = id;
}

function register() {
	console.log("try register");
	conn.send({
		action: "register",
		name: $("#name").val(),
		avatar: avatar_id
	})
}
