
var cards = [];
var c = undefined;

function startCanvas(canvasID, peerJsKey) {

	var peer = new Peer('TOO', {
		key: peerJsKey
	});

	peer.on('open', function(id) {
		console.log('My peer ID is: ' + id);
	});

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
			if (index > -1) {
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

	c = document.getElementById(canvasID);
	var ctx = c.getContext("2d");

	ctx.canvas.width = window.innerWidth;
	ctx.canvas.height = window.innerHeight;



	function Card(connection) {
		this.connection = connection;
		this.img = new Image();
		this.name = "";
		this.img.onload = function() { redraw(); };
		this.img.src = 'img/avatar/1.png';
	}

	Card.prototype.draw = function(ctx, x, width, show) {
		ctx.font = "50px Georgia";
		ctx.fillStyle = "black";
		ctx.textAlign = "center";
		var w = 100;
		var offset = 0;


		if (show) {
			offset = -50;

			ctx.fillText(
				undefined != this.score ? this.score : "-",
				width * 0.5 + x,
				ctx.canvas.height - 40
			);

		}

		if(undefined != this.score) {
			ctx.drawImage(
    			this.img, 
    			(width - w) * 0.5 + x, 
    			ctx.canvas.height - 40 + offset - w, 
    			w,
    			w
    		);
		}

		var y = ctx.canvas.height - 40 + offset;

		
		ctx.font = "30px Georgia";
		ctx.fillText(
				this.name,
				width * 0.5 + x,
				ctx.canvas.height - 45 + offset - ( undefined != this.score ? w : 0)  
			);

		ctx.beginPath();
		ctx.rect(
			(width - w) * 0.5 + x,
			y,
			w,
			3
		);
		ctx.fill();

	};

	Card.prototype.onData = function(data) {
		console.log(data);
		if ("register" == data.action) {
			this.img.src = "img/avatar/" + data.avatar + ".png";
			this.name = data.name;
			this.connection.send({
				message: "welcome"
			});
		}
		else {
			this.score = data.score;
		}
		redraw();
	};
	
	return ctx;
	
}

function redraw() {
	ctx.clearRect(0, 0, c.width, c.height);

	var show = true;

	cards.forEach(function(c) {
		if (undefined == c.score) {
			show = false;
		}
	});

	for (i = 0; i < cards.length; i++) {
		cards[i].draw(ctx, (ctx.canvas.width / cards.length) * i, (ctx.canvas.width / cards.length), show);
	}
}

function resetAll() {
	cards.forEach(function(c) {
		c.score = undefined;
	});
	redraw();
	
}


ctx = startCanvas("canvas", "jmikr170cgv0wwmi");