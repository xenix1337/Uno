var socket = io();

socket.emit('hello', {seat:0});
socket.on('playerID', function(data) {
    console.log(data.playerID);
});