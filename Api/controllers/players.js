const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Player = require('../models/Player');

// @desc      Get all Players
// @route     GET /api/v1/auth/Players
// @access    Private/Admin
exports.getPlayers = asyncHandler(async (req, res, next) => {
  console.log('server-rew', req.body);
  Player.dataTables({
    limit: req.body.length,
    skip: req.body.start,
    search: {
      value: req.body.search.value,
      fields: ['phone']
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
  const player = await Player.findById(req.params.id);

  res.status(200).json({
    success: true,
    data: player
  });
});

// @desc      Create Player
// @route     POST /api/v1/auth/Players
// @access    Private/Admin
exports.createPlayer = asyncHandler(async (req, res, next) => {
  const player = await Player.create(req.body);

  res.status(201).json({
    success: true,
    data: Player
  });
});

// @desc      Update Player
// @route     PUT /api/v1/auth/Players/:id
// @access    Private/Admin
exports.updatePlayer = asyncHandler(async (req, res, next) => {
  let {firstName, lastName, email,gender,country, aadharNumber, panNumber, dob, kycStatus}=req.body
  let player = await Player.findById(req.params.id);
  if (!Player) {
    return next(
      new ErrorResponse(`Player  not found`, 404)
    );
  }
  let fieldsToUpdate= {firstName, lastName, email,gender,country, aadharNumber, panNumber, dob, kycStatus}
   
  player = await Player.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
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
  console.log('hhh',req.player);
if(!req.player){
  return next(new ErrorResponse('user not found', 400));
}
  // Validate role
  if (req.player.role !== 'player') {
    return next(new ErrorResponse('user not found', 400));
  }

  // Check for user
   user = await Player.findByIdAndUpdate(req.player.id,{'password':pin}, {
    new: true,
    runValidators: true
  });
 
  res.status(200).json({
    success: true,
    data: {}
  });
 
});
// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.chkPin = asyncHandler(async (req, res, next) => {
  const { pin  } = req.body;
  console.log('hhhkk',req.player);
if(!req.player){
  return next(new ErrorResponse('user not found', 400));
}
  // Validate role
  if (req.player.role !== 'player') {
    return next(new ErrorResponse('user not found', 400));
  }
 // Check for user
 const user = await Player.findOne({_id: req.player.id }).select('+password');
 // Check if password matches
 const isMatch =  user.password=== req.body.pin;
  // Check for user
   if(!isMatch){
    return next(new ErrorResponse('authentication faild', 400));
   }
 
  res.status(200).json({
    success: true,
    data: req.player
  });
 
});

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.join = asyncHandler(async (req, res, next) => {
  

  res.status(200).json({
    success: true,
    data: {}
  });
});


// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.debiteAmount = asyncHandler(async (req, res, next) => {
  let {amount, note} = req.body;
    if(amount <0 ){
    return next(
      new ErrorResponse(`Invalid amount`, 400)
    );
  }
   if (!req.player) {
    return next(
      new ErrorResponse(`Invalid Code`, 400)
    );
  }
  let fieldsToUpdate = {
    $inc: { balance: -amount },
  }

  let tranData = {
    'playerId': req.player._id,
    'amount': amount, 
    'transactionType': "debit",
    'note':note,
    'prevBalance': req.player.balance
  }
  let tran = await Transactions.create(tranData);
  let player = await Player.findByIdAndUpdate(req.player.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data:player
  });
});


// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.creditAmount = asyncHandler(async (req, res, next) => {
  let {amount, note} = req.body;
    if(amount <0 ){
    return next(
      new ErrorResponse(`Invalid amount`, 400)
    );
  }
   if (!req.player) {
    return next(
      new ErrorResponse(`Invalid Code`, 400)
    );
  }
  let fieldsToUpdate = {
    $inc: { balance: amount },
  }

  let tranData = {
    'playerId': req.player._id,
    'amount': amount, 
    'transactionType': "credit",
    'note':note,
    'prevBalance': req.player.balance
  }
  let tran = await Transactions.create(tranData);
  let player = await Player.findByIdAndUpdate(req.player.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

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

 