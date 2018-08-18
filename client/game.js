var canvas = document.getElementById('game');
var c = canvas.getContext('2d');

const width = 500;
const height = 500;
const FPS = 30;

const color = ['gray','red','lime','blue','yellow','black'];
const symbols = ['X', '><', '+2']

canvas.width = width;
canvas.height = height;
var mousePos = {x:0,y:0};

canvas.addEventListener("click", function() {
    enemies[0].deck.cards.push(new Card(-1));
    enemies[1].deck.cards.push(new Card(-1));
    enemies[2].deck.cards.push(new Card(-1));
});

var objectPool = [];

class Card {
    constructor(id) {
        this.id = id;
        this.x = 0;
        this.y = 0;
        this.width = 60;
        this.height = 100;
        this.hovered = false;
        this.zIndex = 0;

        objectPool.push(this);
    }

    draw() {
        let hoverY = this.hovered ? -55 : 0;

        let colorID = Math.floor(this.id / 13);
        c.fillStyle = color[colorID + 1];

        c.fillRect(this.x, this.y + hoverY, this.width, this.height);
        c.fillStyle = 'black';
        c.strokeRect(this.x, this.y + hoverY, this.width, this.height);

        if(this.id == -1) return;
        var symbol = (this.id % 13 < 10) ? this.id % 13 : symbols[(this.id % 13) - 10];
        c.font = '50px Arial';
        c.textAlign = 'center';
        if(colorID == 4) c.fillStyle = 'white';
        c.fillText(symbol, this.x + this.width / 2, hoverY + this.y + this.height / 2);
    };
}

class Deck {
    constructor() {
        this.cards = [];
        this.own = false;
        this.x = 0;
        this.y = 0;
        this.orientation = 'h';
    }

    addCard(id) {
        var newCard = new Card(id);
        this.cards.push(newCard);

        //Sort all cards
        this.cards.sort(function(a,b) {
            return a.id > b.id;
        })
    }

    update() {
        let _this = this;

        //Align cards in the middle
        let cardCount = this.cards.length;
        let cardsWidth = -10;
        this.cards.forEach(function(value) {
            if(_this.orientation == 'h') cardsWidth += value.width + 10;
            else cardsWidth += value.height + 10;
        });
        if(this.own) {if(cardsWidth > width - 2 * 30) cardsWidth = width - 2 * 30;}
        else {if(cardsWidth > width - 2 * 140) cardsWidth = width - 2 * 140;}
        let currentX = width / 2 - cardsWidth / 2 + ((this.orientation == 'h') ? this.x : this.y);
        //Set them at their position and draw
        this.cards.forEach(function(value, index) {
            value.x = ((_this.orientation == 'h') ? currentX : _this.x);
            value.y = ((_this.orientation == 'h') ? _this.y : currentX);
            value.zIndex = index + ((_this.own) ? 100 : 0);

            currentX += (cardsWidth - ((_this.orientation == 'h') ? value.width : value.height)) / (cardCount - 1);
        });
    }
}

var Player = {
    deck: new Deck(),
    update: function() {
        this.deck.update();
    }
};

class Enemy {
    constructor() {
        this.name = '';
        this.deck = new Deck();
    }

    update() {
        this.deck.update();
    }
}

//START GAME
for(var i = 0; i < 25; i++) {
    Player.deck.addCard(Math.floor(Math.random() * 50));
}
Player.deck.own = true;
Player.deck.y = height - 120;

var enemies = [];
enemies.push(new Enemy());
enemies[0].deck.y = 20;

enemies.push(new Enemy());
enemies[1].deck.x = 20;
enemies[1].deck.orientation = 'v';

enemies.push(new Enemy());
enemies[2].deck.x = 420;
enemies[2].deck.orientation = 'v';

var stack = new Deck();
stack.x = 170;
stack.addCard(5);

draw();
setInterval(draw, 1000 / FPS); //TODO: I can change it to every event in game, because it hasn't got any physics or animations

//DRAW FUNCTION
function draw() {
    c.fillStyle = 'darkgreen';
    c.fillRect(0,0,width,height);

    Player.update();
    enemies.forEach(function(value) {
        value.update();
    })
    stack.update();

    let canHover = true;
    objectPool.slice().reverse().forEach(function(value) {
        if(aabb(mousePos.x, mousePos.y, value.x, value.y, value.width, value.height) && canHover && value.id != -1) {
            value.hovered = true;
            canHover = false;
        } else value.hovered = false;
    })
    objectPool.sort(function(a,b) {
        return a.zIndex > b.zIndex;
    })
    objectPool.forEach(function(value) {
        value.draw();
    })
}

//OTHER FUNCTIONS
function aabb(x,y,a,b,w,h) {
    if(x > a && x < a+w && y > b && y < b+h) return true;
    return false;
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

//EVENTS
canvas.addEventListener('mousemove', function(evt) {
    mousePos = getMousePos(canvas,evt);
});