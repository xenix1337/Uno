var socket = io();

socket.emit('hello', {seat:0});
socket.on('playerID', function(data) {
    players[0].id = data.playerID;
});

socket.on('newPlayer', function(data) {
    var newPlayer = new Player(data.seat);
    newPlayer.id = data.playerID;
    for(var i = 0; i < data.cards; i++) {
        newPlayer.deck.addCard(-1);
    }
    players.push(newPlayer);
});

socket.on('delPlayer', function(data) {
    players.splice(players.indexOf(players.find(function(value) {
        return (value.playerID == data.playerID);
    })), 1);
});

socket.on('cardOnPile', function(data) {
    cardPile.putCard(new PlayerCard(data.id));
    players.find(function(value) {
        return (value.playerID == data.playerID);
    }).deck.cards.pop();
});