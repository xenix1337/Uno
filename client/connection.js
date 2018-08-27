var socket = io();

//On joining server, we get a packet with: our playerID, other players and our cards
socket.on('init', function(data) {
    players[0].id = data.playerID;
    moveIndicator.setPlayer(data.currentMove);

    if(data.chatHistory.length > 0) {
        var history = document.getElementById('chatHistory');
        data.chatHistory.forEach(function(value) {
            history.innerHTML += value;
            history.innerHTML += '<br>'
        })
        history.scrollTop = history.scrollHeight;
    }
    document.getElementById('host').style.display = 'none';
});

socket.on('host', function(data) {
    document.getElementById('host').style.display = 'block';
})

socket.on('alert', function(data) {
    alert(data.text);
})

function hostStart() {
    socket.emit('startRound');
}

socket.on('fullinfo', function(data) {
    if(data.you.seat > -1) isPlaying = true;
    else isPlaying = false;

    running = data.running;
    drawColorCat = false;

    cards = [];
    cardPile.cards = [];

    players = [];
    var myPlayer = new Player(data.you.seat, true);
    myPlayer.deck.own = true;
    players.push(myPlayer);

    data.players.forEach(function(value) {
        newPlayer(value);
    })
    if(isPlaying) {
        data.you.cards.forEach(function(value) {
            players[0].deck.addCard(value);
        })
        playerSeat = data.you.seat;
        players[0].id = data.you.playerID;
    }

    moveIndicator.setPlayer(data.currentMove);
    if(data.pile >= 0) cardPile.putCard(new PlayerCard(data.pile));

    
    if(!running) buttonsManager.hideButton('take');
})

function newPlayer(data) {
    var newPlayer = new Player(data.seat);
    newPlayer.id = data.playerID;
    for(var i = 0; i < data.cards; i++) {
        newPlayer.deck.addCard(-1);
    }
    players.push(newPlayer);
}

socket.on('leave', function(data) {
    var index = players.findIndex(function(value) {
        return (value.id == data.playerID);
    });

    if(index > 0) {
        players[index].deck.cards.forEach(function(value) {
            cards.splice(cards.findIndex(function(v) {
                return v == value;
            }), 1);
        })
        players.splice(index, 1);
    }
});

socket.on('cardOnPile', function(data) {
    cardPile.putCard(new PlayerCard(data.id));
    var player = players.find(function(value) {
        return (value.id == data.playerID);
    });
    cards.splice(cards.indexOf(player.deck.cards[0]), 1);
    player.deck.cards.shift();

    drawColorCat = false;
});

socket.on('setPlayer', function(data) {
    moveIndicator.setPlayer(data.id);
})

function sendCard(card) {
    socket.emit('sendCard', {id:card.id});
}

function takeCard() {
    buttonsManager.hideButton('take');
    socket.emit('takeCard');
}

socket.on('takeCard', function(data) {
    players[0].deck.addCard(data.id);
    if(cardPile.verifyCard(data.id)) buttonsManager.showButton('pass');
    buttonsManager.checkUno();
})

socket.on('enemyCard', function(data) {
    var player = players.find(function(value) {
        return (value.id == data.playerID);
    });
    player.deck.addCard(-1);
})

function uno() {
    socket.emit('uno');
    buttonsManager.hideButton('uno');
}

socket.on('setColor', function(data) {
    cardPile.color = data.color;
    drawColorCat = true;
})

function selectColor(id) {
    socket.emit('selectColor', {color:id});
    document.getElementById('colorChoose').style.visibility = 'hidden';
}

function pass() {
    socket.emit('pass');
}

var input = document.getElementById('chatInput');

input.addEventListener('keydown', function() {
    if(event.keyCode == 13) sendChat();
})

socket.on('chatReceive', function(data) {
    var history = document.getElementById('chatHistory');

    history.innerHTML += data.text;
    history.innerHTML += '<br>';
    history.scrollTop = history.scrollHeight;
})

function sendChat() {
    if(input.value.length <= 1) return;
    var history = document.getElementById('chatHistory');

    socket.emit('chatSend', {text:input.value});

    history.innerHTML += '[You] ';
    history.innerHTML += input.value;
    history.innerHTML += '<br>';
    history.scrollTop = history.scrollHeight;

    input.value = '';
}

socket.on('win', function(data) {
    specialMessage.show(data.seat, 1, 3000);

    buttonsManager.hideButton('take');
    buttonsManager.hideButton('pass');
})

socket.on('uno', function(data) {
    specialMessage.show(data.seat, 0, 3000);
})