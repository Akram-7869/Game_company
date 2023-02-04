const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');

const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

// Route files
const auth = require('./routes/auth');
const players = require('./routes/players');
const settings = require('./routes/settings');
const transactions = require('./routes/transactions');
const payments = require('./routes/payments');
const managers = require('./routes/users');
const bots = require('./routes/bots');
const versions = require('./routes/versions');
//const files = require('./routes/files');
const banners = require('./routes/banners');
//const tickets = require('./routes/tickets');
const notifications = require('./routes/notifications');
const game = require('./routes/game');
const dashboards = require('./routes/dashboard');
const tournaments = require('./routes/tournament');
const coupon = require('./routes/coupon');
const polls = require('./routes/polls');
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const Setting = require('./models/Setting');
const PlayerGame = require('./models/PlayerGame');
// Body parser
app.use(express.json());

app.use(express.urlencoded({
  extended: true
}))
// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  require('mongoose').set('debug', true);
  app.use(morgan('dev'));
}

// File uploading
app.use(fileupload({
  createParentPath: true
}));

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100
});
//app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(cors());
// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

app.use(async (req, res, next) => {
  req.io = io;
  if (!app.get('site_setting')) {
    // console.log('site setting');
    const setting = await Setting.findOne({
      type: 'SITE',
    });
    app.set('site_setting', setting);
  }
  return next();
});

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/players', players);
app.use('/api/v1/settings', settings);
app.use('/api/v1/transactions', transactions);
app.use('/api/v1/managers', managers);
app.use('/api/v1/versions', versions);
app.use('/api/v1/bots', bots);
//app.use('/api/v1/tickets', tickets);
app.use('/api/v1/payments', payments);
//app.use('/api/v1/files', files);
app.use('/api/v1/notifications', notifications);
app.use('/api/v1/banners', banners);
app.use('/api/v1/games', game);
app.use('/api/v1/dashboards', dashboards);
app.use('/api/v1/tournaments', tournaments);
app.use('/api/v1/coupon', coupon);
app.use('/api/v1/polls', polls);

app.get('/api/v1/so', function (req, res, next) {
  res.json({ state, publicRoom });
})
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const { makeid } = require('./utils/utils');
const Tournament = require('./models/Tournament');
const Player = require('./models/Player');
const state = {};
const publicRoom = {};
io.use(function (socket, next) {
  // execute some code
  next();
})
// Run when client connects
io.on('connection', socket => {
  // let data = { status: 'connected' };
  // socket.emit('res', { ev: 'connected', data });
  console.log('contedt');
  //socket.join('notification_channel');

  socket.on('join', async (d) => {
    let dataParsed = d;// JSON.parse(d);
    let { userId, lobbyId, maxp = 4 } = dataParsed;
    let lobby = await Tournament.findById(lobbyId);
    if (!lobby) {
      console.log('looby-not-found');
      return;
    }

    let player = await Player.findOne({ _id: userId, 'status': 'active', 'deposit': { $gte: lobby.betAmount } });
    if (!player) {
      console.log('player-not-found');
      return;
    }
    let roomName = '';
    if (publicRoom[lobbyId] && publicRoom[lobbyId]['playerCount'] < maxp && !publicRoom[lobbyId]['played']) {
      roomName = publicRoom[lobbyId]['roomName'];
      await PlayerGame.findOneAndUpdate({ 'gameId': roomName, 'tournamentId': lobbyId }, { opponentId: userId, playerCount: 2 });
      console.log('join-exisitng', roomName);
    } else {
      roomName = makeid(5);
      publicRoom[lobbyId] = { roomName, playerCount: 0, played: false }
      state[roomName] = { 'created': Date.now() + 600000, players: [] };
      console.log('create-room-', roomName);
      await PlayerGame.create({ playerId: userId, 'gameId': roomName, 'tournamentId': lobbyId, playerCount: 1, gameData: {}, WinList: {} });
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
  //leave
  socket.on('leave', (d) => {
    let { room, userId } = d;

    userLeave(socket);
    socket.leave(room);
    let data = {
      room: room, userId,
      users: getRoomUsers(room)
    };
    console.log('leave-', d);
    io.to(room).emit('res', { ev: 'leave', data });
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {

    let { room, userId, lobbyId } = socket;

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

    let { room, lobbyId, userId } = d;
    let data = {
      room: room,
      users: getRoomLobbyUsers(room, lobbyId),
      lobbyId,
      userId: userId
    };
    //start game Withb boat
    if (publicRoom[lobbyId]) {
      let rn = publicRoom[lobbyId]['roomName'];
      if (rn == room || data.users.length == 2) {
        publicRoom[lobbyId]['played'] = true;
      }

    }
    console.log('gameStart-', d);
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
});


function arraymove(arr, fromIndex, toIndex) {
  arr.unshift(arr.pop());

}



let joinRoom = (socket, playerId, room, d = {}) => {
  //console.log('join room', socket.id, playerId, room);
  socket['room'] = room;
  socket['userId'] = playerId;
  socket['lobbyId'] = d.lobbyId;
  let index = -1;
  if (state[room]) {
    index = state[room].players.findIndex(user => user.userId === playerId);
    //console.log('i-', index);
    if (index === -1 && d.lobbyId === d.lobbyId) {
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
  if (state[s.room] && state[s.room].players.length !== 0) {
    //delete state[s.room].players[s.userId];
    const index = state[s.room].players.findIndex(user => user.userId === s.userId);

    if (index !== -1) {
      state[s.room].players.splice(index, 1)[0];
    }
  }

  // for (let r in state) {
  //   if (state[r]['created'] < Date.now()) {
  //     console.log('del-old');
  //     delete state[r];
  //   }
  // }
  //remove lobby 
  for (let l in publicRoom) {
    if (publicRoom[l]['roomName']) {
      let rn = publicRoom[l]['roomName'];
      if (!state[rn]) {
        delete publicRoom[l];
      }
    }
  }

}
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(err);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
