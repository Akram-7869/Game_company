const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Player = require('../models/Player');
const Transaction = require('../models/Transaction');
const Ticket = require('../models/Ticket');
const File = require('../models/File');
const Dashboard = require('../models/Dashboard');
const { request } = require('express');
const Setting = require('../models/Setting');
//const Lobby = require('../models/Lobby');
const Coupon = require('../models/Coupon');
//const Gift = require('../models/Gift');
const PlayerNotifcation = require('../models/PlayerNotifcation');
const Notification = require('../models/Notification');
//const admin = require('../utils/fiebase');
const Tournament = require('../models/Tournament');
const Banner = require('../models/Banner');
const PlayerPoll = require('../models/PlayerPoll');
const Poll = require('../models/Poll');
const PlayerGame = require('../models/PlayerGame');
const Version = require('../models/Version');
const moment = require('moment');

let axios = require('axios');
const FormData = require('form-data');

const checkOrderStatus = async (trxId) => {
  const row = await Setting.findOne({ type: 'PAYMENT', name: 'CASHFREE' });
  let data = new FormData();
  data.append('appId', row.one.APP_ID);
  data.append('secretKey', row.one.SECRET_KEY);
  data.append('orderId', trxId);

  let config = {
    method: 'post',
    url: 'https://api.cashfree.com/api/v1/order/info',
    headers: {
      ...data.getHeaders()
    },
    data: data
  };

  return await axios(config);

}
exports.withDrawRequest = asyncHandler(async (req, res, next) => {
  let { amount, note, gameId, to } = req.body;

  if (!req.player) {
    return next(
      new ErrorResponse(`Player Not Found`)
    );
  }

  if (!amount || amount < 0) {
    return next(
      new ErrorResponse(`Invalid amount`)
    );
  }
  if (amount > req.player.balance) {
    return next(
      new ErrorResponse(`Insufficent Balance`)
    );
  }

  if (amount < 200) {
    return next(
      new ErrorResponse(`Balance less than 200`)
    );
  }

  let player = await Player.findById(req.player.id).select('+bank +wallet +upi');

  let tranData = {
    'playerId': req.player._id,
    'amount': amount,
    'transactionType': "debit",
    'note': note,
    'prevBalance': req.player.balance,
    'status': 'log',
    'logType': 'withdraw',
    'withdrawTo': req.body.to

  }
  if (req.body.to === 'bank') {
    tranData['withdraw'] = player.bank;
  } else if (req.body.to === 'wallet') {
    tranData['withdraw'] = player.wallet;
  } else if (req.body.to === 'upi') {
    tranData['withdraw'] = player.upi;
  }
  //tranData['gameId'] = gameId;

  let tran = await Transaction.create(tranData);
  player = await Player.findByIdAndUpdate(req.player.id, { $inc: { balance: -amount, winings: -amount } }, {
    new: true,
    runValidators: true
  });

  // tran = await Transaction.findByIdAndUpdate(tran._id, { status: 'complete' });
  let dash = await Dashboard.findOneAndUpdate({ type: 'dashboard' }, { $set: { $inc: { totalPayoutRequest: 1 } } }, {
    new: true, upsert: true,
    runValidators: true
  });

  let title = `Withdraw Request Rs. ${amount}  `;
  let notification = {
    title: title,
    message: title,
    sendTo: 'player',
    status: 'active',

  }



  const notificationDb = await Notification.create(notification);
  let updated = { read: false }
  await PlayerNotifcation.findOneAndUpdate({ playerId: req.player.id, notificationId: notificationDb._id }, updated, {
    new: false, upsert: true,
    runValidators: true
  });
  //console.log('sending message');

  let to_player = await Player.findById(req.player.id).select('+firebaseToken');
  var message = {
    notification: {
      title: title,
      body: title
    },
    // topic: "/topics/all",
    // token: ''
  };
  message['token'] = to_player.firebaseToken;

  // await admin.messaging().send(message)
  //   .then((response) => {
  //     // Response is a message ID string.
  //     console.log('Successfully sent message:', response);

  //   })
  //   .catch((error) => {
  //     console.log('Error sending message:', error);
  //   });

  req.io.to('notification_channel').emit('res', { ev: 'notification_player', data: { "playerId": req.player.id } });


  res.status(200).json({
    success: true,
    data: player
  });
});
exports.addBank = asyncHandler(async (req, res, next) => {
  let { bankName, bankAccount, bankIfc, bankAddress, bankAccountHolder } = req.body;
  let fieldsToUpdate = { bankName, bankAccount, bankIfc, bankAddress, bankAccountHolder };
  let player;
  if (!bankName || !bankAccount || !bankIfc || !bankAddress || !bankAccountHolder) {
    return next(
      new ErrorResponse(`All fields are requied`)
    );
  }
  if (req.staff) {
    player = await Player.findById(req.params.id);
    // fieldsToUpdate['kycStatus'] = kycStatus;
  } else if (req.player) {

    player = req.player;
  }
  console.log('req.player'.red, req.player);
  if (!player) {
    return next(
      new ErrorResponse(`Player  not found`)
    );
  }


  player = await Player.findByIdAndUpdate(player.id, { bank: fieldsToUpdate }, {
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
exports.addWallet = asyncHandler(async (req, res, next) => {
  let { walletAddress, walletName } = req.body;
  let fieldsToUpdate = { walletName, walletAddress };
  let player;
  if (!walletName || !walletAddress) {
    return next(
      new ErrorResponse(`All fields are requied`)
    );
  }
  if (req.staff) {
    player = await Player.findById(req.params.id);
    //fieldsToUpdate['kycStatus'] = kycStatus;
  } else if (req.player) {
    player = req.player;
  }
  if (!player) {
    return next(
      new ErrorResponse(`Player  not found`)
    );
  }
  player = await Player.findByIdAndUpdate(player.id, { wallet: fieldsToUpdate }, {
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
exports.addUpi = asyncHandler(async (req, res, next) => {
  let { upiId } = req.body;
  let fieldsToUpdate = { upiId };
  let player = req.player;
  if (!upiId) {
    return next(
      new ErrorResponse(`All fields are requied`)
    );
  }
  if (!player) {
    return next(
      new ErrorResponse(`Player  not found`)
    );
  }
  player = await Player.findByIdAndUpdate(player.id, { upi: fieldsToUpdate }, {
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
exports.addMoney = asyncHandler(async (req, res, next) => {
  let { amount, note, orderId } = req.body;
  let player = req.player;
  // if (!amount || amount < 0) {
  //   return next(
  //     new ErrorResponse(`Invalid amount`)
  //   );
  // }
  if (!req.player) {
    return next(
      new ErrorResponse(`Player Not Found`)
    );
  }
  if (!orderId) {
    return next(
      new ErrorResponse(`Order Not Found`)
    );
  }


  let tran = await Transaction.findOne({ _id: orderId, status: 'log' });
  if (!tran) {
    return next(
      new ErrorResponse(`Transaction not found`)
    );
  }
  const row = await checkOrderStatus(orderId);
  console.log('row', row.data, tran);
  if (row.data.details.orderStatus === 'PAID') {
    let fieldsToUpdate = {
      $inc: { balance: parseInt(row.data.details.orderAmount), deposit: parseInt(row.data.details.orderAmount) }
    }

    player = await Player.findByIdAndUpdate(tran.playerId, fieldsToUpdate, {
      new: true,
      runValidators: true
    });
    await Transaction.findByIdAndUpdate(tran._id, { status: 'complete', paymentStatus: 'SUCCESS' });
    if (tran.couponId) {
      let coupon = await Coupon.findOne({ _id: tran.couponId, 'active': true });
      let bonus_amount = 0;
      if (coupon.calculateType === 'percentage') {
        bonus_amount = tran.amount * coupon.couponAmount * 0.01;
      } else if (coupon.calculateType === 'fixed') {
        bonus_amount = coupon.couponAmount;
      }
      if (coupon) {
        //create transaction
        let tranData = {
          'playerId': tran.playerId,
          'amount': bonus_amount,
          'transactionType': "credit",
          'note': 'coupon bonus',
          'prevBalance': req.player.balance,
          'status': 'complete',
          'logType': 'bonus'
        }
        let tranb = await Transaction.create(tranData);
        //
        player = await tranb.creditPlayerBonus(bonus_amount);
      }
    }
    //handle coupon


  } else {
    await Transaction.findByIdAndUpdate(tran._id, { paymentStatus: row.data.details.orderStatus });
  }
  res.status(200).json({
    success: true,
    data: player
  });
});

exports.membership = asyncHandler(async (req, res, next) => {
  let { amount, note, orderId } = req.body;
  let player = req.player;
  // if (!amount || amount < 0) {
  //   return next(
  //     new ErrorResponse(`Invalid amount`)
  //   );
  // }
  if (!req.player) {
    return next(
      new ErrorResponse(`Player Not Found`)
    );
  }
  if (!orderId) {
    return next(
      new ErrorResponse(`Order Not Found`)
    );
  }


  let tran = await Transaction.findOne({ _id: orderId, status: 'log' });
  if (!tran) {
    return next(
      new ErrorResponse(`Transaction not found`)
    );
  }
  const row = await checkOrderStatus(orderId);
  //console.log('row', row.data, tran);
  if (row.data.details.orderStatus !== 'PAID') {
    //if (tran) {
    let fieldsToUpdate = {}
    if (tran.membershipId === 'month') {
      var futureMonth = moment().add(1, 'M');
      fieldsToUpdate = { membership: 'vip', membership_expire: futureMonth }
    } else if (tran.membershipId === 'year') {

      var futureYear = moment().add(1, 'Y');
      fieldsToUpdate = { membership: 'vip', membership_expire: futureYear }
    }
    player = await Player.findByIdAndUpdate(tran.playerId, fieldsToUpdate, {
      new: true,
      runValidators: true
    });
    await Transaction.findByIdAndUpdate(tran._id, { status: 'complete', paymentStatus: 'SUCCESS' });
  } else {
    await Transaction.findByIdAndUpdate(tran._id, { paymentStatus: row.data.details.orderStatus });
  }
  res.status(200).json({
    success: true,
    data: player
  });
});

// @desc      Get all Players
// @route     GET /api/v1/auth/Players
// @access    Private/Admin
exports.getPlayers = asyncHandler(async (req, res, next) => {
  let filter = {
    limit: req.body.length,
    skip: req.body.start,
    find: req.query,
    search: {

    },
    sort: {
      username: 1
    }
  };
  if (req.body.s_date && req.body.e_date) {
    req.query['createdAt'] = {
      $gte: req.body.s_date,
      $lt: req.body.e_date
    }

  }
  let key = req.body.search ? req.body.search.value : '';
  if (key) {
    if (isNaN(key)) {
      if (key.length != 24) {
        return res.json(empty);
      }
      filter['find']['_id'] = key;
    }
    else {
      filter['search'] = {
        value: req.body.search.value,
        fields: ['phone', 'email', 'firstName', 'lastName']

      }
    }
  }
  Player.dataTables(filter).then(function (table) {
    res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
  })
  //res.status(200).json(res.advancedResults);
});

// @desc      Get single Player
// @route     GET /api/v1/auth/Players/:id
// @access    Private/Admin
exports.getPlayer = asyncHandler(async (req, res, next) => {
  let player;
  //set
  if (req.staff) {
    player = await Player.findById(req.params.id).select('+panNumber +aadharNumber +bank +wallet +upi +firebaseToken');
  } else {
    //player = req.player;
    player = await Player.findById(req.player._id).select('+panNumber +aadharNumber +bank +wallet +upi +firebaseToken');
  }

  if (!player) {
    return next(
      new ErrorResponse(`Player  not found`)
    );
  }

  player['profileUrl'] = 'dfdfdfdf';

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
  let { firstName, lastName, email, gender, country, aadharNumber, panNumber, dob, kycStatus, state } = req.body;
  let fieldsToUpdate = { firstName, lastName, email, gender, country, aadharNumber, panNumber, dob, state };
  let player;
  if (!firstName) {
    return next(
      new ErrorResponse(`Name is requied`)
    );
  }

  if (req.staff) {
    player = await Player.findById(req.params.id);
    fieldsToUpdate['kycStatus'] = kycStatus;
  } else if (req.player) {

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
  const { pin } = req.body;


  if (!pin || !req.player || req.player.role !== 'player') {
    return next(new ErrorResponse('user not found'));
  }


  // Check for user
  user = await Player.findByIdAndUpdate(req.player.id, { 'password': pin }, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, data: {} });

});
// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.chkPin = asyncHandler(async (req, res, next) => {
  const { pin, playerId } = req.body;

  if (!pin || !playerId) {
    return next(new ErrorResponse('authentication faild'));
  }

  // Check for user
  const user = await Player.findOne({ _id: playerId }).select('+password');

  if (!user) {
    return next(new ErrorResponse('user not found'));
  }
  // Check if password matches
  const isMatch = user.password === req.body.pin;
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
      lastName: user.lastName
    });
};



exports.join = asyncHandler(async (req, res, next) => {
  //dahboard online +  
  // player game add {gameStatus='playing', amountPaid:'10'}
  // player stat
  // let fieldsToUpdate = { playerId: req.player._id, logType: 'join', amountPaid: req.body.amountPaid };
  // let tran = await Transactions.findOneAndUpdate({ playerId: req.player.id, gameId: req.body.gameId }, fieldsToUpdate, {
  //   new: true, upsert: true,
  //   runValidators: true
  // });
  // let addamount = req.body.amountPaid;
  // let dashUpdate = { $inc: { livePlayer: 1 }, $inc: { grossIncome: addamount } }
  // let dash = await Dashboard.findOneAndUpdate({ type: 'dashboard' }, dashUpdate, {
  //   new: true, upsert: true,
  //   runValidators: true
  // });
  // let player = await Player.joinCount(req.player.id);
  res.status(200).json({
    success: true,
    data: {}
  });
});

exports.won = asyncHandler(async (req, res, next) => {
  //dahboard online +  
  // player game update  
  // play stat

  // let fieldsToUpdate = { playerId: req.player._id, logType: 'won', amountWon: req.body.amountWon };
  // let tran = await Transactions.findOneAndUpdate({ playerId: req.player.id, gameId: req.body.gameId }, fieldsToUpdate, {
  //   new: true, upsert: false,
  //   runValidators: true
  // });



  // //let addamount = req.body.amountWon * 0.20;
  // let dashUpdate = { $inc: { livePlayer: -1 } }
  // let dash = await Dashboard.findAndUpdate({ type: 'dashboard' }, dashUpdate, {
  //   new: true, upsert: true,
  //   runValidators: true
  // });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.ticketAdd = asyncHandler(async (req, res, next) => {

  if (req.files) {
    let dataSave = {
      // createdBy: req.user.id,
      data: req.files.file.data,
      contentType: req.files.file.mimetype,
      size: req.files.file.size,
    }
    const newfile = await File.create(dataSave);
    req.body['ticketImage'] = newfile._id;

  }
  req.body['playerId'] = req.player._id
  const row = await Ticket.create(req.body);

  res.status(200).json({
    success: true,
    data: row
  });
});


exports.ticketList = asyncHandler(async (req, res, next) => {

  let row = await Ticket.find({ 'playerId': req.player.id }).populate('playerId');
  res.status(200).json({
    success: true,
    data: row
  });
});

exports.getLobbys = asyncHandler(async (req, res, next) => {

  let rows = await Lobby.find({ 'active': true }).lean();
  let x = rows.map(d => {
    d['imageUrl'] = process.env.API_URI + '/files/' + d.lobbyImage;
    return d;
  });
  // console.log('dsdsdsdsdsd', x);
  res.status(200).json({
    success: true,
    data: x
  });
});


exports.ticketReply = asyncHandler(async (req, res, next) => {
  //req.body['playerId'] = req.player._id
  if (!req.player) {
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
  let reply = { 'reply': req.body.history, from: req.player.firstName }
  let fieldsToUpdate = { status: req.body.status, $addToSet: { 'history': reply } };

  row = await Ticket.findByIdAndUpdate(req.body.id, fieldsToUpdate, {
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
  let { amount, note, gameId } = req.body;

  if (!amount || amount < 0) {
    return next(
      new ErrorResponse(`Invalid amount`)
    );
  }
  if (!req.player) {
    return next(
      new ErrorResponse(`Invalid Code`)
    );
  }
  if (!gameId) {
    return next(
      new ErrorResponse(`Game id requied`)
    );
  }
  if (req.player.balance < amount) {
    return next(
      new ErrorResponse(`Insufficent balance`)
    );
  }

  let tranData = {
    'playerId': req.player._id,
    'amount': amount,
    'transactionType': "debit",
    'note': note,
    'prevBalance': req.player.balance,
    status: 'complete', paymentStatus: 'SUCCESS'
  }

  tranData['gameId'] = gameId;

  let tran = await Transaction.create(tranData);
  player = await tran.debitPlayerDeposit(amount);

  let dashUpdate = {};
  if (req.body.logType === 'join') {
    Dashboard.join();
    player = await Player.findByIdAndUpdate(req.player.id, { $inc: { joinCount: 1 } }, {
      new: true,
      runValidators: true
    });
  }



  res.status(200).json({
    success: true,
    data: player
  });
});

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.debitBonus = asyncHandler(async (req, res, next) => {
  let { amount, note, gameId } = req.body;

  if (!amount || amount < 0) {
    return next(
      new ErrorResponse(`Invalid amount`)
    );
  }
  if (!req.player) {
    return next(
      new ErrorResponse(`Invalid Code`)
    );
  }
  if (!gameId) {
    return next(
      new ErrorResponse(`Game id requied`)
    );
  }
  if (req.player.bonus < amount) {
    return next(
      new ErrorResponse(`Insufficent bonus balance`)
    );
  }

  let tranData = {
    'playerId': req.player._id,
    'amount': amount,
    'transactionType': "debit",
    'note': note,
    'prevBalance': req.player.balance,
    status: 'complete', paymentStatus: 'SUCCESS'
  }

  tranData['gameId'] = gameId;

  let tran = await Transaction.create(tranData);

  player = await tran.debitPlayerBonus(amount);
  res.status(200).json({
    success: true,
    data: player
  });
});

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.creditAmount = asyncHandler(async (req, res, next) => {
  let player = req.player;//await Player.findById(req.body.id);
  let { amount, note, gameId, adminCommision = 0, tournamentId, winner = 'winner_1' } = req.body;

  if (amount < 0) {
    return next(
      new ErrorResponse(`Invalid amount`)
    );
  }
  if (!player) {
    return next(
      new ErrorResponse(`Player Not found`)
    );
  }
  amount = parseInt(amount).toFixed(3);

  let commision = adminCommision;
  let tranData = {
    'playerId': player._id,
    'amount': amount,
    'transactionType': "credit",
    'note': note,
    'prevBalance': player.balance,
    'adminCommision': commision,
    status: 'complete', paymentStatus: 'SUCCESS',
    'logType': req.body.logType
  }
  if (gameId) {
    tranData['gameId'] = gameId;
  }
  let tran = await Transaction.create(tranData);

  // await Transaction.findByIdAndUpdate(tran._id, { status: 'complete' });
  let dashUpdate = {};
  if (req.body.logType = "won") {
    //  const row = await Setting.findOne({ type: 'SITE', name: 'ADMIN' });
    // console.log(row.commission);
    //  commision = (row.commission / 100) * amount;
    // let tranData = {
    //   'playerId': player._id,
    //   'amount': commision,
    //   'transactionType': "debit",
    //   'note': 'Service Charge',
    //   'prevBalance': player.balance,
    //   status: 'complete', paymentStatus: 'SUCCESS'

    // }
    // let tran1 = await Transaction.create(tranData);
    // player = await tran1.debitPlayer(commision);

    player = await tran.creditPlayerWinings(amount);
    let playerGame = {
      'playerId': player._id,
      'amountWon': amount,
      'tournamentId': tournamentId,
      'winner': winner,
      'gameId': gameId,
      'gameStatus': 'won'
    }
    await PlayerGame.create(playerGame);

  } else if (req.body.logType = "bonus") {
    player = await tran.creditPlayerBonus(amount);
  }

  //console.log('debit', player.balance);

  await updateDashboradStat(amount, commision)
  res.status(200).json({
    success: true,
    data: player
  });
});

const updateDashboradStat = async (amount, commision) => {
  let dash = await Dashboard.findOne({ type: 'dashboard' });
  if (dash['livePlayers'] > 0) {
    dash['livePlayers'] -= 1;
  }
  if (commision > 0) {
    dash['totalIncome'] = dash['totalIncome'] + parseInt(commision);
  }
  dash['grossIncome'] = dash['grossIncome'] + parseInt(amount);

  dash.save();
}
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
    data: { count: 5 }
  });
});
// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.editOnlinePlayers = asyncHandler(async (req, res, next) => {
  // const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: { count: 5 }
  });
});

// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.getNotication = asyncHandler(async (req, res, next) => {
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
  let fieldsToUpdate = {};
  player = await Player.findById(req.params.id);
  if (!player) {
    return next(
      new ErrorResponse(`Player  not found`)
    );
  }
  if (!req.staff) {
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
exports.getPage = asyncHandler(async (req, res, next) => {
  // const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      'terms': process.env.API_URI + '/page/term',
      'policy': process.env.API_URI + '/page/policy'
    }
  });
});


exports.updatePlayerImage = asyncHandler(async (req, res, next) => {
  // const user = await User.findById(req.user.id);
  let player = req.player;
  let newfile;
  let fieldsToUpdate;
  //  console.log(req.file, req.files, req.body, req.query);


  let dataSave = {
    // createdBy: req.user.id,
    data: req.files.file.data,
    contentType: req.files.file.mimetype,
    size: req.files.file.size,
  }
  // ${process.env.MAX_FILE_UPLOAD}
  // Check filesize
  if (dataSave.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an image less than 256k`
      )
    );
  }

  if (player.profilePic) {
    newFile = await File.findByIdAndUpdate(player.profilePic, dataSave, {
      new: true,
      runValidators: true
    });
  } else {
    newfile = await File.create(dataSave);
    fieldsToUpdate = { 'profilePic': newfile._id };
    player = await Player.findByIdAndUpdate(player.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });
  }

  res.status(200).json({
    success: true,
    data: { _id: player.profilePic, profileUrl: buildProfileUrl(player) }
  });

  // 'terms': process.env.API_URI + '/page/term',
  // 'policy': process.env.API_URI + '/page/policy'


});

let buildProfileUrl = (player) => {
  if (player.profilePic) {
    // console.log('image'.green);
    return process.env.API_URI + '/files/' + player.profilePic
  } else {
    // console.log('image'.red);

    return '';
  }

}
exports.getTournaments = asyncHandler(async (req, res, next) => {
  const rows = await Tournament.find({ active: true });

  res.status(200).json({
    success: true,
    data: rows
  });
});

// @desc      Get current  in coupon
// @route     POST /api/v1/auth/me
// @access    Private
exports.getCoupons = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.find({ 'couponType': req.params.type, 'active': true }).lean();;
  let x = coupon.map(d => {
    d['imageUrl'] = process.env.API_URI + '/files/' + d.couponImage;
    return d;
  });
  res.status(200).json({
    success: true,
    data: x
  });
});

// @desc      Get current  in coupon
// @route     POST /api/v1/auth/me
// @access    Private


exports.getBanners = asyncHandler(async (req, res, next) => {
  const banner = await Banner.find({ 'status': 'active' }).lean();
  console.log(banner);
  let x = banner.map(d => {
    d['imageUrl'] = process.env.API_URI + '/files/' + d.imageId;

    return d;
  });
  res.status(200).json({
    success: true,
    data: x
  });
});
exports.getGifts = asyncHandler(async (req, res, next) => {
  const gift = await Gift.find({ 'active': true }).lean();;
  let x = gift.map(d => {
    d['imageUrl'] = process.env.API_URI + '/files/' + d.giftImage;
    return d;
  });
  res.status(200).json({
    success: true,
    data: x
  });
});





// @desc      Update Notification
// @route     PUT /api/v1/auth/Notifications/:id
// @access    Private/Admin
exports.clearAllNotification = asyncHandler(async (req, res, next) => {
  if (!req.player) {
    return next(
      new ErrorResponse(`Notifications  not found`)
    );
  }

  player = await Player.findByIdAndUpdate(req.player._id, { notificationRead: Date.now() }, {
    new: false,
    runValidators: true
  });
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc      Update firebase
// @route     PUT /api/v1/auth/savefbtoken/:id
// @access    Private/player
exports.savefbtoken = asyncHandler(async (req, res, next) => {
  if (!req.player) {
    return next(
      new ErrorResponse(`Player  not found`)
    );
  }

  player = await Player.findByIdAndUpdate(req.player._id, { 'firebaseToken': req.body.firebaseToken }, {
    new: false,
    runValidators: true

  });
  res.status(200).json({
    success: true,
    data: {}
  });
});
// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.poll = asyncHandler(async (req, res, next) => {


  if (!req.player || !req.body.id) {
    return next(
      new ErrorResponse(`Player  not found`)
    );
  }

  const polled = await PlayerPoll.findOne({ 'playerId': req.player.id, pollId: req.body.id });
  const poll = await Poll.find({ '_id': req.body.id, 'status': 'active' }).lean();

  if (!poll) {
    return next(
      new ErrorResponse(`Poll  not found`)
    );
  }

  if (!polled) {

    let m = await PlayerPoll.create({ 'playerId': req.player.id, pollId: req.body.id });

    let s = await poll.findByIdAndUpdate(req.body.id, { $inc: { poll: 1 } }, {
      new: false,
      runValidators: true

    });
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});
// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.pollList = asyncHandler(async (req, res, next) => {
  const list = await Poll.find({ 'status': 'active' }).lean();
  let x = list.map(d => {
    d['imageUrl'] = process.env.API_URI + '/files/' + d.imageId;

    return d;
  });
  res.status(200).json({
    success: true,
    data: x
  });
});

// @desc      Update refer
// @route     PUT /api/v1/auth/savefbtoken/:id
// @access    Private/player
exports.updateRefer = asyncHandler(async (req, res, next) => {
  if (!req.player) {
    return next(
      new ErrorResponse(`Player  not found`)
    );
  }
  if (!req.body.referId) {
    return next(
      new ErrorResponse(`refer id  not found`)
    );
  }

  let codeGiver = await Player.findOne({ 'refer_code': req.body.referId });
  if (!codeGiver || req.player.join_code || req.player.createdAt < codeGiver.createdAt) {
    return next(
      new ErrorResponse(`Player  not found`)
    );
  }

  const row = await Setting.findOne({ type: 'SITE', name: 'ADMIN' });
  let note = "Refrer bonus";
  let amount = row.lvl1_commission;
  let tranData = {
    'playerId': codeGiver._id,
    'amount': amount,
    'transactionType': "credit",
    'note': note,
    'prevBalance': codeGiver.balance,
    'logType': 'bonus',
    status: 'complete', paymentStatus: 'SUCCESS'
  }

  let tran = await Transaction.create(tranData);
  await tran.creditPlayerDeposit(amount);
  let player = await Player.findByIdAndUpdate(req.player._id, { 'join_code': req.body.referId }, {
    new: true,
    runValidators: true
  });

  await Player.findByIdAndUpdate(codeGiver._id, { $inc: { joinCount: 1 } }, {
    new: false,
    runValidators: true
  });
  console.log(codeGiver, row.lvl2_commission, 'refer bonus level 1');
  await referCommision(codeGiver.join_code, row.lvl2_commission, 'refer bonus level 2')
  res.status(200).json({
    success: true,
    data: player
  });
});

// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.getWinnerfeed = asyncHandler(async (req, res, next) => {
  const winners = await PlayerGame.find().limit(20).select({ 'amountWon': 1 }).populate({ path: 'playerId', select: { '_id': 0, 'firstName': 1 } });
  // console.log(banner);
  let x = winners.map(d => {

    let name = d.playerId.firstName || 'DUCKER'
    return name + ' Won ' + d.amountWon + ' ' + 'DKC';
  });
  res.status(200).json({
    success: true,
    data: x
  });
});

// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.getVersion = asyncHandler(async (req, res, next) => {
  const list = await Version.find();
  // console.log(banner);
  // let x = banner.map(d => {
  //   d['imageUrl'] = process.env.API_URI + '/files/' + d.imageId;
  //   return d;
  // });
  res.status(200).json({
    success: true,
    data: list
  });
});

// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.sendAppUrl = asyncHandler(async (req, res, next) => {
  let { mobile } = req.body;
  const sms = await Setting.findOne({ type: 'SMSGATEWAY', name: 'MSG91' });
  // Get reset token
  let vcode = "1234";

  let x = await smsOtp(mobile, vcode, sms);
  res.status(200).json({
    success: true,
    data: []
  });
});

let smsOtp = async (phone, otp, sms) => {

  var params = {
    "template_id": sms.one.TEMPLATE_ID,
    "mobile": phone,
    "authkey": sms.one.AUTHKEY,
    "otp": otp
  };
  console.error('sendingotp', otp, phone)
  return axios.get('https://api.msg91.com/api/v5/otp', { params }).catch(error => { console.error(error) });

}

let referCommision = async (code, amount, note) => {

  let parentPlayer1 = await Player.findOne({ 'refer_code': code });

  let tranData = {
    'playerId': parentPlayer1._id,
    'amount': amount,
    'transactionType': "credit",
    'note': note,
    'prevBalance': parentPlayer1.balance,
    'logType': 'bonus',
    status: 'complete', paymentStatus: 'SUCCESS'
  }

  let tran = await Transaction.create(tranData);

  await tran.creditPlayerDeposit(amount);

}