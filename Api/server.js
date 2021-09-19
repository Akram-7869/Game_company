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
const files = require('./routes/files');
const banners = require('./routes/banners');
const tickets = require('./routes/tickets');
const notifications = require('./routes/notifications');
const game = require('./routes/game');
const dashboards = require('./routes/dashboard');
const tournaments = require('./routes/tournament');

const formatMessage = require('./utils/messages');
// const {
//   userJoin,
//   getCurrentUser,
//   userLeave,
//   getRoomUsers
// } = require('./utils/users');
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Body parser
app.use(express.json());

app.use(express.urlencoded({
  extended: true
}))
// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// File uploading
app.use(fileupload());

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
//app.use(xss());

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

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/players', players);
app.use('/api/v1/settings', settings);
app.use('/api/v1/transactions', transactions);
app.use('/api/v1/managers', managers);
app.use('/api/v1/versions', versions);
app.use('/api/v1/bots', bots);
app.use('/api/v1/tickets', tickets);
app.use('/api/v1/payments', payments);
app.use('/api/v1/files', files);
app.use('/api/v1/notifications', notifications);
app.use('/api/v1/banners', banners);
app.use('/api/v1/games', game);
app.use('/api/v1/dashboards', dashboards);
app.use('/api/v1/tournaments', tournaments);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// const server = app.listen(
//   PORT,
//   console.log(
//     `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
//   )
// );


const { makeid } = require('./utils/utils');

const state = {};

// Run when client connects
io.on('connection', socket => {
  let data = { status: 'connected' };
  socket.emit('res', { ev: 'connected', data });
  console.log('contedt');

  socket.on('createRoom', ({ userId }) => {
    let roomName = makeid(5);
    let data = { roomName }
    state[roomName] = initRoom();
    joinRoom(socket, userId, roomName);

    socket.emit('res', { ev: 'roomCode', data });
    // const user = userJoin(socket.id, userId, roomName);
    socket.join(roomName);
    console.dir(state);

  });
  socket.on('join', ({ userId }) => {

    let roomName = makeid(5);
    let data = { roomName }

    socket.room = roomName;
    socket.userId = userId;
    socket.emit('res', { ev: 'roomCode', data });
    const user = userJoin(socket.id, userId, roomName);
    socket.join(roomName);

  });
  socket.on('joinFriend', ({ userId, room }) => {
    socket.room = room;
    socket.userId = userId;
    joinRoom(socket, userId, room);
    socket.join(room);


    let data = {
      room: room,
      users: getRoomUsers(room)
    };
    // Send users and room info
    io.to(room).emit('res', { ev: 'joinFriend', data });
  });

  socket.on('sendToRoom', ({ room, ev, data }) => {
    io.to(room).emit('res', { ev, data });
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    userLeave(socket);

    let data = {
      room: socket.room,
      users: getRoomUsers(socket.room)
    };
    console.dir(state);
    io.to(socket.room).emit('res', { ev: 'disconnect', data });

  });
});


let initRoom = () => {
  const t = {
    full: 0,
    players: {}
  }
  return t;
}

let joinRoom = (socket, palyerId, room) => {
  socket.room = room;
  socket.userId = palyerId;
  state[room].players[palyerId] = 1
}
let getRoomUsers = (room) => {
  return Object.keys(state[room].players);
}
let userLeave = (s) => {
  if (state[s.room].players[s.userId]) {
    delete state[s.room].players[s.userId];
  }

}
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
