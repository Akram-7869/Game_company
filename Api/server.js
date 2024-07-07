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



const app = express();
const server = http.createServer(app);
const io = socketio(server);
const Setting = require('./models/Setting');
const {publicRoom, userSocketMap} = require('./utils/JoinRoom');
const socket = require('./utils/socket').setupSocket(io);

const index = require('./routes/index');



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
app.use( index);
app.use(errorHandler);
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(err);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
