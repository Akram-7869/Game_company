"use strict";
const http = require('http');
const socketio = require('socket.io');
const express = require('express');
const app = express();
const server = http.createServer(app);
const io = socketio(server);



const state = {};
const publicRoom = {};
const userSocketMap = {};


const gameName = {
    'ludo': 1,
    'dragon_tiger': 2,
    'teen_patti': 3,
    'rouletee': 4,
    'tambola': 5,
    'crash': 6,
  }
 
// class TurnController {
//     constructor(io) {
//         this.roomId ='';
//         this.io = 10;
//        // this.setupSocketIO();
//         this.turnTimeout = 15000; // 15 seconds timeout for turns
//         this.turnTimers = {}; // Store turn timers for each room
//         this.disconnectedPlayers = {}; // Store disconnected player info

//     }

//     startTurnTimer(roomId) {
//         this.turnTimer = setTimeout(() => {
//             // Handle timeout logic
//             this.moveToNextPlayer(roomId);
//         }, this.turnTimeout);
//     }
//     setupSocketIO() {
//         this.io.on('connection', (socket) => {
//             // Handle disconnect and reconnect events as previously discussed
//             // ...

//             socket.on('rollDice', (roomId) => {
//                 this.handleRollDice(roomId, socket.id);
//             });

//             socket.on('movePiece', (roomId, steps) => {
//                 this.handleMovePiece(roomId, socket.id, steps);
//             });
//             socket.on('disconnect', () => {
//                 console.log(`Socket disconnected: ${socket.id}`);
//                 this.handleDisconnect(socket.id);
//             });

//             socket.on('reconnect', (attemptNumber) => {
//                 console.log(`Socket reconnected: ${socket.id}, attempt ${attemptNumber}`);
//                 this.handleReconnect(socket.id, socket);
//             });


//             socket.on('disconnect', () => {
//                 console.log(`Socket disconnected: ${socket.id}`);
//                 this.handleDisconnect(socket.id);
//             });

//             socket.on('reconnect', () => {
//                 console.log(`Socket reconnected: ${socket.id}`);
//                 this.handleReconnect(socket.id);
//             });

//             socket.on('createRoom', (roomId, gameSettings) => {
//                 this.createRoom(roomId, gameSettings);
//                 socket.emit('roomCreated', roomId);
//             });

//             socket.on('joinRoom', (roomId, playerId) => {
//                 this.joinRoom(roomId, playerId);
//                 socket.join(roomId);
//                 socket.emit('roomJoined', roomId);
//                 this.io.to(roomId).emit('playerJoined', playerId);
//                 socket.emit('roomState', this.rooms[roomId].gameState);
//             });

//             socket.on('rollDice', (roomId) => {
//                 const diceValue = this.rollDice(roomId);
//                 this.io.to(roomId).emit('diceRolled', diceValue);
//             });

//             socket.on('movePiece', (roomId, playerId, steps) => {
//                 this.movePiece(roomId, playerId, steps);
//                 this.io.to(roomId).emit('pieceMoved', this.rooms[roomId].gameState.playerPositions);
//                 this.nextTurn(roomId);
//             });
//         });
//     }

//     handleRollDice(roomId, playerId) {
//         if (this.isPlayerTurn(roomId, playerId)) {
//             const diceValue = this.rollDice(roomId);
//             this.io.to(roomId).emit('diceRolled', diceValue);
//             this.resetTurnTimer(roomId); // Reset turn timer for the next player
//             this.moveToNextPlayer(roomId);
//         } else {
//             console.log(`Player ${playerId} tried to roll dice out of turn.`);
//             // Optionally, handle out-of-turn error or notify client
//         }
//     }

//     handleMovePiece(roomId, playerId, steps) {
//         if (this.isPlayerTurn(roomId, playerId)) {
//             this.movePiece(roomId, playerId, steps);
//             this.io.to(roomId).emit('pieceMoved', this.rooms[roomId].gameState.playerPositions);
//             this.resetTurnTimer(roomId); // Reset turn timer for the next player
//             this.moveToNextPlayer(roomId);
//         } else {
//             console.log(`Player ${playerId} tried to move piece out of turn.`);
//             // Optionally, handle out-of-turn error or notify client
//         }
//     }

//     isPlayerTurn(roomId, playerId) {
//         const gameState = this.rooms[roomId].gameState;
//         const currentPlayerId = gameState.players[gameState.currentPlayerIndex];
//         return currentPlayerId === playerId;
//     }

//     resetTurnTimer(roomId) {
//         clearTimeout(this.turnTimers[roomId]);
//         this.turnTimers[roomId] = setTimeout(() => {
//             this.moveToNextPlayer(roomId);
//         }, this.turnTimeout);
//     }

//     moveToNextPlayer(roomId) {
//         const gameState = this.rooms[roomId].gameState;
//         gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
//         this.resetTurnTimer(roomId);
//     }


//     handleDisconnect(playerId) {
//         for (const roomId in this.rooms) {
//             if (this.rooms[roomId].gameState.players.includes(playerId)) {
//                 // Store disconnected player info
//                 this.disconnectedPlayers[playerId] = {
//                     roomId: roomId,
//                     socketId: playerId
//                 };
//                 this.leaveRoom(roomId, playerId);
//                 break;
//             }
//         }
//     }

//     handleReconnect(playerId, socket) {
//         if (this.disconnectedPlayers[playerId]) {
//             const { roomId } = this.disconnectedPlayers[playerId];
//             socket.join(roomId);
//             // Optionally, update player's socket ID if it has changed
//             this.disconnectedPlayers[playerId].socketId = socket.id;
//             // Send current game state to the reconnected player
//             socket.emit('roomState', this.rooms[roomId].gameState);
//             // Notify other players in the room about the reconnection
//             this.io.to(roomId).emit('playerReconnected', playerId);
//         } else {
//             // Handle if player was not previously disconnected or info was lost
//             console.log(`Player ${playerId} attempting to reconnect without prior disconnect info.`);
//         }
//     }

//     leaveRoom(roomId, playerId) {
//         const gameState = this.rooms[roomId].gameState;
//         gameState.players = gameState.players.filter(id => id !== playerId);
//         this.io.to(roomId).emit('playerLeft', playerId);
//     }
//     createRoom(roomId, gameSettings) {
//         this.rooms[roomId] = {
//             settings: gameSettings,
//             gameState: {
//                 players: [],
//                 currentPlayerIndex: 0,
//                 diceValue: 0,
//                 playerPositions: {
//                     // Initialize player positions for Ludo (0-51)
//                     // Example: player1: 0, player2: 0, player3: 0, player4: 0
//                 }
//             }
//         };
//     }

//     joinRoom(roomId, playerId) {
//         this.rooms[roomId].gameState.players.push(playerId);
//     }

//     rollDice(roomId) {
//         const diceValue = Math.floor(Math.random() * 6) + 1;
//         this.rooms[roomId].gameState.diceValue = diceValue;
//         return diceValue;
//     }

//     movePiece(roomId, playerId, steps) {
//         const gameState = this.rooms[roomId].gameState;
//         const currentPosition = gameState.playerPositions[playerId];
//         let newPosition = currentPosition + steps;

//         if (newPosition >= 52) {
//             newPosition = newPosition - 52; // Wrap around the board
//             // Implement logic for entering home path
//         }

//         gameState.playerPositions[playerId] = newPosition;
//     }

//     nextTurn(roomId) {
//         const gameState = this.rooms[roomId].gameState;
//         gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
//         // Optionally, reset dice value or perform other turn-related actions
//     }

//     handleDisconnect(playerId) {
//         for (const roomId in this.rooms) {
//             if (this.rooms[roomId].gameState.players.includes(playerId)) {
//                 this.leaveRoom(roomId, playerId);
//                 break;
//             }
//         }
//     }
// }
const tokenMiddleware = (socket, next) => {
    const { tkn } = socket.handshake.query;
    console.log('c', tkn);
    if (tkn !== '2873') {
    //    return next(new Error(''));
    }
    // execute some code
    next();
}


  
let defaultRolletValue = () => {
    return {
      0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0,
      11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0,
      21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0,
      31: 0, 32: 0, 33: 0, 34: 0, 35: 0, 36: 0
    }
  
  
  }
  function getKeyWithMinValue(data) {
    // Ensure none of the values are less than 0
    Object.keys(data).forEach(key => {
      data[key] = Math.max(0, data[key]);
    });
  
    // Find the minimum value
    const minValue = Math.min(...Object.values(data));
  
    // Find keys with the minimum value
    const minKeys = Object.keys(data).filter(key => data[key] === minValue);
  
    // Pick a random key from keys with the minimum value
    const randomMinKey = minKeys[Math.floor(Math.random() * minKeys.length)];
    return randomMinKey;
  
  }
  
  
  function arraymove(arr, fromIndex, toIndex) {
    arr.unshift(arr.pop());
  
  }
  
  
  
  let joinRoom = (socket, playerId, room, d = {}) => {
    //console.log('join room', socket.id, playerId, room);
    socket['room'] = room;
    socket['userId'] = playerId;
    socket['lobbyId'] = d.lobbyId;
    let user = { room, 'socket_id': socket.id, role:d.role, lobbyId:d.loobyId, name:d.name };
    if(d.role ==='influencer'){
      socket['role'] = d.influencer;

      user= {...user , role:d.role, lobbyId:d.lobbyId, name:d.firstName}
    }
    userSocketMap[playerId] = user;
    d['socket_id'] = socket.id;
    let index = -1;
    if (state[room]) {
      index = state[room].players.findIndex(user => user.userId === playerId);
      //console.log('i-', index);
      if (index === -1) {
        state[room].players.push(d);
      }
    }
  }
  let getRoomUsers = (room) => {
  
    if (state[room]) {
      return state[room].players;
    }
    return [];
  }
  let getRoomLobbyUsers = (room, lobbyId) => {
    if (state[room]) {
      for (let x of state[room].players) {
        if (x.lobbyId != lobbyId) {
          return [];
        }
      }
      return state[room].players;
    }
    return [];
  }
  
  
  let userLeave = (s) => {
    console.log('leav-func')
    
    if (state[s.room]) {

      if (userSocketMap[s.userId]) {
        delete userSocketMap[s.userId];
      }

      if(state[s.room].players.length !== 0){
        const index = state[s.room].players.findIndex(user => user.userId === s.userId);
        if (index !== -1) {
          state[s.room].players.splice(index, 1);
        }
      }
      
    }
  
    // for (let r in state) {
    //   if (state[r]['created'] < Date.now()) {
    //     console.log('del-old');
    //     delete state[r];
    //   }
    // }
    //remove lobby 
    // for (let l in publicRoom) {
    //   if (publicRoom[l]['roomName']) {
    //     let rn = publicRoom[l]['roomName'];
    //     if (!state[rn]) {
    //       delete publicRoom[l];
    //     }
    //   }
    // }
  
  }
  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

module.exports = {server,express,io,app,sleep, userLeave,getRoomLobbyUsers, getRoomUsers, joinRoom,arraymove, getKeyWithMinValue,defaultRolletValue,publicRoom, state, userSocketMap,tokenMiddleware, gameName}
 