//Canvas Info
var canvas = document.getElementById('game');
canvas.onselectstart = function () { return false; }
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
var mousePos = {x:0,y:0,oneclick:false};
const deckPositions = [{x:0, y:height - 120},{x:20, y:0},{x:0,y:20},{x:420,y:0}];

//Events
canvas.addEventListener("click", function() {
    mousePos.oneclick = true;
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

cardPile.putCard(new PlayerCard(5));
cardPile.putCard(new PlayerCard(6));
cardPile.putCard(new PlayerCard(6));
cardPile.putCard(new PlayerCard(6));


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
    //Draw background
    c.fillStyle = 'darkgreen';
    c.fillRect(0,0,width,height);

    //Update cards holders and draw move indicator
    players.forEach(function(value) {
        value.update();
    })
    moveIndicator.draw();
    cardPile.update();

    //Sort cards by zIndex and draw them
    cards.sort(function(a,b) {
        return a.z - b.z;
    })

    let canHover = true;
    players[0].deck.cards.slice().reverse().forEach(function(value, index, array) {
        let mouseOnIt = value.isMouseOnIt();
        if(!mouseOnIt) {
            if(value.hovered == true) value.onDehover();
        }
        if(mouseOnIt) {
            if(canHover) {
                if(value.hovered == false) value.onHover();
                canvas.style.cursor = "pointer";
                canHover = false;

                if(mousePos.oneclick) { //On click
                    value.move({x:cardPile.x,y:cardPile.y},500);
                    
                    players[0].deck.cards.splice(array.length - index - 1, 1);

                    cardPile.putCard(value);
                }
            } else {
                if(value.hovered == true) value.onDehover();
            }
        }
    })
    if(canHover || !players[0].canMove) canvas.style.cursor = "auto";

    cards.forEach(function(value) {
        value.update();
        value.draw();
    })

    mousePos.oneclick = false;
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