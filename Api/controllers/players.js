const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Player = require('../models/Player');
const Transaction = require('../models/Transaction');
const Ticket = require('../models/Ticket');
const { request } = require('express');

// @desc      Get all Players
// @route     GET /api/v1/auth/Players
// @access    Private/Admin
exports.getPlayers = asyncHandler(async (req, res, next) => {
  
  Player.dataTables({
    limit: req.body.length,
    skip: req.body.start,
    find:req.query,
    search: {
      value: req.body.search.value,
      fields: ['phone','email','firstName','lastName']
    },
    sort: {
      username: 1
    }
  }).then(function (table) {
    res.json({data: table.data, recordsTotal:table.total,recordsFiltered:table.total, draw:req.body.draw}); // table.total, table.data
  })
  //res.status(200).json(res.advancedResults);
});

// @desc      Get single Player
// @route     GET /api/v1/auth/Players/:id
// @access    Private/Admin
exports.getPlayer = asyncHandler(async (req, res, next) => {
   let player; 
   //set
   if(req.staff){
    player= await Player.findById(req.params.id);
  }else{
    player = req.player;
  }
 
  if (!player) {
    return next(
      new ErrorResponse(`Player  not found`)
    );
  }

  res.status(200).json({
    success: true,
    data: player
  });
});

// @desc      Create Player
// @route     POST /api/v1/auth/Players
// @access    Private/Admin
exports.createPlayer = asyncHandler(async (req, res, next) => {
 // const player = await Player.create(req.body);

  res.status(201).json({
    success: true,
    data: Player
  });
});

// @desc      Update Player
// @route     PUT /api/v1/auth/Players/:id
// @access    Private/Admin
exports.updatePlayer = asyncHandler(async (req, res, next) => {
  let {firstName, lastName, email,gender,country, aadharNumber, panNumber, dob, kycStatus}=req.body;
    let fieldsToUpdate= {firstName, lastName, email,gender,country, aadharNumber, panNumber, dob};
  let player;
 if( !firstName ||!email ||!gender || !country ||!aadharNumber|| !panNumber ||!dob){
 return next(
      new ErrorResponse(`All fields are requied`)
    );
 }
  if(req.staff){
    player= await Player.findById(req.params.id);
    fieldsToUpdate['kycStatus'] = kycStatus;
  }else if(req.player){
    
    player = req.player;
  }
 
  if (!player) {
    return next(
      new ErrorResponse(`Player  not found`)
    );
  }

   
  player = await Player.findByIdAndUpdate(player.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

   //Player.isNew = false;
 // await Player.save();
  res.status(200).json({
    success: true,
    data: player
  });
});

// @desc      Delete Player
// @route     DELETE /api/v1/auth/Players/:id
// @access    Private/Admin
exports.deletePlayer = asyncHandler(async (req, res, next) => {
  const player = await Player.findById(req.params.id);
  await Player.findByIdAndDelete(req.params.id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});


// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.setPin = asyncHandler(async (req, res, next) => {
  const { pin  } = req.body;
 

if(!pin || !req.player || req.player.role !== 'player'){
  return next(new ErrorResponse('user not found'));
}
   

  // Check for user
   user = await Player.findByIdAndUpdate(req.player.id,{'password':pin}, {
    new: true,
    runValidators: true
  });
 
  res.status(200).json({success: true,data: {}});
 
});
// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.chkPin = asyncHandler(async (req, res, next) => {
  const { pin, playerId  } = req.body;
 
if(!pin || !playerId ){
  return next(new ErrorResponse('authentication faild'));
}
  
 // Check for user
 const user = await Player.findOne({_id: playerId }).select('+password');
 // Check if password matches
 const isMatch =  user.password=== req.body.pin;
  // Check for user
   if(!isMatch){
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
      playerId:user._id,
      firstName: user.firstName,
      lastName: user.lastName
    });
};


// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.join = asyncHandler(async (req, res, next) => {
 //dahboard online +  
// player game add
// player stat

  res.status(200).json({
    success: true,
    data: {}
  });
});
// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.won = asyncHandler(async (req, res, next) => {
  //dahboard online +  
 // player game update
 // play stat
 
   res.status(200).json({
     success: true,
     data: {}
   });
 });
 
// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.ticketAdd = asyncHandler(async (req, res, next) => {
  req.body['playerId'] = req.player._id
  const row = await Ticket.create(req.body);
 
   res.status(200).json({
     success: true,
     data: row
   });
 });


 exports.ticketList = asyncHandler(async (req, res, next) => {

  let row = await Ticket.find({'playerId':req.player.id}).populate('playerId');
  res.status(200).json({
    success: true,
    data: row
  });
 });

 exports.ticketReply = asyncHandler(async (req, res, next) => {
  //req.body['playerId'] = req.player._id
  if(!req.player){
    return next(
      new ErrorResponse(`Please Login`)
    );
  }
  let row = await Ticket.findById(req.body.id).populate('playerId');
  if (!row) {
    return next(
      new ErrorResponse(`Ticket  not found`)
    );
  }
  let reply = {'reply':req.body.history,from:req.player.firstName}
  let fieldsToUpdate= {status:req.body.status, $addToSet: { 'history':reply } };
   
  row = await Ticket.findByIdAndUpdate(req.body.id,  fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  
   res.status(200).json({
     success: true,
     data: row
   });
 });




// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.debiteAmount = asyncHandler(async (req, res, next) => {
  let {amount, note} = req.body;
    if(amount <0 ){
    return next(
      new ErrorResponse(`Invalid amount`)
    );
  }
   if (!req.player) {
    return next(
      new ErrorResponse(`Invalid Code`)
    );
  }
  let fieldsToUpdate = {
    $inc: { balance: -amount } 
  }

  let tranData = {
    'playerId': req.player._id,
    'amount': amount, 
    'transactionType': "debit",
    'note':note,
    'prevBalance': req.player.balance
  }
   let tran = await Transaction.create(tranData);
  let player = await Player.findByIdAndUpdate(req.player.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });
 
   await Transaction.findByIdAndUpdate(tran._id,{status:'complete'});
   

  res.status(200).json({
    success: true,
    data:player
  });
});


// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.creditAmount = asyncHandler(async (req, res, next) => {
    let player = await Player.findById(req.params.id);
    
   let {amount, note} = req.body;
    if(amount <0 ){
    return next(
      new ErrorResponse(`Invalid amount`)
    );
  }
   if (!player) {
    return next(
      new ErrorResponse(`Player Not found`)
    );
  }
  let fieldsToUpdate = {
    $inc: { balance: parseInt(amount) }
  }
console.log(amount, note);
  let tranData = {
    'playerId': player._id,
    'amount': parseInt(amount), 
    'transactionType': "credit",
    'note':note,
    'prevBalance': player.balance,


  }
  let tran = await Transaction.create(tranData);
    player = await Player.findByIdAndUpdate(player.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

     await Transaction.findByIdAndUpdate(tran._id,{status:'complete'});
   
  res.status(200).json({
    success: true,
    data:player
  });
});

// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.playerInfo = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.getOnlinePlayers = asyncHandler(async (req, res, next) => {
 // const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: {count:5}
  });
});
// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.editOnlinePlayers = asyncHandler(async (req, res, next) => {
  // const user = await User.findById(req.user.id);
 
   res.status(200).json({
     success: true,
     data: {count:5}
   });
 });

// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.getNotication  = asyncHandler(async (req, res, next) => {
  // const user = await User.findById(req.user.id);
 
   res.status(200).json({
     success: true,
     data: []
   });
 });
 // @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.updateStatus = asyncHandler(async (req, res, next) => {
  let fieldsToUpdate={};
  player= await Player.findById(req.params.id);
  if (!player) {
    return next(
      new ErrorResponse(`Player  not found`)
    );
  }
 if(!req.staff){
    return next(
      new ErrorResponse(`Not Autherized`)
    );
  }

   
    fieldsToUpdate['status'] = req.body.status;
     player = await Player.findByIdAndUpdate(player.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: player
  });
});

// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.getPage  = asyncHandler(async (req, res, next) => {
  // const user = await User.findById(req.user.id);
 
   res.status(200).json({
     success: true,
     data: {
       'terms':process.env.API_URI + '/page/term',
       'policy':process.env.API_URI + '/page/policy'
     }
   });
 });

