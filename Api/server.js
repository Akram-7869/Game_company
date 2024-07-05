const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');

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
const gamemanager = require('./routes/gameManager');
const bannertext = require('./routes/bannertext');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const Setting = require('./models/Setting');
const PlayerGame = require('./models/PlayerGame');

// Body parser
app.use(express.json({ limit: '50mb' }));

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
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 },
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
  req.publicRoom = publicRoom;
  req.userSocketMap = userSocketMap;
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
app.use('/api/v1/gamemanager', gamemanager);
app.use('/api/v1/bannertext', bannertext);

app.get('/api/v1/so', function (req, res, next) {
  console.log(state);
  res.json({ state, publicRoom, userSocketMap });
})
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const { makeid } = require('./utils/utils');
const Tournament = require('./models/Tournament');
const Player = require('./models/Player');
const TambolaGame = require('./utils/tomblagame'); // Import TambolaGenerator

const state = {};
const publicRoom = {};
const userSocketMap = {};
let gameName = {
  'ludo': 1,
  'dragon_tiger': 2,
  'teen_patti': 3,
  'rouletee': 4,
  'tambola': 5,
  'crash': 6,
}
// Tambola generator instance
io.use(function (socket, next) {
  const { tkn } = socket.handshake.query;
  console.log('c', tkn);
  if (tkn !== '2873') {
    // return next(new Error(''));
  }
  // execute some code
  next();
})
// Run when client connects
io.on('connection', socket => {
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

    let player = await Player.findOne({ _id: userId, 'status': 'active', 'balance': { $gte: lobby.betAmount } });
    if (!player) {
      console.log('player-not-found');
      return;
    }
    let roomName = '';
    
    if (publicRoom[lobbyId] && publicRoom[lobbyId]['playerCount'] < maxp && !publicRoom[lobbyId]['played']) {
      roomName = publicRoom[lobbyId]['roomName'];
      //  await PlayerGame.findOneAndUpdate({ 'gameId': roomName, 'tournamentId': lobbyId }, { opponentId: userId, playerCount: 2 });
      console.log('join-exisitng', roomName);
    } else {
      roomName = makeid(5);
      publicRoom[lobbyId] = { roomName, playerCount: 0, played: false }
      state[roomName] = { 'created': Date.now() + 600000, players: [], betList: [], status: 'open', codeObj:null };
      console.log('create-room-', roomName);
      //   await PlayerGame.create({ playerId: userId, 'gameId': roomName, 'tournamentId': lobbyId, playerCount: 1, gameData: {}, WinList: {} });
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
    if (lobby.mode === gameName.tambola) {
      state[roomName]['codeObj'] = new TambolaGame(io, roomName);
      state[roomName]['codeObj'].players[socket.id] = {  roomName };
      state[roomName]['codeObj'].start();

    //  tambolaGame.handleTambolaStart(roomName,socket);
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
socket.on('setBetData', (d) => {
  let { room, betNo, amount, action = 'bet', manyBet = '[]' } = d; //JSON.parse(d);
  console.log('setBetData', d);
  amount = parseInt(amount)
  if (state[room] && betNo <= 36 && amount > 0) {
    if (action === 'bet') {
      state[room]['betList'][betNo] = amount + parseInt(state[room]['betList'][betNo]);
    } else if (action === 'unbet' && state[room]['betList'][betNo] > 0) {
      let x = parseInt(state[room]['betList'][betNo]) - amount;
      state[room]['betList'][betNo] = x < 0 ? 0 : x;
    }

  } else if (betNo > 36 && amount > 0) {
    const betArray = JSON.parse(manyBet);
    let amountMany = amount / manyBet.length;
    if (action === 'bet') {
      for (const id of betArray) {
        state[room]['betList'][id] = amountMany + parseInt(state[room]['betList'][id]);
      }
    } else if (action === 'unbet') {
      for (const id of betArray) {
        if (state[room]['betList'][id] > 0) {
          let x = parseInt(state[room]['betList'][id]) - amountMany;
          state[room]['betList'][id] = x < 0 ? 0 : x;
        }


      }
    }
  }

});
socket.on('getBetData', (d) => {
  let { room } = d; //JSON.parse(d);
  console.log('getBetData', room);
  if (state[room]) {
    let data = { room: room, betWin: getKeyWithMinValue(state[room]['betList']) }
    console.log('getBetData', data);
    io.in(room).emit('res', { ev: 'getBetData', data });
    state[room]['betList'] = defaultRolletValue();
  }
});

});


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
  if(!userSocketMap[playerId]){
     userSocketMap[playerId]={room,'socket_id':socket.id};
  }else{
    let currentroom = userSocketMap[playerId]['room'];
      userSocketMap[playerId]={room,'socket_id':socket.id};

    if( currentroom && currentroom != room ){
      console.log('leaveling-from-server', currentroom, room);
      socket.leave(currentroom);
     }
  }
  d['socket_id']=socket.id;
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
  if (state[s.room] && state[s.room].players.length !== -1) {
    //delete state[s.room].players[s.userId];
    const index = state[s.room].players.findIndex(user => user.userId === s.userId);
    if (index !== -1) {
      state[s.room].players.splice(index, 1);
    }
    if(userSocketMap[s.userId]){
      userSocketMap[s.userId]['room']=null;
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
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(err);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
