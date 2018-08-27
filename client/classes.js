class Card {
    constructor() {
        //Transform info
        this.x = 0;
        this.y = 0;
        this.z = 0;

        //Animation info
        this.startPos = {};
        this.destination = {};
        this.time = 0;
        this.maxTime = 0;
        this.moving = false;

        //Push card to all cards array
        cards.push(this);
    }

    update() {
        if(this.moving) {
            this.time += 1000 / FPS;
            this.x = this.startPos.x + (this.destination.x - this.startPos.x) * (this.time / this.maxTime);
            this.y = this.startPos.y + (this.destination.y - this.startPos.y) * (this.time / this.maxTime);
            if(this.time >= this.maxTime) {
                this.x = this.destination.x;
                this.y = this.destination.y;
                this.moving = false;
            }
        }
    }

    draw() {
        c.drawImage(cardsSheet, 5*cardWidth, 0, cardWidth, cardHeight, this.x, this.y, cardWidth, cardHeight);
    }

    move(destination, time) {
        this.time = 0;
        this.maxTime = time;
        this.startPos = {x:this.x,y:this.y};
        this.destination = destination;
        this.moving = true;
    }
}

class PlayerCard extends Card {
    constructor(id) {
        super();
        this.id = id;
        this.hovered = false;
    }

    isMouseOnIt() {
        return aabb(mousePos.x, mousePos.y, this.x, this.y, cardWidth, cardHeight + 100);
    }

    update() {
        //let hoveredNow = this.isMouseOnIt();
        super.update();
    }

    draw() {
        let colorID = Math.floor(this.id / 13);

        c.drawImage(cardsSheet, colorID * cardWidth, 0, cardWidth, cardHeight, this.x, this.y, cardWidth, cardHeight);

        if((this.id % 13 <= 9 && this.id != 52) || this.id % 13 == 12 || this.id == 53) { //Cards with text symbols
            var symbol = this.id % 13;
            if(this.id % 13 == 12) symbol = '+2';
            if(this.id == 53) symbol = '+4';

            c.font = '48px Comic Sans MS';
            c.textAlign = 'center';
            c.textBaseline = 'middle'; 
            c.fillStyle = 'black';
            c.fillText(symbol, this.x + cardWidth / 2, this.y + cardHeight / 2);
        } else { //Cards with symbols
            var dx = 0;
            if(this.id == 52) {
                dx = cardWidth * 2;
            } else {
                dx = ((this.id%13) - 10) * cardWidth;
            }

            c.drawImage(specialSheet, dx, 0, cardWidth, cardHeight, this.x, this.y, cardWidth, cardHeight);
        }
        
    }

    onHover() {
        this.move({x:this.x, y:this.y-55},200);

        this.hovered = true;
    }

    onDehover() {
        this.move({x:this.x, y:this.startPos.y},200);

        this.hovered = false;
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.x = 0;
        this.y = 0;
        this.own = false;
        this.margin = 0.06 * width;
        this.orientation = 'h';
    }

    addCard(id) {
        var newCard;
        if(this.own) newCard = new PlayerCard(id);
        else newCard = new Card();

        this.cards.push(newCard);
        this.sortDeck();
    }

    sortDeck() {
        if(!this.own) return;
        this.cards.sort(function(a,b) {
            return a.id - b.id;
        })
    }

    update() {
        let _this = this;

        //Align cards in the middle
        let cardCount = this.cards.length;
        let cardsWidth = -10;
        this.cards.forEach(function(value) {
            if(_this.orientation == 'h') cardsWidth += cardWidth + 10;
            else cardsWidth += cardHeight + 10;
        });
        if(cardsWidth > width - 2 * this.margin) cardsWidth = width - 2 * this.margin;
        let currentX = width / 2 - cardsWidth / 2 + ((this.orientation == 'h') ? this.x : this.y);

        //Set them at their position and draw
        this.cards.forEach(function(value, index) {
            value.x = ((_this.orientation == 'h') ? currentX : _this.x);
            if(!value.hovered) value.y = ((_this.orientation == 'h') ? _this.y : currentX);
            
            value.z = index + ((_this.own) ? 100 : 0);

            currentX += (cardsWidth - ((_this.orientation == 'h') ? cardWidth : cardHeight)) / (cardCount - 1);
        });
    }
}

class CardPile {
    constructor() {
        this.cards = [];
        this.x = width / 2 - cardWidth / 2;
        this.y = height / 2 - cardHeight / 2;
        this.color; //for card 52 and 53
    }

    topCard() {
        if(this.cards.length <= 0) return -1;
        return this.cards[this.cards.length - 1];
    }

    putCard(card) {
        this.cards.push(card);
        while(this.cards.length > 3) {
            var oldCard = this.cards.shift();
            cards.splice(cards.indexOf(oldCard), 1);
        }
    }

    update() {
        let _this = this;
        this.cards.forEach(function(value,index) {
            value.z = index;
            if(!value.moving) {
                value.x = _this.x;
                value.y = _this.y;
            }
        })
    }

    verifyCard(id) {
        var topCardID = this.topCard().id;
        if(id >= 52) return true; //For black cards always return true
        if(topCardID < 52) { //For all cards on pile, expect black
            if(topCardID % 13 == id % 13) return true; //Return true for same number
            if(Math.floor(topCardID / 13) == Math.floor(id / 13)) return true; //Return true for same color
        } else {
            if(this.color == Math.floor(id/13)) return true; //For black color-changed cards, return true for same color only
        }
        return false; //Otherwise, return false
    }
}

class Player {
    constructor(seat, own = false) {
        this.own = own;
        this.canMove = false;
        this.seat = seat;
        this.deck = new Deck();
        this.id = 0;
        this.localSeat = 0;

    }

    update() {
        this.localSeat = (this.seat - playerSeat) % 4;
        if(this.localSeat < 0) this.localSeat += 4;
        this.deck.x = deckPositions[this.localSeat].x;
        this.deck.y = deckPositions[this.localSeat].y;
        this.deck.own = this.own;
        if(this.localSeat%2==1) this.deck.orientation = 'v';
        if(this.localSeat!=0) this.deck.margin = 0.28 * width;

        this.deck.update();
        if(this.own) this.deck.sortDeck();
    }
}

class MoveIndicator {
    constructor(seat) {
        this.seat = seat;
        this.setPlayer(0);
    }

    setPlayer(seat) {
        this.seat = seat;
        players[0].canMove = (seat == playerSeat);
        if(seat == playerSeat) {
            if(running) buttonsManager.showButton('take');
            buttonsManager.checkUno();
        } else {
            buttonsManager.hideButton('take');
            buttonsManager.hideButton('pass');
            buttonsManager.hideButton('uno');
        }
    }

    nextPlayer() {
        let _this = this;
        do { this.seat = (this.seat + 1) % 4; } 
        while (players.find(function(value) { 
            return (value.seat == _this.seat);
        }) == undefined)
        this.setPlayer(this.seat);
    }

    draw() {
        let distance = 0.25 * width;
        c.save();
        c.translate(width / 2, height / 2);
        c.rotate(0.5 * 3.1415 * (this.seat - playerSeat));
        c.beginPath();
        c.fillStyle='white';
        c.moveTo(0,distance);
        c.lineTo(-10, distance - 10);
        c.lineTo(10, distance - 10);
        c.fill();
        c.restore();
    }
}

class SpecialMessage {
    constructor() {
        this.seat = 0;
        this.type = 0;
        this.seatVectors = [{x:0,y:1},{x:-1,y:0},{x:0,y:-1},{x:1,y:0}];

        this.visible = false;
        this.hideButtonTimeout = null;
    }

    show(seat, type, time = 0) {
        if(this.hideButtonTimeout != null) clearTimeout(this.hideButtonTimeout);

        this.seat = seat;
        this.type = type;
        this.visible = true;

        if(time != 0) this.hideIn(time);
    }

    hideIn(time) {
        this.hideButtonTimeout = setTimeout(function() {this.visible = false; this.hideButtonTimeout = null}.bind(this), time);
    }

    draw() {
        if(!this.visible) return;
        
        let distance = 0.20 * width;
        let local = this.seat - playerSeat;
        if(local < 0) local += 4;
        let size = {x:100, y:100};
        
        c.drawImage(messageSheet, this.type * size.x, 0, size.x, size.y, width / 2 + this.seatVectors[local].x * distance - size.x / 2  + ((local % 2 == 0) ? 80 : 0), height / 2 + this.seatVectors[local].y * distance - size.y / 2 - ((local % 2 == 1) ? 60 : 0), size.x, size.y);
    }
}

class ButtonsManager {
    constructor() {
        
    }

    showButton(name) {
        var button = document.getElementById(name);
        button.style.visibility = 'visible';
    }

    hideButton(name) {
        var button = document.getElementById(name);
        button.style.visibility = 'hidden';
    }

    checkUno() {
        if(players[0].deck.cards.length == 2) {
            var canThrow = false;
            players[0].deck.cards.forEach(function(value) {
                if(cardPile.verifyCard(value.id)) canThrow = true;
            })
            if(canThrow) this.showButton('uno');
        }
    }
}