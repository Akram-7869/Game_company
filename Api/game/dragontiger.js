"use strict";
 
const gameId = 9;
const gameRoom = 'dragontiger';
  
let Sockets;
let gameState;
let altitude = 1.00;

let timeStamp; //as room id(change after 30 sec)
let ROUND_COUNT = 0; //reset to 0 after 5 round

let previousWins = [];
SetInitialData();

function GetSocket(SOCKET) {
  Sockets = SOCKET;
  ResetTimers();
}

async function SetInitialData() {
  //THIS WILL RUN ONLY ONCE
  //previousWins = await service.lastWinningNo(); //db
}

function StartAviatorGame(data) {
  //all are emitter
  SendCurrentRoundInfo(data);
  OnFlightBlast(data);
  OnBetsPlaced(data);
  OnleaveRoom(data);
}

function OnleaveRoom(data) {
  let socket = data['socket'];
  socket.on('onleaveRoom, function (data) {
    try {
      console.log('OnleaveRoom--Anar')
      socket.leave(gameRoom);
      socket.removeAllListeners('OnBetsPlaced');
       socket.removeAllListeners('OnFightBlast');
      socket.removeAllListeners('OnCashOut');

      socket.removeAllListeners('OnWinNo');
      socket.removeAllListeners('OnTimeUp');
      socket.removeAllListeners('OnTimerStart');
      socket.removeAllListeners('OnCurrentTimer');
      socket.removeAllListeners('onleaveRoom');



     // playerManager.RemovePlayer(socket.id);
      socket.emit('onleaveRoom', {
        success: `successfully leave ${gameRoom} game.`,
      });
    } catch (err) {
      console.log(err);
    }
  });
}

//Game events
function OnBetsPlaced(data) {
  let socket = data['socket'];
  socket.on('OnBetsPlaced', (data) => {
    console.log('onbet placed');
    socket.to(gameRoom).emit('OnBetsPlaced, data);
  });
}
function OnFlightHeight(data) {
  let socket = data['socket'];
  socket.on('OnBetsPlaced', (data) => {
    console.log('on OnFlightHeight');
    socket.to(gameRoom).emit('OnFlightHeight, data);
  });
}
function OnFlightBlast(data) {
  let socket = data['socket'];
  socket.on('OnFlightBlast', (data) => {
     
  });
}


 
function OnDissConnected(data) {
  let socket = data['socket'];
  socket.on("disconnect", (data) => {
    console.log("player got dissconnected " + socket.id);
    //playerManager.RemovePlayer(socket.id);
  });
}
async function addPlayerToRoom(data) {
  let socket = data['socket'];
  //let balance = await service.getUserBalance(data.playerId); //db
  let obj = {
    socketId: socket.id,
    balance, //this value will come from database
    avatarNumber: 0, //this value wil come from frontend
    playerId: data.playerId, //this value will come from database
  };
 // playerManager.AddPlayer(obj);
  return obj;
}



async function SendCurrentRoundInfo(data) {
  let socket = data['socket'];
  let timer = 0;
  altitude= 1;


  switch (gameState) {
    case 'canBet':
      timer = i;
      break;
    case 'cannotBet':
      timer = j;
      break;
    case 'wait':
      timer = k;
      break;
  }

  let player = await addPlayerToRoom(data);

  let obj = {
    gametimer: i,
    previousWins,
  };

  socket.emit('OnCurrentTimer', obj);
}

//game timers------------------------------------------
let i = 50;
let j = 10;
let k = 0;
let isTimeUp = false;
let canPlaceBets = true;
let canBet=true;


function ResetTimers() {
  let D = new Date();
  timeStamp = D.getTime();
  ROUND_COUNT = ROUND_COUNT === 5 ? 0 : ++ROUND_COUNT; //used in bot
  i = 50;
  j = 10;

  //ResetBotsBets();

  Sockets.to(gameRoom).emit('OnTimerStart', {result: i });

  console.log("betting...");
  isTimeUp = false;
  OnTimerStart();
  // SendBotData();
}
 async function OnTimerStart() {
  gameState = 'canBet';
  canPlaceBets = true;
  i--;

  //this will help to stop bots betting just before the round end
  //if (i === 2) isTimeUp = true;
  if (i == 0) {
    await sleep(1000);
    console.log("timeUp Aviator...");
    Sockets.to(gameRoom).emit('OnTimeUp');
    isTimeUp = true;
    OnTimeUp();
    return;
  }
  await sleep(1000);
  OnTimerStart();
}

////////////Decalre Result //////////////////////
async function OnTimeUp() {
    canPlaceBets = false;
    gameState = 'cannotBet';
  
    j--;
  
    if (j == 1) {
      var winconatinzero = []
        Sockets.to(gameRoom).emit('OnWinNo', {});
    }
  
    if (j === 0) {
      //round ended restart the timers
      console.log('resttimer()', i, j);
      ResetTimers();
      return;
    }
  
    await sleep(1000);
    OnTimeUp();
  }

//game timers-----------------END-------------------------

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function generateRandomNo(min, max) {
  //min & max include
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.StartAviatorGame = StartAviatorGame;
module.exports.GetSocket = GetSocket;
