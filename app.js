var express = require('express');
var app = express();
var http = require('http').Server(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

http.listen(8080, 'localhost');
console.log("Server started!");

class Lobby {
    constructor() {
        this.id = Math.random();
        this.players = [];
    }

    newPlayer(socket) {
        this.players.push(socket);

        socket.emit('gameInfo', {playerID:socket.id});
        console.log("Total player count: " + this.players.length);
    }

    onPlayerDisconnect(socket) {
        this.players.splice(this.players.indexOf(socket), 1);
    }
}

var lobby = new Lobby();

var io = require('socket.io')(http,{});
io.on('connection', function(socket) {
    console.log("New connection!");
    lobby.newPlayer(socket);

    socket.on('disconnect', function() {
        lobby.onPlayerDisconnect(socket);
    })
});