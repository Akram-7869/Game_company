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
    let user = { room, 'socket_id': socket.id,role:d.role, lobbyId:d.lobbyId };
    if(d.role ==='influencer'){
      socket['role'] = d.influencer;
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

  function getBotName(i){
    switch (i) {
      case 0:
        return 'easy';
        break;
        case 1:
          return 'medium';
        break;
        case 2:
          return 'hard';
        break;
    
      default:
        break;
    }
  }

module.exports = {getBotName, server,express,io,app,sleep, userLeave,getRoomLobbyUsers, getRoomUsers, joinRoom,arraymove, getKeyWithMinValue,defaultRolletValue,publicRoom, state, userSocketMap,tokenMiddleware, gameName}
 