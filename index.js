var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

server.listen(2000, function () {
  console.log('Server listening on port 2000');
});

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket) {
	console.log('new connection with socket id: ' + socket.id);
	
	socket.on('disconnect', function() {		
		console.log('socket id: ' + socket.id + ' has disconnected');
	});
});