const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../helper/errorResponse');
//const Player = require('../models/Player');
// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  // //console.log('auth',req.session);
  req.app.locals['role'] ='';
  if (!req.cookies.token) {
    console.log('auth-session-not-found');
    res.redirect(process.env.ADMIN_URL + '/login');
  } else {
    const decoded = jwt.decode(  req.cookies.token, { complete: true });
     req.role=decoded.payload.role;
     req.app.locals['role'] = decoded.payload.role;
    //decoded.payload.exp
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
