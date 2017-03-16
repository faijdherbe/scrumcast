
function startCanvas(canvasID, peerJsKey) {

var peer = new Peer('TOO',{key: peerJsKey});

peer.on('open', function(id) {
  console.log('My peer ID is: ' + id);
});

var cards = [];

peer.on('connection', function(conn) {
	console.log('incoming connection from ' + conn.peer);

	var card = new Card(conn);

	cards.push(card);

	conn.on('data', function(d) {
		card.onData(d);
	});

	conn.on('close', function(conn) {
		console.log('disconnect');
		var index = cards.indexOf(card);
		if( index > -1 ) {
			cards.splice(index, 1);
		}
		redraw();
	});

	redraw();
});

function trysend() {
	connections.forEach(function(c) {
		console.log("send message to peer: " + c.peer);
		c.send("hallo?");
	});
}

var c = document.getElementById(canvasID);
var ctx = c.getContext("2d");


function redraw() {
	ctx.canvas.width  = window.innerWidth;
	ctx.canvas.height = window.innerHeight;

	var show = true;

	cards.forEach(function(c) {
		if (undefined == c.score) {
			show = false;
		}
	});

	for (i = 0; i < cards.length; i++) {
		cards[i].draw(ctx, (ctx.canvas.width/cards.length) * i, (ctx.canvas.width/cards.length), show);
	}
}

function Card(connection) {
	this.connection = connection;

}

Card.prototype.draw = function(ctx, x, width, show) {
	ctx.font="50px Georgia";
	ctx.fillStyle = "black";
	ctx.textAlign="center";
	var w = 100;
	var offset = 0;


	if(show) {
		offset = -50;

		ctx.fillText(
			undefined != this.score ? this.score : "-",
			width*0.5 + x,
			ctx.canvas.height-40
		);

	}

	var y = ctx.canvas.height - 40 + offset;

	ctx.beginPath();
	ctx.rect(
		(width-w)*0.5 + x,
		y,
		w,
		5
	);
	ctx.fill();

};

Card.prototype.onData = function(data) {
	this.score = data.score;
	redraw();
};
}
