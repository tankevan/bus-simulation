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
    "1": { "x": 40, "y": 140, "busServices": [] },
    "2": { "x": 80, "y": 80, "busServices": [] },
    "3": { "x": 160, "y": 130, "busServices": [] },
    "4": { "x": 240, "y": 130, "busServices": [] },
    "5": { "x": 320, "y": 160, "busServices": [] },
    "6": { "x": 440, "y": 160, "busServices": [] },
    "7": { "x": 520, "y": 160, "busServices": [] },
    "8": { "x": 600, "y": 160, "busServices": [] },
    "9": { "x": 560, "y": 240, "busServices": [] },
    "10": { "x": 480, "y": 240, "busServices": [] }
  };
  this.busRoutes = {
    "291": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "6","5", "4", "3", "2", "1"],
  };
  this.busStops = {}; // stores bus stop objects
  this.averageCapacities = {
    "291": { "value": 0, "numRecords": 0 }
  };
  this.arrivalRates = {
    "low": 0.42/5,
    "medium": 0.86/5,
    "high": 1.71/5,
  }
  this.currArrivalRate = this.arrivalRates["low"];
}

// load asset files for our game
gameScene.preload = function() {

  // load images
  this.load.image('busStop', 'assets/bus-stop.png');
  this.load.image('bus', 'assets/bus.png');
  this.load.image('passenger', 'assets/man-user.png');
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

    // draw edges only if not the backward route
    for (let i = 0; i < routeArr.length - 1; i++) {
      gameScene.drawEdge(this.busStops[routeArr[i]], this.busStops[routeArr[i+1]]);
    }

    // populate list of bus services for each stop
    for (let i = 0; i < routeArr.length - 1; i++) {
      this.busStopList[routeArr[i]].busServices.push(key);
    }

    // create text in the capacity container
    const ctr = document.getElementById("capacityTable");
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    const td2 = document.createElement("td");
    // const p = document.createElement("p");
    // const p2 = document.createElement("p");
    td.class = "label";
    td.innerHTML = key + ":";
    td2.id = key;
    td2.innerHTML = "0";
    tr.appendChild(td);
    tr.appendChild(td2);
    ctr.appendChild(tr);
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

  // add event listener to radio buttons
  // var radios = document.getElementsByTagName("input");
  // for(var i = 0; i < radios.length; i++) {
  //   radios[i].onclick = function() {
  //     this.currArrivalRate = this.arrivalRates[this.value];
  //     console.log(this.currArrivalRate);
  //   }
  // }

};

// *** CREATE SUB-FUNCTIONS *** 

gameScene.addBusStop = function(lat, lng, busServices, stopNumber) {
  let busStop = this.add.sprite(lat, lng, 'busStop');
  busStop.setScale(0.08);
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
  bus.setScale(0.1);
  bus.depth = 2;

  bus.number = busNo;
  bus.origin = origin;
  bus.destination = dest;
  bus.capacity = 20;
  bus.state = 'arrived';
  bus.passengers = this.add.group();
  bus.tag = this.add.text(bus.x - 20, bus.y + 50, bus.number, { fontSize: '16px', fill: '#000'});
  bus.remainingStops = this.busRoutes[bus.number].slice();
  bus.targetStop = 0;

  this.busGroup.add(bus);
}

gameScene.destroyBus = function(bus) {
  bus.tag.destroy();
  this.busGroup.remove(bus, true, true);
}

gameScene.drawEdge = function(node1, node2) {
  // const diffX = node2.x - node1.x;
  // const xDirection = diffX / Math.abs(diffX);
  // const diffY = node2.y - node1.y;
  // const yDirection = diffY / Math.abs(diffY);
  // const minDiff = Math.min(Math.abs(diffX), Math.abs(diffY));
  // const firstX = node1.x + xDirection * minDiff;
  // const firstY = node1.y + yDirection * minDiff;
  
  const line = new Phaser.Geom.Line(node1.x, node1.y, node2.x, node2.y);
  const graphics = this.add.graphics({ lineStyle: { width: 4, color: 0xaa00aa }});
  graphics.strokeLineShape(line);

  // if (diffX !== diffY) {
  //   const secondLine = new Phaser.Geom.Line(firstX, firstY, node2.x, node2.y);
  //   graphics.strokeLineShape(secondLine);
  // }
}

gameScene.passengerArrive = function() {
  this.busStopGroup.children.each((busStop) => {
    const randNum = Math.random();
    // k. how to use?
    // const invFunc = (-1) / (1.43 * Math.log(1 - randNum));
    var radios = document.getElementsByTagName("input");
    for (let i = 0; i < radios.length; i++) {
      if (radios[i].checked) {
        this.currArrivalRate = this.arrivalRates[radios[i].value];
      }
    }

    if (randNum < this.currArrivalRate) {
      // randomly choose a service
      const servicesList = busStop["busServices"];
      const busIndex = servicesList.length > 0 ? Math.floor(Math.random() * (servicesList.length)) : 0;
      const busNo = servicesList[busIndex];
      
      // randomly choose a stop on a remaining stop
      let routeArr = this.busRoutes[busNo];
      let destinationStop = null;
      for (let i = 0; i < routeArr.length; i++) {
        if (routeArr[i] === busStop.stopNumber) {
          const destinationIndex = i + Math.floor(Math.random() * (routeArr.length - i - 1));
          destinationStop = routeArr[destinationIndex];
        }
      }

      gameScene.addPassenger(busStop, destinationStop, busNo);
    }
  })
}

gameScene.addPassenger = function(originStop, destinationStop, busNo) {
  let passenger = this.add.sprite(-100, -100, 'passenger') // render out of screen first
  passenger.setScale(0.02);

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
    const targetStopNo = bus.targetStop;
    const targetStopObj = this.busStops[targetStopNo];

    if (bus.state === 'idle') {
      bus.targetStop = 1;
      bus.state = 'travelling';
    } else if (bus.state == 'travelling') {
      const xDiff = Math.abs(bus.x - targetStopObj.x);
      const yDiff = Math.abs(bus.y - targetStopObj.y);
      if (xDiff < 1 && yDiff < 1) {
        bus.state = 'arrived';
      } else {
        gameScene.moveBus(bus, targetStopObj);
      }

    } else if (bus.state === 'arrived') {
      if (targetStopNo === bus.destination && bus.remainingStops.length === 0) {
        gameScene.destroyBus(bus);
      } else {
          if (targetStopObj && targetStopObj.passengers && targetStopObj.passengers.children.size > 0) {
            gameScene.movePassengers(bus, targetStopObj);
          }

          
          bus.targetStop = bus.remainingStops.shift();
          // console.log(bus.remainingStops, bus.targetStop, this.busRoutes[bus.number]);
          // bus.targetStop = (bus.targetStop + 1) % 4;
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

  const movementSpeed = 1;
  const variance = 0.2;
  const adjSpeed = movementSpeed + ((Math.random() - 0.5) * 2) * variance;
  const angle = Math.atan(Math.abs(yDiff) / Math.abs(xDiff));
  const xStep = adjSpeed * Math.cos(angle);
  const yStep = adjSpeed * Math.sin(angle);

  if (bus.x !== targetStopObj.x) {
    bus.x += Math.min(xDirection * xStep);
  }

  if (bus.y !== targetStopObj.y) {
    bus.y += Math.min(yDirection * yStep);
  }

  // move the tag as well
  bus.tag.x = bus.x - 19;
  bus.tag.y = bus.y + 20;
}

gameScene.movePassengers = function(bus, targetStopObj) {
  let remainingCapacity = bus.capacity - bus.passengers.children.size;

  // k. unload passengers if at target stop
  bus.passengers.children.each((passenger) => {
    if (passenger.destination === targetStopObj.stopNumber){
      bus.passengers.remove(passenger, true, false);
      remainingCapacity += 1
    }
  });

  targetStopObj.passengers.children.each((passenger) => {
    if (remainingCapacity > 0 && passenger.busNo === bus.number) {
      targetStopObj.passengers.remove(passenger, true, false);
      bus.passengers.add(passenger);

      remainingCapacity -= 1;
    }
  });  

  gameScene.drawPassengers(targetStopObj);
  gameScene.updateCapacities(bus);
}

gameScene.updateCapacities = function(bus) {
  const value = this.averageCapacities[bus.number]["value"];
  const numRecords = this.averageCapacities[bus.number]["numRecords"];
  const currCapacity = (bus.passengers.children.size) / bus.capacity;
  const newAverage = ((value * numRecords) + currCapacity) / (numRecords + 1);

  this.averageCapacities[bus.number]["value"] = newAverage;
  this.averageCapacities[bus.number]["numRecords"] = numRecords + 1;

  const t1 = document.getElementById(bus.number);
  t1.innerHTML = newAverage.toFixed(2);

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
