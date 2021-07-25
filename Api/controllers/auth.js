 const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
const Player = require('../models/Player');
const User = require('../models/User');
//const Lookup = require('../models/Lookup');
const Transactions = require('../models/Transaction');
const axios = require('axios')

// @desc      Register user
// @route     POST /api/v1/auth/register
// @access    Public
exports.playerRegister = asyncHandler(async (req, res, next) => {
  const { phone , deviceToken, countryCode} = req.body;

  let player = await Player.findOne({$or:[{ 'phone': phone },{ 'deviceToken': deviceToken }]}).select('+deviceToken');
 let vcode = Math.floor(1000 + Math.random() * 9000);
  
  if (player) {
    if(player.deviceToken !== deviceToken  ){
        return next(
          new ErrorResponse(` device number `, 400)
        );
    }else if( player.phone !== phone ){
      return next(
        new ErrorResponse(`phone number `, 400)
      );
    }else{
        let fieldsToUpdate={
          'verifyPhone':vcode,
          'verifyPhoneExpire': Date.now() + 10 * 60 * 1000,
        }
        player = await Player.findByIdAndUpdate(player.id, fieldsToUpdate, {
          new: true,
          runValidators: true
        });
      }
    
    
  }else{
     // create new player
  let data = {
    'phone': phone,
    'verifyPhone': vcode,
    'verifyPhoneExpire': Date.now() + 10 * 60 * 1000,
    'deviceToken': deviceToken,
    'status':'notverifed',
    'countryCode': countryCode
  };
  //console.log('usususus',data);
  // Create user
  player = await Player.create(data);
 

  }

   await smsOtp(phone, vcode);

  res.status(200).json({
    success: true,
    data: {}
  });

});


// @desc      Verify phone
// @route     POST /api/v1/auth/register
// @access    Public
exports.verifyPhoneCode = asyncHandler(async (req, res, next) => {
  if(!req.body.deviceToken || !req.body.deviceType || !req.body.code|| !req.body.phone){
        return next(
        new ErrorResponse(`Please provide all required data`, 400)
      );
  }
  //resetPasswordExpire: { $gt: Date.now() }
  console.log('verifyPhone-input', req.body)
  // await verifyOtp(req.body.phone, req.body.code).then(r=>{
  //   r.data.type
  // })
  let user = await Player.findOne({ phone: req.body.phone, verifyPhone: req.body.code  });
  console.log('verifyPhone', user)
  const addamount = 10;
  if (!user) {
    return next(
      new ErrorResponse(`Invalid Code`, 400)
    );
  }

 if(user.status === 'notverifed'){
   //all ok new user 
  let fieldsToUpdate = {
    deviceType: req.body.deviceType,
    deviceToken: req.body.deviceToken,
    verifyPhone:undefined,
    verifyPhoneExpire: undefined,
    status: 'active',
    $inc: { balance: addamount },
  }

  let tranData = {
    playerId: user._id,
    amount: addamount, 
    transactionType: 'credit',
    note: 'player register',
    prevBalance: user.balance
  }
  let tran = await Transactions.create(tranData);
  user = await Player.findByIdAndUpdate(user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });
    sendTokenResponse(user, 200, res);

 }else if(user.status === 'active'){
  // console.log('coustomer',s);
    sendTokenResponse(user, 200, res);

 }else{
   return next(new ErrorResponse(`User is inactive`, 400));
 }

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
      firstName: user.firstName,
      lastName: user.lastName
    });
};


// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
console.log('login',email, password)
  // Validate emil & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
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

let smsOtp= async(phone,otp)=>{
var params = {
  "template_id":"5f322d94d6fc051d202b4522",
  "mobile":phone,
  "authkey":"338555AN0yGYvFhp5f342bcc",
  "otp":otp
};

return axios.get('https://api.msg91.com/api/v5/otp', { params}).catch(error => {console.error(error)});

}

let verifyOtp=async(phone, otp)=>{
 var params = {
  "template_id":"5f322d94d6fc051d202b4522",
  "mobile":phone,
  "authkey":"338555AN0yGYvFhp5f342bcc",
  "otp":otp
};


return axios.get('https://api.msg91.com/api/v5/otp/verify', { params }).catch(error => {console.error(error)})

}

let resendOpt=async()=>{
  var params = {
  //"template_id":"5f322d94d6fc051d202b4522",
  "mobile":"919665300923",
  "authkey":"338555AN0yGYvFhp5f342bcc",
//  "otp":otp,
  "retrytype":"text"
};

axios.get('https://api.msg91.com/api/v5/otp/retry', {params})
  .then(res => {
    console.log(res)
  })
  .catch(error => {
    console.error(error)
  })
 
}