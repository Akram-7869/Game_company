const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const Player = require('../models/Player');
const Influencer = require('../models/Influencer');
const Franchise = require('../models/Franchise');
const User = require('../models/User');



var mongoose = require('mongoose');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
    // Set token from cookie
  } else if (req.cookies.token) {
     token = req.cookies.token;
   }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route'));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.role=decoded.role;
    switch (decoded.role) {
      case 'player':
        let x = res.app.get('site_setting')
        if (x.one.maintenance === 'on') {
          return next(new ErrorResponse('Site is in down', 503));
        }
        req.player = await Player.findById(decoded.id);
        if (req.player.status === 'banned') {
          return next(new ErrorResponse('Account is banned'));
        }

        break;
      case 'influencer':
        req.user = await Influencer.findById(decoded.id);
        if (req.user.status == 'inactive') {
          return next(new ErrorResponse('Account is' + req.user.status));
        }
        break;
      case 'franchise':
        req.user = await Franchise.findById(decoded.id);
        if (req.user.status == 'inactive') {
          return next(new ErrorResponse('Account is' + req.user.status));
        }
        break;


      default:
        req.staff = await User.findById(decoded.id);
        if (req.staff.status !== 'active') {
          return next(new ErrorResponse('Account is' + req.staff.status));
        }
        break;
    }


    next();
  } catch (err) {
    console.log(err);
    return next(new ErrorResponse('Not authorized to access this route'));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.role} is not authorized to access this route`
        )
      );
    }
    next();
  };
};

// Grant access to maintenance 
exports.maintenance_chk = (req, res, next) => {
  let x = res.app.get('site_setting')
  if (x.one.maintenance === 'on') {
    return next(new ErrorResponse('Site is in down', 503));
  }
  next();
};

// Grant header to maintenance 
exports.header_chk = (req, res, next) => {
  let { "x-app-name": appName } = req.headers;
  if (appName !== '1256') {
   // console.log('api-errro', appName);
    // return next(new ErrorResponse('', 200));
  }
  next();
};



