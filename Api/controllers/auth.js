//const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
//const sendEmail = require('../utils/sendEmail');
const Player = require('../models/Player');
const Influencer = require('../models/Influencer');
const Franchise = require('../models/Franchise');

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Setting = require('../models/Setting');
const Game = require('../models/Game');

const Dashboard = require('../models/Dashboard');
const axios = require('axios')
//const admin = require('../utils/fiebase')
const fs = require('fs');
var path = require('path');
const { makeid, setkey, getKey, generateName } = require('../utils/utils');
const { OAuth2Client } = require('google-auth-library');
const admin = require('firebase-admin');

exports.test = asyncHandler(async (req, res, next) => {

});

exports.verifyToken =  asyncHandler(async (req, res, next) => {
  let {countryCode, deviceToken} = req.body;
  const idToken = req.body.idToken;

  try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;  // User's unique ID
      const phone = decodedToken.phone_number;  // User's unique ID

      
  if (!phone) {
    return next(
      new ErrorResponse(`select phone`)
    );
  }

  let player = await Player.findOne({ 'phone': phone }).select('+deviceToken');
 
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
    
      'firebaseToken': idToken,
    }
    player = await Player.findByIdAndUpdate(player.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });
    // }


  } else {
    // create new player
    let data = {
      'email': `${phone}@cherry.com`,
      'firstName': generateName(),
      'phone': phone,
      'deviceToken': deviceToken,
      'firebaseToken': idToken,
      'registeredWith':'phone',
      'status': 'notverified',
      'countryCode': countryCode,
      'refer_code': makeid(6),
    };
    // Create user
    player = await Player.create(data);
  }
  res.status(200).json({
    success: true,
    data: {}
  });

      res.status(200).send({ uid });
  } catch (error) {
      console.error('Error verifying ID token:', error);
      res.status(401).send('Unauthorized');
  }
});

// @desc      Register user
// @route     POST /api/v1/auth/register
// @access    Public
exports.getByPhone = asyncHandler(async (req, res, next) => {
  res.status(200).json({});
  console.log('getByPhone');
  const { email, phone, deviceToken, countryCode, firebaseToken = '' } = req.query;
  if (!phone) {
    return next(
      new ErrorResponse(`select phone`)
    );
  }

  let player = await Player.findOne({ 'phone': phone, 'deviceToken': deviceToken });
  if (!player) {
    return next(
      new ErrorResponse(`Player not found`)
    );
  }
  res.status(200).json({
    success: true,
    data: player
  });

});

exports.getByEmail = asyncHandler(async (req, res, next) => {
  res.status(200).json({});
  console.log('getByEmail');
  const { email, phone, deviceToken, countryCode, firebaseToken = '' } = req.query;
  if (!email) {
    return next(
      new ErrorResponse(`select email`)
    );
  }

  let player = await Player.findOne({ 'email': email, 'deviceToken': deviceToken });
  if (!player) {
    return next(
      new ErrorResponse(`Player not found`)
    );
  }
  res.status(200).json({
    success: true,
    data: player
  });

});

// @desc      Register user
// @route     POST /api/v1/auth/register
// @access    Public
exports.playerRegister = asyncHandler(async (req, res, next) => {
  console.log('playerRegister');
  const { email, phone, deviceToken, countryCode, firebaseToken = '' } = req.body;

  if (!phone) {
    return next(
      new ErrorResponse(`select phone/email`)
    );
  }

  let player = await Player.findOne({ 'phone': phone }).select('+deviceToken');
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
      firstName: generateName(),
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
  await this.smsOtp(phone, vcode, sms.one.TEMPLATE_ID, sms.one.AUTHKEY);
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
  let { email, phone, deviceToken, countryCode, firebaseToken = '', picture = '', firstName = "", stateCode = '', stateName = '', latitude = 0, longitude = 0 } = req.body;
  //console.log(req.body);
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const client = new OAuth2Client(CLIENT_ID);

  if (!email) {
    return next(
      new ErrorResponse(`select email`)
    );
  }
  let ticket;
  let player = await Player.findOne({ 'email': email });
  if (player) {
    if (player.email !== email) {
      return next(
        new ErrorResponse(`This device is registered with another email ID`)
      );
    }
    // try {
    //   ticket = await client.verifyIdToken({
    //     idToken: firebaseToken,
    //     audience: CLIENT_ID,
    //   });

    // } catch (error) {

    //   return next(
    //     new ErrorResponse(`Unable to Rgister`)
    //   );
    // }

    console.log('playerRegisterEmail-existing');

    // if (player.deviceToken !== deviceToken) {
    //   return next(
    //     new ErrorResponse(`This device is registered with another email ID`)
    //   );
    // }

    let fieldsToUpdate = {
      'firebaseToken': firebaseToken,
      //'deviceToken': deviceToken, stateCode,
      stateName,
      longitude,
      latitude
    }
    player = await Player.findByIdAndUpdate(player.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

  } else {
    console.log('playerRegisterEmail-new');

    if (!firebaseToken) {
      return next(
        new ErrorResponse(`Registration  failed retry fb `)
      );
    }
    if (!deviceToken) {
      return next(
        new ErrorResponse(`Registration  failed retry token `)
      );
    }
    let playerdevice = await Player.findOne({ deviceToken: deviceToken }).lean().select({ _id: 1 });
    if (playerdevice) {
      return next(
        new ErrorResponse(`Mutiple account canot be created in one device`)
      );
    }

    try {
      ticket = await client.verifyIdToken({
        idToken: firebaseToken,
        audience: CLIENT_ID,
      });

    } catch (error) {

      return next(
        new ErrorResponse(`Unable to Rgister----` + error)
      );
    }

    let payload = ticket.getPayload();
    let userid = payload['sub'];
    email = payload['email'];
    firstName = payload['name'];
    picture = payload['picture'];

    // create new player
    let addamount = 10;
    let data = {
      firstName,
      'email': email,
      'picture': picture,
      'deviceToken': deviceToken,
      'firebaseToken': firebaseToken,
      'status': 'active',
      'countryCode': countryCode,
      'refer_code': makeid(6),
      'balance': addamount,
      'deposit': addamount,
      stateCode,
      stateName,
      longitude,
      latitude
    };
    // Create user
    player = await Player.create(data);
    let tranData = {
      playerId: player._id,
      amount: addamount,
      transactionType: 'credit',
      note: 'player register',
      prevBalance: 0, logType: 'deposit',
      status: 'complete', paymentStatus: 'SUCCESS',
      'stateCode': stateCode

    }
    let tran = await Transaction.create(tranData);

  }
  //await smsOtp(phone, vcode, sms.one.TEMPLATE_ID, sms.one.AUTHKEY);
  //subscribeToTopic(firebaseToken);
  sendTokenResponse(player, 200, res);
});


exports.webRegisterEmail = asyncHandler(async (req, res, next) => {
  let { id, email, phone, deviceToken, countryCode, firebaseToken = '', picture = '', firstName = "", stateCode = '', stateName = '', latitude = 0, longitude = 0, state } = req.body;
  console.log(req.body);


  if (!email || !state) {
    return next(
      new ErrorResponse(`select email`)
    );
  }
  let user;
  let displayName = '';
  if (state === 'influencer') {
    user = await Influencer.findOne({ 'email': email, role: state, googleid: id });
    displayName = generateName('IN');
  } else if (state === 'franchise') {
    user = await Franchise.findOne({ 'email': email, role: state, googleid: id });
    displayName = generateName('FR');
  }

  if (!user) {
    console.log('influencerRegisterEmail-new');
    email = req.body['email'];
    firstName = req.body['name'];
    picture = req.body['picture'];
    let googleid = req.body['id'];


    // create new influencer
    let addamount = 0;
    let data = {
      displayName: displayName,
      firstName,
      'email': email,
      'picture': picture,
      'googleid': googleid,
      'countryCode': countryCode,
      'refer_code': makeid(6),
      'balance': addamount,
      'deposit': addamount,
      stateCode,
      stateName,
      longitude,
      latitude
    };
    // Create user
    if (state === 'influencer') {
      user = await Influencer.create(data);
    } else if (state === 'franchise') {
      user = await Influencer.create(data);
    }
  }

  if (user) {
    console.log(user, 'user-token');
    sendTokenResponse(user, 200, res);
  }
});


exports.registerInfluencer = asyncHandler(async (req, res, next) => {
  let { password, email, phone, deviceToken, countryCode, firebaseToken = '', picture = '', firstName = "", stateCode = '', stateName = '', latitude = 0, longitude = 0, state } = req.body;
  console.log(req.body);


  if (!email) {
    return next(
      new ErrorResponse(`select email`)
    );
  }
  let user;
  let displayName = '';
  user = await Influencer.findOne({ 'email': email });
  if (!user) {
    console.log('influencerRegisterEmail-new');
    displayName = generateName('IN');

    email = req.body['email'];
    firstName = req.body['username'];
    // create new influencer
    let addamount = 0;
    let data = {
      displayName: displayName,
      firstName,
      'email': email,
      // 'picture': picture,
      // 'googleid': googleid,
      'countryCode': countryCode,
      'refer_code': makeid(6),
      'balance': addamount,
      'deposit': addamount,
      stateCode,
      stateName,
      longitude,
      latitude,
      password
    };
    // Create user
    user = await Influencer.create(data);
    sendTokenResponse(user, 200, res);
  }
});

// @desc      Verify phone
// @route     POST /api/v1/auth/register
// @access    Public
exports.verifyPhoneCode = asyncHandler(async (req, res, next) => {
  let { phone, code } = req.body;
  if (!code || !phone) {
    return next(
      new ErrorResponse(`Please provide all required data`)
    );
  }
  //resetPasswordExpire: { $gt: Date.now() }
  // console.log('verifyPhone-input', req.body)
  // await verifyOtp(req.body.phone, req.body.code).then(r=>{
  //   r.data.type
  // })
  let player = await Player.findOne({ 'phone': phone, verifyPhone: code });

  if (!player) {
    return next(
      new ErrorResponse(`Invalid Code`)
    );
  }

  let addamount = 10;
  let tranData = {
    playerId: player._id,
    amount: addamount,
    transactionType: 'credit',
    note: 'player register',
    prevBalance: 0, logType: 'deposit',
    status: 'complete', paymentStatus: 'SUCCESS'
  }
  let tran = await Transaction.create(tranData);
  if (player.status === 'notverified') {
    player = await Player.findByIdAndUpdate(player.id, {
      'balance': addamount,
      'deposit': addamount, 'phoneStatus': 'verified', phone, 'status': 'active', verifyPhone: undefined, verifyPhoneExpire: undefined
    }, {
      new: true,
      runValidators: true
    });
  } else {
    player = await Player.findByIdAndUpdate(player.id, {
      'phoneStatus': 'verified', phone, 'status': 'active', verifyPhone: undefined, verifyPhoneExpire: undefined
    }, {
      new: true,
      runValidators: true
    });
  }

  sendTokenResponse(player, 200, res);
  // res.status(200).json({
  //   success: true,
  //   data: player
  // });

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
  let d = {
    success: true,
    token,
    playerId: user._id,
    role: user.role,
    firstName: user.firstName,
    displayName: user.displayName,
    lastName: user.lastName,
    email: user.email
  }
  res
    .status(statusCode)
    //.cookie('token', token, options)
    .json(d);
};


// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password, role } = req.body;
  // Validate emil & password
  if (!email || !password || !role) {
    return next(new ErrorResponse('Please provide an email and password'));
  }

  // Check for user
  let user;
  switch (role) {
    case 'influencer':
      user = await Influencer.findOne({ email }).select('+password');
      break;
    case 'franchise':
      user = await Franchise.findOne({ email }).select('+password');
      break;
    case 'admin':
      user = await User.findOne({ email }).select('+password');
      break;
  }
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
// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private





exports.maintanance = asyncHandler(async (req, res, next) => {
  let bot_profile = getKey('bot_profile');
  let default_profile = getKey('default_profile');
  let setting = getKey('site_setting');
  let games = getKey('games');
  if (!bot_profile) {
    bot_profile = [];
    let filename = '/img/profile-picture/';
    let filePath = path.resolve(__dirname, '../../assets/' + filename);
    let pathurl = process.env.IMAGE_URL + filename;
    //console.log(filePath);
    fs.readdirSync(filePath).forEach(file => {
      bot_profile.push(pathurl + file);
    });
    setkey('bot_profile', bot_profile);
  }
  if (!default_profile) {
    default_profile = [];
    let filename = '/img/player/profile_pic/';
    let filePath = path.resolve(__dirname, '../../assets/' + filename);
    let pathurl = process.env.IMAGE_URL + filename;
    //console.log(filePath);
    fs.readdirSync(filePath).forEach(file => {
      default_profile.push(pathurl + file);
    });
    setkey('default_profile', default_profile);
  }
  if (!setting) {
    setting = await Setting.findOne({
      type: 'SITE',
    });
    setkey('site_setting', setting)
  }



  if (!games) {
    games = await Game.find({
      status: 'active',
    });
    setkey('games', games)

  }


  const values = await Setting.findOne({ type: 'SITE' }).select('one');
const dollor_value = values?.one?.dollor_value || null;
const rupees_value = values?.one?.rupees_value || null;

  console.log('Fetched values:', values);

  res.status(200).json({
    success: true,
    data: { bot_profile,default_profile, adminCommision: setting.commission, mindeposit: setting.mindeposit, games ,  dollor_value,
      rupees_value }
  });
});


exports.smsOtp = async (mobile, otp, template_id, authkey) => {

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
