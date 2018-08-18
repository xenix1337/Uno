//Canvas Info
var canvas = document.getElementById('game');
var c = canvas.getContext('2d');

const width = 500;
const height = 500;
canvas.width = width;
canvas.height = height;

const FPS = 30;

//Cards info
const colors = ['gray','red','lime','blue','yellow','black'];
const symbols = ['X', '><', '+2'];
const cardWidth = 60;
const cardHeight = 100;

var cards = [];

//Other
var mousePos = {x:0,y:0};
const deckPositions = [{x:0, y:height - 120},{x:20, y:0},{x:0,y:20},{x:420,y:0}];

//Events
canvas.addEventListener("click", function() {
    canvas.style.cursor = 'auto';
});

canvas.addEventListener('mousemove', function(evt) {
    mousePos = getMousePos(canvas,evt);
});

//Game variables
var players = [];
players.push(new Player(0));
players.push(new Player(1));
players.push(new Player(2));
players.push(new Player(3));
var moveIndicator = new MoveIndicator(0);
var cardPile = new CardPile();

cardPile.putCard(new Card(5));

//START GAME
players.forEach(function(value) {
    for(var i = 0; i < 15; i++) {
        value.deck.addCard(Math.floor(Math.random() * 50), value.own);
    }
})

draw();
setInterval(draw, 1000 / FPS);

//DRAW FUNCTION
function draw() {
    c.fillStyle = 'darkgreen';
    c.fillRect(0,0,width,height);

    players.forEach(function(value) {
        value.update();
    })
    moveIndicator.draw();
    cardPile.draw();

    let canHover = true;
    players[0].deck.cards.slice().reverse().forEach(function(value) {
        if(aabb(mousePos.x, mousePos.y, value.x, value.y, cardWidth, cardHeight) && canHover) {
            value.hovered = true;
            canHover = false;
            if(players[0].canMove) canvas.style.cursor = "pointer";
        } else value.hovered = false;
    })
    if(canHover) canvas.style.cursor = "auto";
    cards.sort(function(a,b) {
        return a.zIndex > b.zIndex;
    })
    cards.forEach(function(value) {
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