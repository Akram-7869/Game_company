const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
const Player = require('../models/Player');
const User = require('../models/User');
const Transactions = require('../models/Transaction');
const Setting = require('../models/Setting');
const Dashboard = require('../models/Dashboard');
const axios = require('axios')
const admin = require('../utils/fiebase')



const { makeid } = require('../utils/utils');
// @desc      Register user
// @route     POST /api/v1/auth/register
// @access    Public
exports.playerRegister = asyncHandler(async (req, res, next) => {
  const { email, phone, deviceToken, countryCode, firebaseToken = '' } = req.body;

  if (!phone) {
    return next(
      new ErrorResponse(`select phone/email`)
    );
  }

  let player = await Player.findOne({ $or: [{ 'phone': phone }, { 'deviceToken': deviceToken }] }).select('+deviceToken');
  let vcode = Math.floor(1000 + Math.random() * 9000);
  const sms = await Setting.findOne({ type: 'SMSGATEWAY', name: 'MSG91' });

  if (player) {
    // if (player.email !== email) {
    //   return next(
    //     new ErrorResponse(`phone  number changed use the number registered first time`)
    //   );
    // } else if (player.deviceToken !== deviceToken) {
    //   return next(
    //     new ErrorResponse(`Device changed use the device registered first time`)
    //   );
    // } else {
    let fieldsToUpdate = {
      'verifyPhone': vcode,
      'verifyPhoneExpire': Date.now() + 10 * 60 * 1000,
      'firebaseToken': firebaseToken,
    }
    player = await Player.findByIdAndUpdate(player.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });
    // }


  } else {
    // create new player
    let data = {
      'email': email,

      'phone': phone,
      'verifyPhone': vcode,
      'verifyPhoneExpire': Date.now() + 10 * 60 * 1000,
      'deviceToken': deviceToken,
      // 'firebaseToken': firebaseToken,
      'status': 'notverified',
      'countryCode': countryCode,
      'refer_code': makeid(6),
    };
    // Create user
    player = await Player.create(data);
  }
  await smsOtp(phone, vcode, sms.one.TEMPLATE_ID, sms.one.AUTHKEY);
  //subscribeToTopic(firebaseToken);
  res.status(200).json({
    success: true,
    data: {}
  });

});

// @desc      Register user
// @route     POST /api/v1/auth/register
// @access    Public
exports.playerRegisterEmail = asyncHandler(async (req, res, next) => {
  const { email, phone, deviceToken, countryCode, firebaseToken = '' } = req.body;

  if (!email) {
    return next(
      new ErrorResponse(`select email`)
    );
  }

  let player = await Player.findOne({ $or: [{ 'email': email }, { 'deviceToken': deviceToken }] }).select('+deviceToken');
  let vcode = Math.floor(1000 + Math.random() * 9000);
  // const sms = await Setting.findOne({ type: 'SMSGATEWAY', name: 'MSG91' });

  if (player) {
    // if (player.email !== email) {
    //   return next(
    //     new ErrorResponse(`phone  number changed use the number registered first time`)
    //   );
    // } else if (player.deviceToken !== deviceToken) {
    //   return next(
    //     new ErrorResponse(`Device changed use the device registered first time`)
    //   );
    // } else {
    let fieldsToUpdate = {
      'verifyPhone': vcode,
      'verifyPhoneExpire': Date.now() + 10 * 60 * 1000,
      'firebaseToken': firebaseToken,
    }
    player = await Player.findByIdAndUpdate(player.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });
    // }


  } else {
    // create new player
    let data = {
      'email': email,

      'phone': phone,
      'verifyPhone': vcode,
      'verifyPhoneExpire': Date.now() + 10 * 60 * 1000,
      'deviceToken': deviceToken,
      // 'firebaseToken': firebaseToken,
      'status': 'notverified',
      'countryCode': countryCode,
      'refer_code': makeid(6),
    };
    // Create user
    player = await Player.create(data);
  }
  //await smsOtp(phone, vcode, sms.one.TEMPLATE_ID, sms.one.AUTHKEY);
  //subscribeToTopic(firebaseToken);
  sendTokenResponse(player, 200, res);


});
// @desc      Verify phone
// @route     POST /api/v1/auth/register
// @access    Public
exports.verifyPhoneCode = asyncHandler(async (req, res, next) => {
  if (!req.body.deviceToken || !req.body.deviceType || !req.body.code || !req.body.phone) {
    return next(
      new ErrorResponse(`Please provide all required data`)
    );
  }
  //resetPasswordExpire: { $gt: Date.now() }
  // console.log('verifyPhone-input', req.body)
  // await verifyOtp(req.body.phone, req.body.code).then(r=>{
  //   r.data.type
  // })
  let user = await Player.findOne({ phone: req.body.phone, verifyPhone: req.body.code });
  // console.log('verifyPhone', user)
  const addamount = 10;
  if (!user) {
    return next(
      new ErrorResponse(`Invalid Code`)
    );
  }

  if (user.status === 'notverified') {
    //all ok new user 
    let fieldsToUpdate = {
      deviceType: req.body.deviceType,
      deviceToken: req.body.deviceToken,
      verifyPhone: undefined,
      verifyPhoneExpire: undefined,
      status: 'active',
      $inc: { balance: addamount, deposit: addamount },
    }

    let tranData = {
      playerId: user._id,
      amount: addamount,
      transactionType: 'credit',
      note: 'player register',
      prevBalance: user.balance,
      status: 'complete', paymentStatus: 'SUCCESS'
    }
    let tran = await Transactions.create(tranData);
    user = await Player.findByIdAndUpdate(user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });
    let dash = await Dashboard.findOneAndUpdate({ type: 'dashboard' }, { $inc: { totalPlayers: 1 } });
    sendTokenResponse(user, 200, res);

  } else if (user.status === 'active') {
    // console.log('coustomer',s);
    sendTokenResponse(user, 200, res);

  } else {
    return next(new ErrorResponse(`User is inactive`));
  }

});
exports.playerLogin = asyncHandler(async (req, res, next) => {
  const { password, email } = req.body;

  if (!password || !email) {
    return next(new ErrorResponse('authentication faild'));
  }

  // Check for user
  const user = await Player.findOne({ email: email }).select('+password');
  if (!user) {
    return next(new ErrorResponse('email not registred'));
  }
  // Check if password matches
  const isMatch = user.matchPassword(password);
  // Check for user
  if (!isMatch) {
    return next(new ErrorResponse('authentication faild'));
  }
  sendTokenResponse(user, 200, res);

  // res.status(200).json({
  //   success: true,
  //   data: req.player
  // });

});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    //.cookie('token', token, options)
    .json({
      success: true,
      token,
      playerId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    });
};


// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  // Validate emil & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password'));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials'));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials'));
  }

  sendTokenResponse(user, 200, res);
});

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.logout = asyncHandler(async (req, res, next) => {

  res.status(200).json({
    success: true,
    data: {}
  });
});

let smsOtp = async (mobile, otp, template_id, authkey) => {

  var params = {
    template_id,
    mobile,
    authkey,
    otp
  };
  // console.error('sendingotp', otp, phone)
  return axios.get('https://api.msg91.com/api/v5/otp', { params }).catch(error => { console.error(error) });

}

// let verifyOtp = async (phone, otp) => {
//   var params = {
//     "template_id": "5f322d94d6fc051d202b4522",
//     "mobile": phone,
//     "authkey": "sms.one.AUTHKEY",
//     "otp": otp
//   };
//   return axios.get('https://api.msg91.com/api/v5/otp/verify', { params }).catch(error => { console.error(error) })

// }

// let resendOpt = async () => {
//   var params = {
//     //"template_id":"5f322d94d6fc051d202b4522",
//     "mobile": "919665300923",
//     "authkey": "sms.one.AUTHKEY",
//     //  "otp":otp,
//     "retrytype": "text"
//   };

//   axios.get('https://api.msg91.com/api/v5/otp/retry', { params })
//     .then(res => {
//       console.log(res)
//     })
//     .catch(error => {
//       console.error(error)
//     })

// }
// @desc      Forgot password
// @route     POST /api/v1/auth/forgotpassword
// @access    Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  let { phone, emale } = req.body;
  let user = await User.findOne({ 'phone': phone });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email'));
  }
  const sms = await Setting.findOne({ type: 'SMSGATEWAY', name: 'MSG91' });
  // Get reset token
  let vcode = Math.floor(1000 + Math.random() * 9000);
  let fieldsToUpdate = { resetPasswordToken: vcode };
  user = await User.findByIdAndUpdate(user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });
  // const resetToken = user.getResetPasswordToken();

  // await user.save({ validateBeforeSave: false });
  // user.resetPasswordToken = vcode;
  // // Create reset url
  // const resetUrl = `${req.protocol}://${req.get(
  //   'host'
  // )}/api/v1/auth/resetpassword/${resetToken}`;

  // const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  // try {
  //   await sendEmail({
  //     email: user.email,
  //     subject: 'Password reset token',
  //     message
  //   });

  //   res.status(200).json({ success: true, data: 'Email sent' });
  // } catch (err) {
  //   console.log(err);
  //   user.resetPasswordToken = undefined;
  //   user.resetPasswordExpire = undefined;

  //   await user.save({ validateBeforeSave: false });

  //   return next(new ErrorResponse('Email could not be sent', 500));
  // }
  let x = await smsOtp(phone, vcode, sms.one.TEMPLATE_ADMIN_PASS, sms.one.AUTHKEY);

  res.status(200).json({
    success: true,
    data: user
  });
});
// @desc      Reset password
// @route     POST /api/v1/auth/forgotpassword
// @access    Public
exports.resetPassword = asyncHandler(async (req, res, next) => {

  let { npassword, otp, phone } = req.body;
  let user = await User.findOne({ 'phone': phone });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email'));
  }
  if (user.resetPasswordToken != otp) {
    return next(new ErrorResponse('opt not matched'));
  }
  // Get reset token
  user.password = npassword;
  user.save();
  res.status(200).json({
    success: true,
    data: user
  });
});
