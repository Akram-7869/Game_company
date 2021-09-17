const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
//const ErrorResponse = require('../utils/errorResponse');
//const Player = require('../models/Player');
// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  // console.log('auth',req.session);
  if (!req.session.user) {
    res.redirect(process.env.ADMIN_URL + '/login');
  } else {
    next();
  }

});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
