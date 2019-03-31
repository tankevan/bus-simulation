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
  // this.busRoute = ['40001', '40002', '40003', '40004'];
  this.busStopList = {
    "40001": { "x": 160, "y": 160, "busServices": [] },
    "40002": { "x": 320, "y": 80, "busServices": [] },
    "40003": { "x": 480, "y": 160, "busServices": [] },
    "40004": { "x": 320, "y": 240, "busServices": [] },
  };
  this.busRoutes = {
    "157": ["40001", "40002", "40003", "40004"]
  };
  this.busStops = {};

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

  for (const key in this.busStopList) {
    const stop = this.busStopList[key];
    gameScene.addBusStop(stop.x, stop.y, stop.busServices, key);
  }

  // draw bus
  this.busGroup = this.add.group();

  // iterate through this.busRoutes
  for (const key in this.busRoutes) {
    const routeArr = this.busRoutes[key];

    // draw edges
    for (let i = 0; i < routeArr.length - 1; i++) {
      gameScene.drawEdge(this.busStops[routeArr[i]], this.busStops[routeArr[i+1]]);
    }

    // populate list of bus services for each stop
    for (let i = 0; i < routeArr.length; i++) {
      this.busStopList[routeArr[i]].busServices.push(key);
    }
  }

  // event that spawns passengers

  this.passengerEvent = this.time.addEvent({
    delay: 1000,
    callback: gameScene.passengerArrive,
    callbackScope: this,
    loop: true
  });

  // event that spawns buses

  this.busEvent = this.time.addEvent({
    delay: 5000,
    callback: gameScene.generateBuses,
    callbackScope:this,
    loop:true
  })

  // this.busEven = this.time.addEvent({});

};

// *** CREATE SUB-FUNCTIONS *** 

gameScene.addBusStop = function(lat, lng, busServices, stopNumber) {
  let busStop = this.add.sprite(lat, lng, 'busStop');
  busStop.setScale(0.25);
  busStop.depth = 1;

  busStop.stopNumber = stopNumber;
  busStop.busServices = busServices;
  busStop.passengers = this.add.group();

  this.busStopGroup.add(busStop);
  this.busStops[stopNumber] = busStop;
}

gameScene.generateBuses = function() {
  for (const busNo in this.busRoutes) {
    const routeArr = this.busRoutes[busNo];
    // draw bus
    gameScene.addBus(busNo, routeArr[0], routeArr.slice(-1)[0]);
  }
}

gameScene.addBus = function(busNo, origin, dest) {
  let bus = this.add.sprite(this.busStopList[origin].x, this.busStopList[origin].y, 'bus');
  bus.setScale(0.5);
  bus.depth = 2;

  bus.number = busNo;
  bus.origin = origin;
  bus.destination = dest;
  bus.capacity = 10;
  bus.state = 'arrived';
  bus.targetStop = 0;
  bus.passengers = this.add.group();

  this.busGroup.add(bus);
}

gameScene.destroyBus = function(bus) {
  this.busGroup.remove(bus, true, true);
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
    if (randNum > 0.8) {
      // randomly choose a service
      const servicesList = busStop["busServices"];
      const busIndex = servicesList.length > 0 ? Math.floor(Math.random() * (servicesList.length)) : 0;
      const busNo = servicesList[busIndex];
      
      let routeArr = this.busRoutes[busNo];
      let destinationStop = null;
      for (let i = 0; i < routeArr.length; i++) {
        if (routeArr[i] === busStop.stopNumber) {
          const destinationIndex = i + Math.floor(Math.random() * (routeArr.length - i - 1));
          destinationStop = routeArr[destinationIndex];
        }
      }

      // randomly choose a stop on a remaining stop

      gameScene.addPassenger(busStop, destinationStop, busNo);
    }
  })
}

gameScene.addPassenger = function(originStop, destinationStop, busNo) {
  let passenger = this.add.sprite(-100, -100, 'passenger') // render out of screen first
  passenger.setScale(0.2);

  passenger.origin = originStop;
  passenger.destination = destinationStop;
  passenger.busNo = busNo;

  originStop.passengers.add(passenger);
  gameScene.drawPassengers(originStop);
}

// k. also used in update
gameScene.drawPassengers = function(busStop) {
  busStop.passengers.children.each((passenger, index) => {
    passenger.x = passenger.origin.x + 20 + (index * 10);
    passenger.y = passenger.origin.y - 15;
  });
}
// ***************************
// *** GAME UPDATE SECTION ***
// ***************************

// executed on every frame (60 times per second)
gameScene.update = function() {

  // bus travelling logic
  gameScene.updateBuses();

};

// *** UPDATE SUB-FUNCTIONS *** 

gameScene.updateBuses = function() {
  this.busGroup.children.each((bus) => {
    const targetStopObj = this.busStopGroup.children.entries[bus.targetStop];
    if (bus.state === 'idle') {
      bus.targetStop = 1;
      bus.state = 'travelling';
    } else if (bus.state == 'travelling') {
      if (bus.x === targetStopObj.x && bus.y === targetStopObj.y) {
        bus.state = 'arrived';
      } else {
        gameScene.moveBus(bus, targetStopObj);
      }

    } else if (bus.state === 'arrived') {
      const targetStopNo = this.busRoutes[bus.number][bus.targetStop];
      if (targetStopNo === bus.destination) {
        gameScene.destroyBus(bus);
      } else {
          if (targetStopObj.passengers && targetStopObj.passengers.children.size > 0) {
            gameScene.movePassengers(bus, targetStopObj);
          }

          bus.targetStop = (bus.targetStop + 1) % 4;
          bus.state = 'travelling';
      }
    }
  });
}

gameScene.moveBus = function(bus, targetStopObj) {
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

gameScene.movePassengers = function(bus, targetStopObj) {
  let remainingCapacity = bus.capacity - bus.passengers.children.size;

  targetStopObj.passengers.children.each((passenger) => {
    if (remainingCapacity > 0 && passenger.busNo === bus.number) {
      targetStopObj.passengers.remove(passenger, true, false);
      bus.passengers.add(passenger);

      remainingCapacity -= 1;
    }
  });  
  console.log(remainingCapacity);
  gameScene.drawPassengers(targetStopObj);
}

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
