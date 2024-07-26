

const { makeid } = require('../utils/utils');
const Player = require('../models/Player');


const { state, publicRoom, userSocketMap, tokenMiddleware, gameName, sleep, userLeave, getRoomLobbyUsers, getRoomUsers, joinRoom, arraymove, getKeyWithMinValue, defaultRolletValue } = require('./JoinRoom');
const Tournament = require('../models/Tournament');
const TambolaGame = require('../game/tomblagame');
const DragonTigerGame = require('../game/dragontiger');
const AviatorGame = require('../game/aviator');
const RolletGame = require('../game/rollet');
const TeenpattiGame = require('../game/teenpatti');


let io;

let onConnection = (socket) => {
  console.log('contedt', socket.id);
  //socket.join('notification_channel');
  socket.on('associateUserId', (d) => {
    let dataParsed = d;// JSON.parse(d);
    let { userId } = dataParsed;
    // Store the mapping in the userSocketMap
    userSocketMap[userId]['socket_id'] = socket.id;
  });
  socket.on('join', async (d) => {
    console.log('join', d);
    let dataParsed = d;// JSON.parse(d);
    let { userId, lobbyId, maxp = 4 } = dataParsed;
    let lobby = await Tournament.findById(lobbyId);
    if (!lobby) {
      console.log('looby-not-found');
      return;
    }

    let roomName = '';

    if (publicRoom[lobbyId] && publicRoom[lobbyId]['playerCount'] < maxp && !publicRoom[lobbyId]['played']) {
      roomName = publicRoom[lobbyId]['roomName'];
      console.log('join-exisitng', roomName);
    } else {
      roomName = makeid(5);
      publicRoom[lobbyId] = { roomName, playerCount: 0, played: false }
      state[roomName] = { 'created': Date.now() + 600000, players: [], betList: [], status: 'open', codeObj: null };
      console.log('create-room-', roomName);
    }

    if (userSocketMap[userId]) {
      const playerRoom = userSocketMap[userId].room;
      console.log(playerRoom, roomName, userSocketMap);
      if (playerRoom === roomName) {
        console.log('not registering');
        socket.emit('joinRoomError', { message: 'You are already in this room' });

        return;
      } else {
        socket.leave(playerRoom);
        userLeave({ userId, room: playerRoom })
      }
    }

    // console.log('room', roomName);
    joinRoom(socket, userId, roomName, dataParsed);
    socket.join(roomName);

    let data = {
      roomName, users: getRoomLobbyUsers(roomName, lobbyId),
      userId: userId,
      gameData: state[roomName]['gameData'],
      WinList: state[roomName]['WinList'],
    }
    if (state[roomName]) {
      publicRoom[lobbyId]['playerCount'] = state[roomName].players.length;
      // if (data.users.length == maxp || data.users.length == 0) {
      //   delete publicRoom[lobbyId];
      // }
    } else {
      // delete publicRoom[lobbyId];
    }
    io.to(roomName).emit('res', { ev: 'join', data });
    io.emit('res', { ev: 'lobbyStat', lobbyId, 'total': publicRoom[lobbyId]['total'], 'count': publicRoom[lobbyId]['count'] });
    switch (lobby.mode) {
      case gameName.tambola:
        if (!state[roomName]['codeObj']) {
          state[roomName]['codeObj'] = new TambolaGame(io, roomName);
          state[roomName]['codeObj'].updatePlayers(state[roomName].players);

          state[roomName]['codeObj'].startGame();
          state[roomName]['codeObj'].syncPlayer(socket.id, d);
        } else {
          state[roomName]['codeObj'].updatePlayers(state[roomName].players);
          state[roomName]['codeObj'].syncPlayer(socket, d);
        }
        break;
      case gameName.dragon_tiger:
        if (!state[roomName]['codeObj']) {
          state[roomName]['codeObj'] = new DragonTigerGame(roomName, io);
          state[roomName]['codeObj'].updatePlayers(state[roomName].players);

          state[roomName]['codeObj'].startGame();
          state[roomName]['codeObj'].syncPlayer(socket, d);
        } else {
          state[roomName]['codeObj'].updatePlayers(state[roomName].players);
          state[roomName]['codeObj'].syncPlayer(socket, d);
        }
        break;
      case gameName.crash:
        if (!state[roomName]['codeObj']) {
          state[roomName]['codeObj'] = new AviatorGame(roomName, io);
          state[roomName]['codeObj'].updatePlayers(state[roomName].players);

          state[roomName]['codeObj'].startGame();
          state[roomName]['codeObj'].syncPlayer(socket, d);
        } else {
          state[roomName]['codeObj'].updatePlayers(state[roomName].players);
          state[roomName]['codeObj'].syncPlayer(socket, d);
        }
        break;
      case gameName.rouletee:
        if (!state[roomName]['codeObj']) {
          state[roomName]['codeObj'] = new RolletGame(roomName, io);
          state[roomName]['codeObj'].updatePlayers(state[roomName].players);

          state[roomName]['codeObj'].startGame();
          state[roomName]['codeObj'].syncPlayer(socket, d);
        } else {
          state[roomName]['codeObj'].updatePlayers(state[roomName].players);
          state[roomName]['codeObj'].syncPlayer(socket, d);
        }
        break;
      case gameName.teen_patti:
        if (!state[roomName]['codeObj']) {
          state[roomName]['codeObj'] = new TeenpattiGame(roomName, io);
          state[roomName]['codeObj'].updatePlayers(state[roomName].players);

          state[roomName]['codeObj'].startGame();
          state[roomName]['codeObj'].syncPlayer(socket, d);
        } else {
          state[roomName]['codeObj'].updatePlayers(state[roomName].players);
          state[roomName]['codeObj'].syncPlayer(socket, d);
        }
        break;
    }

  });

  socket.on('lobbyStat', (d) => {
    let { userId, lobbyId } = d;//JSON.parse(d);
    let cnt = 0;
    let total = 0;
    if (publicRoom[lobbyId]) {
      let rn = publicRoom[lobbyId]['roomName'];
      if (state[rn]) {
        cnt = publicRoom[lobbyId]['count'] = state[rn].players.length;
      }
    }
    io.emit('res', {
      ev: 'lobbyStat', lobbyId, 'total': total, 'count': cnt
    });

  });
  socket.on('sendToRoom', (d) => {

    let { room, ev, data } = d;//JSON.parse(d);
    console.log('sendToRoom', data)
    io.to(room).emit('res', { ev, data });

  });

  socket.on('setGameId', async (d) => {
    let { room, lobbyId } = d;//JSON.parse(d);
    if (state[room]) {
      state[room]['betList'] = defaultRolletValue();
    }

    let data = {
      gameId: makeid(5),
      lobbyId
    }
    console.log('setGameId', data);
    io.in(room).emit('res', { ev: 'setGameId', data });

  });
  //leave
  socket.on('leave', (d) => {
    let { room, userId } = d;

    userLeave(d);
    socket.leave(room);
    let data = {
      room: room, userId,
      users: getRoomUsers(room)
    };
    console.log('leave-', d, data);
    io.to(room).emit('res', { ev: 'leave', data });
  });
  //chat_message
  socket.on('chat_message', (d) => {
    let { room } = d;
    socket.to(room).emit('chat_message', d);
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {

    let { room, userId, lobbyId } = socket;
    delete userSocketMap[userId];

    userLeave(socket);
    //console.log('disconnect-inputstring');
    let data = {
      room: room,
      users: getRoomUsers(room),
      userId: userId
    };

    console.log('disconnect-', room, userId, lobbyId);

    io.to(socket.room).emit('res', { ev: 'disconnect', data });

  });
  // Runs when client disconnects
  socket.on('gameStart', async (d) => {

    let { room = '', lobbyId = '', userId = '' } = d;
    console.log('gameStart-', d);

    let data = {
      room: room,
      users: getRoomLobbyUsers(room, lobbyId),
      lobbyId,
      userId: userId
    };
    //start game Withb boat
    if (publicRoom[lobbyId]) {
      let rn = publicRoom[lobbyId]['roomName'];
      if (rn == room) {
        publicRoom[lobbyId]['played'] = true;
      }

    }
    io.to(socket.room).emit('res', { ev: 'gameStart', data });

  });
  //move user
  socket.on('moveuser', (d) => {

    let { room, userId, action } = d; //JSON.parse(d);
    if (state[room]) {

      const index = state[room].players.findIndex(user => user.userId === userId);
      let toIndex
      if (action === 'win') {
        toIndex = index - 1;
      } else {
        toIndex = index + 1
      }
      arraymove(state[room].players, index, 1);

    }



    let data = {
      room: room,
      users: getRoomUsers(room)
    };
    io.to(room).emit('res', { ev: 'moveuser', data });
  });
  //set game state 
  socket.on('setGameData', (d) => {

    let { room, gameData } = d; //JSON.parse(d);
    let data = {
      room: room, gameData: {}
    }
    if (state[room]) {

      state[room]['gameData'] = gameData;
      data['gameData'] = gameData;
    }

    console.log('setGameData', data);
    io.to(room).emit('res', { ev: 'setGameData', data });
  });
  socket.on('setWinListData', (d) => {

    let { room, WinList } = d; //JSON.parse(d);
    let data = { room: room, WinList: {} }
    if (state[room]) {
      state[room]['WinList'] = WinList;
      data['WinList'] = d;
    }

    console.log('setWinListData', data);
    io.to(room).emit('res', { ev: 'setWinListData', data });
  });


};


const setupSocket = (ioInstance) => {
  io = ioInstance;
  io.use(tokenMiddleware);
  io.on('connection', onConnection);
};
module.exports = { setupSocket };