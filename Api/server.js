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
//const notifications = require('./routes/notifications');
const game = require('./routes/game');
const dashboards = require('./routes/dashboard');
const tournaments = require('./routes/tournament');
const coupon = require('./routes/coupon');
const polls = require('./routes/polls');
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const Setting = require('./models/Setting');

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
console.log('92');
app.use(async (req, res, next) => {
  console.log('93');
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
app.use('/api/v2/auth', auth);
app.use('/api/v2/players', players);
app.use('/api/v2/settings', settings);
app.use('/api/v2/transactions', transactions);
app.use('/api/v2/managers', managers);
app.use('/api/v2/versions', versions);
app.use('/api/v2/bots', bots);
//app.use('/api/v2/tickets', tickets);
app.use('/api/v2/payments', payments);
//app.use('/api/v2/files', files);
//app.use('/api/v2/notifications', notifications);
app.use('/api/v2/banners', banners);
app.use('/api/v2/games', game);
app.use('/api/v2/dashboards', dashboards);
app.use('/api/v2/tournaments', tournaments);
app.use('/api/v2/coupon', coupon);
app.use('/api/v2/polls', polls);

app.get('/api/v2/so', function (req, res, next) {
  // res.json({ state, publicRoom });
})
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const { makeid } = require('./utils/utils');
const state = {};
const publicRoom = {};

// Run when client connects
io.on('connection', socket => {
  // let data = { status: 'connected' };
  // socket.emit('res', { ev: 'connected', data });
  console.log('contedt');
  //socket.join('notification_channel');

  socket.on('join', (d) => {
    let dataParsed = d;// JSON.parse(d);
    let { userId, lobbyId, maxp = 4 } = dataParsed;


    let roomName = '';
    if (publicRoom[lobbyId] && publicRoom[lobbyId]['playerCount'] < maxp && !publicRoom[lobbyId]['played']) {
      roomName = publicRoom[lobbyId]['roomName'];
      console.log('existing-');
    } else {
      roomName = makeid(5);
      console.log('new-');
      publicRoom[lobbyId] = { roomName, playerCount: 0, played: false }
      state[roomName] = { full: 0, players: [] };
    }
    // console.log('room', roomName);
    joinRoom(socket, userId, roomName, dataParsed);
    socket.join(roomName);

    let data = {
      roomName, users: getRoomUsers(roomName),
      userId: userId
    }
    if (state[roomName]) {
      publicRoom[lobbyId]['playerCount'] = state[roomName].players.length;
      if (data.users.length == maxp || data.users.length == 0) {
        delete publicRoom[lobbyId];
      }
    } else {
      delete publicRoom[lobbyId];
    }
    io.to(roomName).emit('res', { ev: 'join', data });
  });


  socket.on('sendToRoom', (d) => {
    console.log('sendToRoom');

    let { room, ev, data } = d;//JSON.parse(d);
    //console.log('sendToRoom', ev);
    io.to(room).emit('res', { ev, data });

  });
  //leave
  socket.on('leave', (d) => {
    console.log('leave');
    let { room } = d;
    userLeave(socket);
    socket.leave(room);

    let data = {
      room: room,
      users: getRoomUsers(room)
    };
    io.to(room).emit('res', { ev: 'leave', data });
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {

    let { room, userId } = socket;
    console.log('disconnect-');
    userLeave(socket);
    //console.log('disconnect-inputstring');
    let data = {
      room: room,
      users: getRoomUsers(room),
      userId: userId
    };
    io.to(socket.room).emit('res', { ev: 'disconnect', data });

  });
  // Runs when client disconnects
  socket.on('gameStart', (d) => {
    console.log('gameStart-');
    let { room, lobbyId } = d;

    if (publicRoom[lobbyId]) {
      let rn = publicRoom[lobbyId]['roomName'];
      if (rn == room) {
        publicRoom[lobbyId]['played'] = true;
      }

    }
    //remove empty 
    for (let r in state) {
      if (state[r]['players'].length === 0) {
        delete state[r];
      }
    }
    //remove 
    for (let l in publicRoom) {
      if (publicRoom[l]['roomName']) {
        let rn = publicRoom[l]['roomName'];
        if (!state[rn] || state[rn]['players'].length === 0) {
          delete publicRoom[l];
        }
      }
    }
    // if (publicRoom[socket['lobbyId']]['roomName'] == room) {
    //   publicRoom[socket['lobbyId']]['roomName'] = '';
    //   publicRoom[socket['lobbyId']]['playerCount'] = 0;
    // }
    let data = {
      room: room
    };
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
});

function arraymove(arr, fromIndex, toIndex) {
  arr.unshift(arr.pop());

}



let joinRoom = (socket, palyerId, room, d = {}) => {
  //console.log('join room', socket.id, palyerId, room);
  socket['room'] = room;
  socket['userId'] = palyerId;
  socket['lobbyId'] = d.lobbyId;
  let index = -1;
  if (state[room]) {
    index = state[room].players.findIndex(user => user.userId === palyerId);
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
let userLeave = (s) => {
  if (state[s.room] && state[s.room].players.length !== 0) {
    //delete state[s.room].players[s.userId];
    const index = state[s.room].players.findIndex(user => user.userId === s.userId);

    if (index !== -1) {
      state[s.room].players.splice(index, 1)[0];
    }
  }

}
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
