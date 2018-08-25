var express = require('express');
var app = express();
var http = require('http').Server(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

http.listen(process.env.PORT || 8080, '0.0.0.0');
console.log("Server started!");
console.log(process.env.PORT);

class Lobby {
    constructor() {
        this.id = Math.floor(Math.random() * 100000);
        this.spectators = [];
        this.players = [];
        this.running = false;
        this.host = null;

        this.currentMove = 0;
        this.cardPile = [];
        this.color = 0;
        this.waitForColor = false;
        this.direction = 0;

        this.chatHistory = [];
    }

    initLobby(host) {
        this.setHost(host);
        this.running = false;

        console.log("Lobby initialized by " + host.id);
    }

    setHost(socket) {
        this.host = socket;
        socket.emit('host');
    }

    newSocket(socket) {
        //Send initial packet with info about game and push him to spectators
        socket.emit('init', {playerID:socket.playerID, currentMove:2, chatHistory:this.chatHistory});
        this.spectators.push(socket);
        this.sendFullInfo(socket);
        socket.canPick = true;
        socket.playerID = Math.floor(Math.random() * 1000000);
        socket.saidUno = false;

        if(this.spectators.length + this.players.length == 1) this.initLobby(socket);
        this.reportServer();
    }

    newPlayer(socket) {
        //Looking for free seat for him
        var freeSeats = [0,1,2,3];
        this.players.forEach(function(value) {
            freeSeats.splice(freeSeats.indexOf(value.seat), 1);
        });

        this.players.push(socket);
        socket.seat = freeSeats[0];
        socket.cards = [];
    }

    newRound() {
        var _this = this;
        if(this.running) return;

        this.direction = 0;

        //Move sockets from spectators to players, if there are any free seats
        while(this.spectators.length > 0 && this.players.length < 4) {
            this.newPlayer(this.spectators.shift());
        }

        if(this.players.length < 2) {
            this.host.emit('alert', {text:'Not enough players on server!'});
            return;
        }

        this.currentMove = this.host.seat;

        //Give cards to player
        this.players.forEach(function(value) {
            value.cards = [];
            for(var rs = 0; rs < 5; rs++) {
                value.cards.push(_this.randomCard());
            }
            value.canPick = true;
        });

        //Send random card on pile
        this.cardPile = [];
        this.cardPile.push(Math.floor(Math.random() * 9.999) + 13 * Math.floor(Math.random() * 3.999)); //Non attack card
        
        this.running = true;

        //Send packet about new round with full information
        this.players.forEach(function(value) {
            _this.sendFullInfo(value);
        });
        this.spectators.forEach(function(value) {
            _this.sendFullInfo(value);
        });

        this.waitForColor = false;

        

        console.log("Round started!");
        console.log("Players: " + this.players.length);
        console.log("Spectators: " + this.spectators.length);
    }

    roundEnd() {
        this.running = false;
        while(this.players.length > 0) {
            this.spectators.push(this.players.shift());
        }
    }

    sendFullInfo(socket) {
        var players = [];
        this.players.forEach(function(value) {
            if(value != socket) players.push({playerID:value.playerID, cards:value.cards.length, seat:value.seat});
        })

        socket.emit('fullinfo', {
            players:players, 
            you:{playerID:socket.playerID, cards:socket.cards, seat:socket.seat}, 
            currentMove:this.currentMove, 
            pile:this.cardPile[this.cardPile.length - 1],
            running:this.running
        });
    }

    verifyCard(id) {
        var topCardID = this.cardPile[this.cardPile.length - 1];
        if(id >= 52) return true; //For black cards always return true
        if(topCardID < 52) { //For all cards on pile, expect black
            if(topCardID % 13 == id % 13) return true; //Return true for same number
            if(Math.floor(topCardID / 13) == Math.floor(id / 13)) return true; //Return true for same color
        } else {
            if(this.color == Math.floor(id/13)) return true; //For black color-changed cards, return true for same color only
        }
        return false; //Otherwise, return false
    }

    sendCard(socket, data) {
        if(!this.verifyCard(data.id)) return;
        if(socket.seat != this.currentMove) return;
        if(!this.running) return;

        var _this = this;

        var index = socket.cards.indexOf(data.id);

        if(index >= 0) {
            socket.cards.splice(index, 1);
            socket.broadcast.emit('cardOnPile', {id:data.id, playerID:socket.playerID});
            if (this.checkWin(socket)) return;

            //Checking for saing UNO
            if(!socket.saidUno && socket.cards.length == 1) {
                for(var i = 0; i < 3; i++) {
                    this.giveCard(this.players.find(function(value) {
                        return (value.seat == _this.currentMove);
                    }));
                }
            }
            socket.saidUno = false; //reset saing UNO

            if(data.id < 52) {
                if(data.id % 13 == 10) {
                    //Block player
                    this.nextPlayer();
                    this.nextPlayer();
                } else if(data.id % 13 == 11) {
                    //Swap direction
                    this.direction = (this.direction == 0) ? 1 : 0;
                    this.nextPlayer();
                    if(this.players.length == 2) this.nextPlayer();
                } else if(data.id % 13 == 12) {
                    //Add 2 cards
                    this.nextPlayer();
                    for(var i = 0; i < 2; i++) {
                        this.giveCard(this.players.find(function(value) {
                            return (value.seat == _this.currentMove);
                        }));
                    }
                    this.nextPlayer();
                } else {
                    this.nextPlayer();
                }
            } else {
                this.waitForColor = true;
            }
            this.cardPile.push(data.id);
        } else {
            socket.emit('alert', {text:'Something went wrong! Reload page!'});
            console.log("He dont have this card! Cheater?");
        }
    }

    selectColor(socket, data) {
        if(socket.seat != this.currentMove) return;
        if(!this.waitForColor) return;
        if(!this.running) return;
        var _this = this;

        if(data.color < 0 || data.color > 3) data.color = Math.floor(Math.random() * 3.99999);

        this.color = data.color;
        socket.broadcast.emit('setColor', {color:data.color});
        socket.emit('setColor', {color:data.color});
        this.nextPlayer();
        if(this.cardPile[this.cardPile.length - 1] == 53) {
            for(var i = 0; i < 4; i++) {
                this.giveCard(this.players.find(function(value) {
                    return (value.seat == _this.currentMove);
                }));
            }
            this.nextPlayer();
        }
        this.waitForColor = false;
    }

    takeCard(socket) {
        if(this.waitForColor) return;
        if(socket.seat != this.currentMove) return;
        if(!socket.canPick) return;
        if(!this.running) return;

        var card = this.giveCard(socket);

        if(!this.verifyCard(card)) this.nextPlayer();
        else {
            socket.canPick = false;
        }
    }

    giveCard(socket) {
        var card = this.randomCard()
        socket.cards.push(card);
        socket.emit('takeCard', {id:card});
        socket.broadcast.emit('enemyCard', {playerID:socket.playerID});

        return card;
    }

    randomCard() {
        var randomNumber = Math.floor(Math.random() * 55.99999);
        if(randomNumber < 52) return randomNumber;
        else if(randomNumber < 54) return 52;
        else if(randomNumber < 56) return 53;
    }

    checkWin(socket) {
        if(socket.cards.length == 0) {
            io.emit('chatReceive', {text:(socket.playerID + ' won the round!')});
            this.roundEnd();
            setTimeout(this.newRound.bind(this), 3000);
            io.emit('win', {playerID:socket.playerID});
            return true;
        }
    }

    uno(socket) {
        let _this = this;
        if(socket.seat != this.currentMove) return; //Saying UNO on not own turn
        if(socket.cards.length != 2) return; //Saying UNO is possible only with 2 cards, and then throwing one
        var canThrow = false;
        socket.cards.forEach(function(value) {
            if(_this.verifyCard(value)) canThrow = true;
        })
        if(!canThrow) return; //No good cards to throw and have 1 card

        socket.saidUno = true;
    }

    onPlayerDisconnect(socket) {
        //Remove from spectators or players
        var i = this.spectators.indexOf(socket);
        if(i >= 0) this.spectators.splice(i, 1);
        i = this.players.indexOf(socket);
        if(i >= 0) this.players.splice(i, 1);

        //Inform other players
        socket.broadcast.emit('leave', {playerID:socket.playerID});

        //Pass host function
        if(socket == this.host) {
            if(this.players.length > 0) this.setHost(this.players[0]);
            else if(this.spectators.length > 0) this.setHost(this.spectators[0]);
            else this.host = null;
        }

        if(this.players.length > 1 && socket.seat == this.currentMove) this.nextPlayer();
        if(this.players.length < 2) {
            this.roundEnd();
        }

        console.log('Goodbye ' + socket.playerID);
        this.reportServer();
    }

    nextPlayer() {
        let _this = this;
        do { 
            if(this.direction == 0) this.currentMove++;
            else this.currentMove--;

            this.currentMove = this.currentMove % 4;
            if(this.currentMove < 0) this.currentMove += 4;
        } 
        while (this.players.find(function(value) { 
            return (value.seat == _this.currentMove);
        }) == undefined)

        this.players.forEach(function(value) {
            value.emit('setPlayer', {id:_this.currentMove});
        });
        this.spectators.forEach(function(value) {
            value.emit('setPlayer', {id:_this.currentMove});
        });

        this.players.find(function(value) {
            return _this.currentMove == value.seat;
        }).canPick = true;
    }

    reportServer() {
        console.log("Players:" + this.players.length);
        console.log("Spectators: " + this.spectators.length);
    }
}

var lobby = new Lobby();

var io = require('socket.io')(http,{});
io.on('connection', function(socket) {
    lobby.newSocket(socket);
    console.log("Hello " + socket.playerID);

    socket.on('startRound', function() {
        if(lobby.host == socket) lobby.newRound();
    })

    socket.on('sendCard', function(data) {
        lobby.sendCard(socket, data);
    })

    socket.on('takeCard', function() {
        lobby.takeCard(socket);
    })

    socket.on('selectColor', function(data) {
        lobby.selectColor(socket, data);
    })

    socket.on('pass', function() {
        if(lobby.currentMove == socket.seat && !socket.canPick && lobby.running) lobby.nextPlayer();
    })

    socket.on('uno', function() {
        lobby.uno(socket);
    })

    socket.on('chatSend', function(data) {
        if(data.text.length <= 1) return;
        data.text = '[' + socket.playerID + '] ' + data.text;
        lobby.chatHistory.push(data.text);
        while(lobby.chatHistory.length > 30) {lobby.chatHistory.shift();}
        socket.broadcast.emit('chatReceive', data);
    })

    socket.on('disconnect', function() {
        lobby.onPlayerDisconnect(socket);
    })
});