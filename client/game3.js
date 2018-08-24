//Canvas Info
var canvas = document.getElementById('game');
canvas.onselectstart = function () { return false; }
var c = canvas.getContext('2d');

var width = 750;
var height = 750;
canvas.width = width;
canvas.height = height;

const FPS = 30;

//Cards info
const colors = ['gray','red','lime','blue','yellow','black'];
const cardWidth =  90;
const cardHeight = 150;
var cardsSheet = new Image();
cardsSheet.src = "client/img/cards2.png";
var specialSheet = new Image();
specialSheet.src = "client/img/specials.png";
var colorCatsSheet = new Image();
colorCatsSheet.src = "client/img/colorCats.png";

var cards = [];

//Other
var mousePos = {x:0,y:0,oneclick:false};
const deckPositions = [
    {x:0, y:height - cardHeight - 20},
    {x:20, y:0},
    {x:0,y:20},
    {x:width - cardWidth - 20,y:0}
];
var playerSeat = 0;
var isPlaying = false;
var running = false;
var drawColorCat = false;

//Events
canvas.addEventListener("click", function() {
    mousePos.oneclick = true;
});

canvas.addEventListener('mousemove', function(evt) {
    mousePos = getMousePos(canvas,evt);
});

//Game variables
var players = [];

players.push(new Player(0, true));

var buttonsManager = new ButtonsManager();
var moveIndicator = new MoveIndicator(0);
var cardPile = new CardPile();



//START GAME
draw();
setInterval(draw, 1000 / FPS);

//DRAW FUNCTION
function draw() {
    var width = canvas.width;
    var height = canvas.height;

    //Draw background
    c.fillStyle = 'darkgreen';
    c.fillRect(0,0,width,height);

    if(!running) return;

    //Update cards holders and draw move indicator
    players.forEach(function(value) {
        if(value.own && isPlaying || !value.own) value.update();
    })
    moveIndicator.draw();
    cardPile.update();

    //Sort cards by zIndex and draw them
    cards.sort(function(a,b) {
        return a.z - b.z;
    })

    if(isPlaying && players[0].deck.cards.length > 0) {
        let canHover = true;
        players[0].deck.cards.slice().reverse().forEach(function(value, index, array) {
            let mouseOnIt = value.isMouseOnIt();
            if(!mouseOnIt) {
                if(value.hovered == true) value.onDehover();
            }
            if(mouseOnIt) {
                if(canHover) {
                    if(value.hovered == false) value.onHover();
                    canHover = false;
                    if(!cardPile.verifyCard(value.id)) return;
                    canvas.style.cursor = "pointer";
                    

                    if(mousePos.oneclick && players[0].canMove) { //On click
                        sendCard(value);
                        if(value.id >= 52) document.getElementById('colorChoose').style.visibility = 'visible';
                        value.move({x:cardPile.x,y:cardPile.y},500);
                        players[0].deck.cards.splice(array.length - index - 1, 1);
                        cardPile.putCard(value);

                        players[0].canMove = false;
                    }
                } else {
                    if(value.hovered == true) value.onDehover();
                }
            }
        })
        if(canHover || !players[0].canMove) canvas.style.cursor = "auto";
    }
    cards.forEach(function(value) {
        value.update();
        value.draw();
    })

    if(drawColorCat) {
        c.drawImage(colorCatsSheet, cardWidth * cardPile.color, 0, cardWidth, cardHeight, width / 2 - cardWidth / 2, height / 2 - cardHeight / 2 - 72, cardWidth, cardHeight);
    }

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