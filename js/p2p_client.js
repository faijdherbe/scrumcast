var peer = new Peer({key: 'jmikr170cgv0wwmi'});

peer.on('open', function(id) {
	console.log('My peer ID is: ' + id);
});

var conn = peer.connect('TOO');

// Receive messages
conn.on('data', function(data) {
	console.log('Received', data);
});

function sendPoints(score) {
	conn.send({
		score: score
	});
}
