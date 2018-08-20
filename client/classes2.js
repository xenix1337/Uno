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
        c.fillStyle = colors[0];

        c.fillRect(this.x, this.y, cardWidth, cardHeight);
        c.strokeStyle = 'black';
        c.lineWidth = 2;
        c.strokeRect(this.x, this.y, cardWidth, cardHeight);
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
        c.fillStyle = colors[colorID + 1];

        c.fillRect(this.x, this.y, cardWidth, cardHeight);
        c.strokeStyle = 'black';
        c.lineWidth = 2;
        c.strokeRect(this.x, this.y, cardWidth, cardHeight);

        if(this.id == -1) return;
        var symbol = (this.id % 13 < 10) ? this.id % 13 : symbols[(this.id % 13) - 10];
        c.font = '50px Arial';
        c.textAlign = 'center';
        if(colorID == 4) c.fillStyle = 'white';
        else c.fillStyle = 'black';
        c.fillText(symbol, this.x + cardWidth / 2, this.y + cardHeight / 2);
    }

    onHover() {
        this.move({x:this.x, y:this.y-55},200);

        this.hovered = true;
    }

    onDehover() {
        //this.moving = false;
        //this.y = this.startPos.y;
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
        this.margin = 30;
        this.orientation = 'h';
    }

    addCard(id) {
        var newCard;
        if(this.own) newCard = new PlayerCard(id);
        else newCard = new Card();

        this.cards.push(newCard);
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
        this.x = 220;
        this.y = 200;
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
            console.log("good");
            if(topCardID % 13 == id % 13) return true; //Return true for same number
            if(Math.floor(topCardID / 13) == Math.floor(id / 13)) return true; //Return true for same color
        } else {
            if(this.color == Math.floor(id/13)) return true; //For black color-changed cards, return true for same color only
        }
        return false; //Otherwise, return false
    }
}

class Player {
    constructor(seat) {
        this.own = (seat == 0);
        this.canMove = false;
        this.seat = seat;
        this.deck = new Deck();

        this.deck.x = deckPositions[seat].x;
        this.deck.y = deckPositions[seat].y;
        this.deck.own = this.own;
        if(seat%2==1) this.deck.orientation = 'v';
        if(seat!=0) this.deck.margin = 140;
    }

    update() {
        this.deck.update();
        if(this.seat == 0) this.deck.sortDeck();
    }
}

class MoveIndicator {
    constructor(seat) {
        this.seat = seat;
        this.setPlayer(0);
    }

    setPlayer(seat) {
        players[0].canMove = (seat == 0);
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
        let distance = 90;
        c.save();
        c.translate(width / 2, height / 2);
        c.rotate(0.5 * 3.1415 * this.seat);
        c.beginPath();
        c.fillStyle='white';
        c.moveTo(0,distance);
        c.lineTo(-10, distance - 10);
        c.lineTo(10, distance - 10);
        c.fill();
        c.restore();
    }
}