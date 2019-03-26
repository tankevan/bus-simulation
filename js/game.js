// create a new scene named "Game"
let gameScene = new Phaser.Scene('Game');

// game parameters
// gameScene.playerSpeed = 1.5;
// gameScene.enemySpeed = 2;
// gameScene.enemyMaxY = 280;
// gameScene.enemyMinY = 80;
// gameScene.isPlayerAlive = true;

// some parameters for our scene
gameScene.init = function() {
  this.playerSpeed = 2.5;
  this.busRoute = ['40001', '40002', '40003', '40004'];

}

// load asset files for our game
gameScene.preload = function() {

  // load images
  this.load.image('busStop', 'assets/recycling.png');
  this.load.image('bus', 'assets/player.png');
  this.load.image('passenger', 'assets/dragon.png');
};


// ***************************
// *** GAME CREATE SECTION ***
// ***************************

// executed once, after assets were loaded
gameScene.create = function() {


  // set up background
  const rect = new Phaser.Geom.Rectangle(0, 0, 640, 360);
  const graphics = this.add.graphics({ lineStyle: { width: 2, color: 0x000000 }, fillStyle: { color: 0xffffff } });
  graphics.fillRectShape(rect);
  graphics.strokeRectShape(rect);

  // draw nodes
  this.busStopGroup = this.add.group();

  gameScene.addBusStop(160, 160, '40001');
  gameScene.addBusStop(320, 80, '40002');
  gameScene.addBusStop(480, 160, '40003');
  gameScene.addBusStop(320, 240, '40004');

  // draw bus
  this.busGroup = this.add.group();
  gameScene.addBus();

  // draw edges
  gameScene.drawEdge(this.busStopGroup.children.entries[0], this.busStopGroup.children.entries[1]);
  gameScene.drawEdge(this.busStopGroup.children.entries[1], this.busStopGroup.children.entries[2]);
  gameScene.drawEdge(this.busStopGroup.children.entries[2], this.busStopGroup.children.entries[3]);
  gameScene.drawEdge(this.busStopGroup.children.entries[3], this.busStopGroup.children.entries[0]);

  // create event to add people to bus stops
  this.passengerGroup = this.add

  this.passengerEvent = this.time.addEvent({
    delay: 1000,
    callback: gameScene.passengerArrive,
    callbackScope: this,
    loop: true
  });

  // this.busEven = this.time.addEvent({});

};

// *** CREATE SUB-FUNCTIONS *** 

gameScene.addBusStop = function(lat, lng, stopNumber) {
  let busStop = this.add.sprite(lat, lng, 'busStop');
  busStop.setScale(0.25);
  busStop.depth = 1;

  busStop.stopNumber = stopNumber;
  busStop.passengers = this.add.group();

  this.busStopGroup.add(busStop);
}

gameScene.addBus = function() {
  let bus = this.add.sprite(160, 160, 'bus');
  bus.setScale(0.5);
  bus.depth = 2;

  bus.targetStop = 0;
  bus.state = 'idle';
  bus.passengers = this.add.group();

  this.busGroup.add(bus);
}

gameScene.drawEdge = function(node1, node2) {
  const diffX = node2.x - node1.x;
  const xDirection = diffX / Math.abs(diffX);
  const diffY = node2.y - node1.y;
  const yDirection = diffY / Math.abs(diffY);
  const minDiff = Math.min(Math.abs(diffX), Math.abs(diffY));
  const firstX = node1.x + xDirection * minDiff;
  const firstY = node1.y + yDirection * minDiff;
  
  const line = new Phaser.Geom.Line(node1.x, node1.y, firstX, firstY);
  const graphics = this.add.graphics({ lineStyle: { width: 4, color: 0xaa00aa }});
  graphics.strokeLineShape(line);

  if (diffX !== diffY) {
    const secondLine = new Phaser.Geom.Line(firstX, firstY, node2.x, node2.y);
    graphics.strokeLineShape(secondLine);
  }
}

gameScene.passengerArrive = function() {
  this.busStopGroup.children.each((busStop) => {
    const randNum = Math.random();
    if (randNum > 0.9) {
      gameScene.addPassenger(busStop);
    }
  })
}

gameScene.addPassenger = function(originStop) {
  spriteX = originStop.x + 20 + (originStop.passengers.children.size * 10);
  spriteY = originStop.y - 15
  let passenger = this.add.sprite(spriteX, spriteY, 'passenger')
  passenger.setScale(0.2);

  originStop.passengers.add(passenger);
}

gameScene.drawPassengers = function(busStop) {

}
// ***************************
// *** GAME UPDATE SECTION ***
// ***************************

// executed on every frame (60 times per second)
gameScene.update = function() {

  // bus travelling logic
  this.busGroup.children.each((bus) => {
    console.log(bus.state);
    if (bus.state === 'idle') {
      bus.targetStop = 1;
      bus.state = 'travelling';
    } else if (bus.state == 'travelling') {
      const targetStopObj = this.busStopGroup.children.entries[bus.targetStop];
      if (bus.x === targetStopObj.x && bus.y === targetStopObj.y) {
        bus.state = 'arrived';
      } else {
        // move bus one step towards target 
        const xDiff = targetStopObj.x - bus.x;
        const yDiff = targetStopObj.y - bus.y;
        const xDirection = xDiff / Math.abs(xDiff);
        const yDirection = yDiff / Math.abs(yDiff);

        if (bus.x !== targetStopObj.x) {
          bus.x += xDirection * 1;
        }

        if (bus.y !== targetStopObj.y) {
          bus.y += yDirection * 1;
        }
      }

    } else if (bus.state === 'arrived') {
      bus.targetStop = (bus.targetStop + 1) % 4;
      bus.state = 'travelling';
    }
  });

};

// *** UPDATE SUB-FUNCTIONS *** 



// *************************
// *** GAME OVER SECTION ***
// ************************* 
gameScene.gameOver = function() {

};

// our game's configuration
let config = {
  type: Phaser.AUTO,
  width: 640,
  height: 360,
  scene: gameScene
};

// create the game, and pass it the configuration
let game = new Phaser.Game(config);
