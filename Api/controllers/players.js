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
const cashfreeCtrl = require('./paymentsCashfree');
const PlayerOld = require('../models/PlayerOld');


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
  if (amount > req.player.winings) {
    return next(
      new ErrorResponse(`Insufficent wining Balance`)
    );
  }

  if (req.player.winings < 100) {
    return next(
      new ErrorResponse(`Wining Balance less than 100`)
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
    req.body['upiId'] = player.wallet.get('walletAddress');
  } else if (req.body.to === 'upi') {
    tranData['withdraw'] = player.upi;
    req.body['upiId'] = player.upi.get('upiId');
  }
  //tranData['gameId'] = gameId;
  if (!req.body['upiId']) {
    return next(
      new ErrorResponse('please add upi id')
    );
  }
  const upiStatus = await cashfreeCtrl.upiValidate(req, res, next);
  if (upiStatus['status'] !== 'SUCCESS') {
    return next(
      new ErrorResponse(upiStatus['message'])
    );
  }
  if (upiStatus.data.accountExists === 'NO') {
    return next(
      new ErrorResponse('Invalid Upi')
    );
  }


  let tran = await Transaction.create(tranData);
  player = await Player.findByIdAndUpdate(req.player.id, { $inc: { balance: -amount, winings: -amount } }, {
    new: true,
    runValidators: true
  });

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



  // const notificationDb = await Notification.create(notification);
  // let updated = { read: false }
  // await PlayerNotifcation.findOneAndUpdate({ playerId: req.player.id, notificationId: notificationDb._id }, updated, {
  //   new: false, upsert: true,
  //   runValidators: true
  // });
  // //console.log('sending message');

  // let to_player = await Player.findById(req.player.id).select('+firebaseToken');
  // var message = {
  //   notification: {
  //     title: title,
  //     body: title
  //   },
  //   // topic: "/topics/all",
  //   // token: ''
  // };
  // message['token'] = to_player.firebaseToken;

  // await admin.messaging().send(message)
  //   .then((response) => {
  //     // Response is a message ID string.
  //     console.log('Successfully sent message:', response);

  //   })
  //   .catch((error) => {
  //     console.log('Error sending message:', error);
  //   });

  //req.io.to('notification_channel').emit('res', { ev: 'notification_player', data: { "playerId": req.player.id } });


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
  //console.log('req.player'.red, req.player);
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

  // const upiStatus = await cashfreeCtrl.upiValidate(req, res, next);
  // if (upiStatus['status'] !== 'SUCCESS') {
  //   return next(
  //     new ErrorResponse(upiStatus['message'])
  //   );
  // }

  player = await Player.findByIdAndUpdate(player.id, { upi: fieldsToUpdate }, {
    new: true,
    runValidators: true
  });


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
  //console.log('row', row.data, tran);
  amount = row.data.details.orderAmount;
  if (row.data.details.orderStatus === 'PAID') {

    if (tran.membershipId) {

    } else {
      let fieldsToUpdate = {
        $inc: { balance: row.data.details.orderAmount, deposit: row.data.details.orderAmount }
      }

      player = await Player.findByIdAndUpdate(tran.playerId, fieldsToUpdate, {
        new: true,
        runValidators: true
      });
      await Transaction.findByIdAndUpdate(tran._id, { status: 'complete', paymentStatus: 'SUCCESS' });

      if (player.refrer_player_id) {
        playerStat = { $inc: { refer_deposit_count: 1 } };
        await Player.findByIdAndUpdate(player.refrer_player_id, playerStat, {
          new: true,
          runValidators: true
        });
      }


      // if (tran.couponId) {
      let coupon = await Coupon.findOne({ minAmount: { $gte: amount }, maxAmount: { $lte: amount }, active: true });
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


      //  }
      //handle coupon

    }
  } else {
    //await Transaction.findByIdAndUpdate(tran._id, { paymentStatus: row.data.details.orderStatus });
  }

  res.status(200).json({
    success: true,
    data: player
  });
});

exports.membership = asyncHandler(async (req, res, next) => {
  let { orderId } = req.body;
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
  // {
  //   details: {
  //     orderId: '628528ebdf38c5099b17e3b4',
  //     orderCurrency: 'INR',
  //     orderAmount: '10.00',
  //     orderNote: '_10-purchase',
  //     customerName: '',
  //     customerPhone: '918758989518',
  //     sellerPhone: '',
  //     orderStatus: 'PAID',
  //     addedOn: '2022-05-18 22:42:12'
  //   },
  //   status: 'OK'
  // } 
  const amount = row.data.details.orderAmount;
  if (row.data.details.orderStatus == 'PAID') {
    //if (tran) {
    player = await tran.memberShip(amount);
    if (player.refrer_player_id) {
      playerStat = { $inc: { refer_vip_count: 1 } };
      await Player.findByIdAndUpdate(player.refrer_player_id, playerStat, {
        new: true,
        runValidators: true
      });
    }


    await Player.findByIdAndUpdate(player.refrer_player_id, { $inc: { refer_vip_count: 1 } }, {
      new: true,
      runValidators: true
    });
    await Transaction.findByIdAndUpdate(tran._id, { status: 'complete', paymentStatus: 'SUCCESS' });
  } else {
    //await Transaction.findByIdAndUpdate(tran._id, { paymentStatus: row.data.details.orderStatus });
  }
  res.status(200).json({
    success: true,
    data: player
  });
  //console.log('player/membership');
});

// @desc      Get all Players
// @route     GET /api/v1/auth/Players
// @access    Private/Admin
exports.getPlayers = asyncHandler(async (req, res, next) => {
  let empty = { "data": [], "recordsTotal": 0, "recordsFiltered": 0, "draw": req.body.draw }
  //console.log(req.body);
  let filter = {
    limit: req.body.length,
    skip: req.body.start,
    find: req.query,
    search: {

    },
    sort: {
      _id: -1, email: 1, phone: 1
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
    filter['search'] = {
      value: req.body.search.value,
      fields: ['phone', 'email', 'firstName']
    }
  }
  if (req.body.status) {
    filter['find']['status'] = req.body.status;
  }
  Player.dataTables(filter).then(function (table) {
    res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
  })
  //res.status(200).json(res.advancedResults);
});

// @desc      Get all Players
// @route     GET /api/v1/auth/Players
// @access    Private/Admin
exports.playerold = asyncHandler(async (req, res, next) => {
  let empty = { "data": [], "recordsTotal": 0, "recordsFiltered": 0, "draw": req.body.draw }
  //console.log(req.body);
  let filter = {
    limit: req.body.length,
    skip: req.body.start,
    find: req.query,
    search: {

    },
    sort: {
      _id: -1, email: 1, phone: 1
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
    filter['search'] = {
      value: req.body.search.value,
      fields: ['phone', 'email', 'firstName']
    }
  }
  if (req.body.status) {
    filter['find']['status'] = req.body.status;
  }
  PlayerOld.dataTables(filter).then(function (table) {
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
    if (req.player.status === 'active') {
      player = await Player.findById(req.player._id).select('+panNumber +aadharNumber +bank +wallet +upi +firebaseToken +refer_code');
    } else {
      player = await Player.findById(req.player._id).select('+panNumber +aadharNumber +bank +wallet +upi +firebaseToken ');
    }

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
  console.log('updatePlayer');
  let { firstName, lastName, email, gender, country, aadharNumber, panNumber, dob, kycStatus, state } = req.body;
  let fieldsToUpdate = { firstName };
  let player;


  if (req.staff) {
    player = await Player.findById(req.params.id);
    fieldsToUpdate['kycStatus'] = kycStatus;
  } else if (req.player) {

    return next(
      new ErrorResponse(`Player  not found`)
    );
  }

  if (!player || player.status !== 'active') {
    return next(
      new ErrorResponse(`Player  not found`)
    );
  }

  if (!firstName && !player.firstName) {
    return next(
      new ErrorResponse(`firstName is requied`)
    );
  }
  if (firstName) { fieldsToUpdate['firstName'] = firstName; }
  if (lastName) { fieldsToUpdate['lastName'] = lastName; }

  if (gender) { fieldsToUpdate['gender'] = gender; }
  if (country) { fieldsToUpdate['country'] = country; }
  if (aadharNumber) { fieldsToUpdate['aadharNumber'] = aadharNumber; }
  if (panNumber) { fieldsToUpdate['panNumber'] = panNumber; }
  if (dob) { fieldsToUpdate['dob'] = dob; }
  if (state) { fieldsToUpdate['state'] = state; }
  if (!player.email) {
    if (email) { fieldsToUpdate['email'] = email; }
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
// @desc      Update Player
// @route     PUT /api/v1/auth/Players/:id
// @access    Private/Admin
exports.updateProfile = asyncHandler(async (req, res, next) => {
  console.log('updateProfile', req.body);
  let { phone, firstName } = req.body;
  let fieldsToUpdate = {};

  if (!req.player || req.player.status !== 'active') {
    return next(
      new ErrorResponse(`Player  not found`)
    );
  }
  if (!phone && !firstName) {
    return next(
      new ErrorResponse(`Provide details`)
    );
  }
  if (phone && !req.player.phone) {
    fieldsToUpdate['phone'] = phone;
  }
  if (firstName) {
    // fieldsToUpdate['firstName'] = firstName;
  }
  if (!fieldsToUpdate) {
    return next(
      new ErrorResponse(`Provide details`)
    );
  }
  let player = await Player.findByIdAndUpdate(req.player.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

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
  //await Player.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});
// @desc      Delete Player
// @route     DELETE /api/v1/auth/Players/:id
// @access    Private/Admin
exports.deletePlayerData = asyncHandler(async (req, res, next) => {
  // const player = await Player.findById(req.params.id);
  //console.log('deleting', req.params.id);
  const user = req.staff;

  if (user.role !== 'admin') {
    return next(
      new ErrorResponse(`Not Allowed`)
    );
  }
  await Transaction.deleteMany({ playerId: req.params.id });
  await Ticket.deleteMany({ playerId: req.params.id });
  await PlayerPoll.deleteMany({ playerId: req.params.id });
  await PlayerGame.deleteMany({ playerId: req.params.id });

  let ids = await PlayerNotifcation.find({ playerId: req.params.id });
  if (ids.length != 0) {
    ids = ids.map(d => d._id)
    await Notification.deleteMany({ _id: { $in: ids } });
    await PlayerNotifcation.deleteMany({ playerId: req.params.id });
  }

  await Player.findByIdAndDelete(req.params.id);
  res.status(200).json({
    success: true,
    data: {}
  });
});

exports.deloldplayer = asyncHandler(async (req, res, next) => {
  // const player = await Player.findById(req.params.id);
  //console.log('deleting', req.params.id);
  const user = req.staff;

  if (user.role !== 'admin') {
    return next(
      new ErrorResponse(`Not Allowed`)
    );
  }
  await PlayerOld.findByIdAndDelete(req.params.id);
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc      Delete Player
// @route     DELETE /api/v1/auth/Players/:id
// @access    Private/Admin
exports.deletePlayerDataBIds = asyncHandler(async (req, res, next) => {
  // const player = await Player.findById(req.params.id);
  // console.log('deletePlayerDataBIds', req.body);
  let { ids } = req.body;
  if (!ids || ids.length === 0) {
    return next(
      new ErrorResponse(`Select Players`)
    );
  }
  const user = req.staff;

  if (!ids || user.role !== 'admin') {
    return next(
      new ErrorResponse(`Not Allowed`)
    );
  }
  //await Transaction.deleteMany({ playerId: { $in: ids } });
  await Ticket.deleteMany({ playerId: { $in: ids } });
  await PlayerPoll.deleteMany({ playerId: { $in: ids } });
  await PlayerGame.deleteMany({ playerId: { $in: ids } });

  let nids = await PlayerNotifcation.find({ playerId: { $in: ids } });
  if (nids.length != 0) {
    nids = nids.map(d => d._id)
    await Notification.deleteMany({ _id: { $in: nids } });
    await PlayerNotifcation.deleteMany({ playerId: { $in: ids } });
  }

  await Player.deleteMany({ _id: { $in: ids } });
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
  if (req.player.status === 'notverified') {
    console.log('bonus-adding');
    const addamount = 10;
    //all ok new user 
    let fieldsToUpdate = {
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
    let tran = await Transaction.create(tranData);
    user = await Player.findByIdAndUpdate(user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });
  }

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
  //console.log('lllllllllllllllllllllllllllllllllllllll', user.password, req.body.pin, user.id)
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
    d['imageUrl'] = process.env.IMAGE_URL + d.lobbyImage;
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
  if (req.body.logType === 'join') {
    //Dashboard.join();
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
    'logType': 'deposit',
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
exports.creditBonus = asyncHandler(async (req, res, next) => {
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
  // if (!gameId) {
  //   return next(
  //     new ErrorResponse(`Game id requied`)
  //   );
  // }
  // if (req.player.bonus < amount) {
  //   return next(
  //     new ErrorResponse(`Insufficent bonus balance`)
  //   );
  // }

  let tranData = {
    'playerId': req.player._id,
    'amount': amount,
    'transactionType': "credit",
    'note': note,
    'prevBalance': req.player.balance, 'logType': 'deposit',
    status: 'complete', paymentStatus: 'SUCCESS'
  }

  //tranData['gameId'] = gameId;

  let tran = await Transaction.create(tranData);
  player = await tran.creditPlayerBonus(amount);

  res.status(200).json({
    success: true,
    data: player
  });
});

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.creditAmount = asyncHandler(async (req, res, next) => {
  console.log('creditAmount', req.body);
  let player = req.player;//await Player.findById(req.body.id);
  let { amount, note, gameId, adminCommision = 0, tournamentId, winner = 'winner_1', gameStatus = 'win' } = req.body;
  if (req.body.logType !== "won") {
    new ErrorResponse(`Invalid amount`);
  }
  if (!tournamentId) {
    return next(
      new ErrorResponse(`Invalid tournament`)
    );
  }
  if (amount < 0 || !gameId) {
    return next(
      new ErrorResponse(`Invalid amount`)
    );
  }
  if (!player) {
    return next(
      new ErrorResponse(`Player Not found`)
    );
  }
  let gameRec = await PlayerGame.findOne({ 'gameId': gameId, 'tournamentId': tournamentId });
  if (!gameRec) {
    return next(
      new ErrorResponse(`Invalid tournament`)
    );

  }
  amount = parseFloat(amount).toFixed(2);
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    return next(
      new ErrorResponse(`Tournament Not found`)
    );
  }


  const betAmout = parseFloat(tournament.betAmount) * 2;
  const winAmount = parseFloat(tournament.winnerRow.winner_1).toFixed(2);
  const commision = betAmout - winAmount;
  let PlayerAmount = winAmount;
  let paymentStatus = 'paid';
  if (amount < winAmount) {
    PlayerAmount = winAmount * 0.5;
    gameStatus = 'tie'
    paymentStatus = 'tie'
    if (gameRec.status === 'tie') {
      paymentStatus = 'paid'
    }
  }

  let playerGame = {
    'playerId': req.player._id,
    'amountWon': PlayerAmount,
    'tournamentId': tournamentId,
    'winner': winner,
    'gameId': gameId,
    'amountPaid': betAmout,
    'gameStatus': gameStatus,
    'note': note,
    'isBot': false,
    'status': paymentStatus,
    'gameStatus': 'won'
  }


  // let leaderboard = await PlayerGame.create(playerGame);


  let tranData = {
    'playerId': player._id,
    'amount': PlayerAmount,
    'transactionType': "credit",
    'note': note,
    'prevBalance': player.balance,
    'adminCommision': commision,
    status: 'complete', paymentStatus: 'SUCCESS',
    'logType': req.body.logType,
    'gameId': gameId
  }

  if (gameRec.status !== 'paid') {
    console.log('firsttime');
    let tran = await Transaction.create(tranData);
    player = await tran.creditPlayerWinings(PlayerAmount);
    if (gameRec.status === 'start') {
      Dashboard.totalIncome(betAmout, winAmount, commision);
    }

    let leaderboard = await PlayerGame.findOneAndUpdate({ 'gameId': gameId, 'tournamentId': tournamentId }, playerGame);
  }
  res.status(200).json({
    success: true,
    data: player
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
exports.saveLeaderBoard = asyncHandler(async (req, res, next) => {
  console.log('saveLeaderBoard', req.body);
  let { playerId, amount, note, gameId, adminCommision = 0, tournamentId, winner = 'winner_1', players = [] } = req.body;
  let leaderboard;
  let updatedData = { isBot: false }
  playersObj = JSON.parse(players);
  const winnerPlayer = playersObj.matchWinLeaderDatas.filter(x => x.userId === playerId)[0];
  const looserPlayer = playersObj.matchWinLeaderDatas.filter(x => x.userId !== playerId)[0];
  const tournament = await Tournament.findById(tournamentId);
  if (winnerPlayer.isBot) {

    const betAmout = parseFloat(tournament.betAmount) * 2;
    const winAmount = parseFloat(tournament.winnerRow.winner_1).toFixed(2);
    const commision = betAmout - winAmount;
    Dashboard.totalIncome(betAmout, winAmount, commision);
    updatedData['isBot'] = true;
    updatedData['playerId'] = looserPlayer.userId;
    updatedData['gameStatus'] = 'lost';
    updatedData['note'] = note
  }

  leaderboard = await PlayerGame.findOneAndUpdate({ 'gameId': gameId, 'tournamentId': tournamentId }, { 'players': players, "opponentName": looserPlayer.userName });

  res.status(200).json({
    success: true,
    data: leaderboard
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
    return process.env.IMAGE_URL + player.profilePic
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
    d['imageUrl'] = process.env.IMAGE_URL + d.couponImage;
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
  // console.log(banner);
  let x = banner.map(d => {
    d['imageUrl'] = process.env.IMAGE_URL + d.imageId;

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
    d['imageUrl'] = process.env.IMAGE_URL + d.giftImage;
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

  if (polled) {
    return next(new ErrorResponse(`Polled `));
  }

  let m = await PlayerPoll.create({ 'playerId': req.player.id, pollId: req.body.id });

  let s = await Poll.findByIdAndUpdate(req.body.id, { $inc: { poll: 1 } }, {
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
exports.pollList = asyncHandler(async (req, res, next) => {
  const list = await Poll.find({ 'status': 'active' }).lean();
  let x = list.map(d => {
    d['imageUrl'] = process.env.IMAGE_URL + d.imageId;

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
  console.log('updateRefer');
  let { referId } = req.body;
  if (!req.player || req.player.status !== 'active') {
    return next(
      new ErrorResponse(`Player  not found`)
    );
  }
  if (!referId) {
    return next(
      new ErrorResponse(`refer id  not found`)
    );
  }

  let codeGiver = await Player.findOne({ 'refer_code': req.body.referId, status: 'active' });
  if (!codeGiver || req.player.refrer_player_id || req.player.createdAt < codeGiver.createdAt) {
    return next(
      new ErrorResponse(`You already used someone referral code`)
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
  let player = await Player.findByIdAndUpdate(req.player._id, { 'refrer_player_id': codeGiver._id }, {
    new: true,
    runValidators: true
  });
  let playerStat = { $inc: { joinCount: 1, refer_count: 1, refer_lvl1_count: 1, refer_lvl1_total: amount, refrer_amount_total: amount } };
  if (codeGiver.refrer_level === 0) {
    playerStat['refrer_level'] = 1;
  }
  await Player.findByIdAndUpdate(codeGiver._id, playerStat, {
    new: true,
    runValidators: true
  });
  console.log('refrer level - 1');
  // if (codeGiver.refrer_player_id) {
  //   await referCommision(codeGiver.refrer_player_id, row.lvl2_commission, 'refer bonus level 2')

  // }
  res.status(200).json({
    success: true,
    data: player
  });
});

// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.getWinnerfeed = asyncHandler(async (req, res, next) => {

  const winners = await PlayerGame.find().sort({ "_id": -1 }).limit(20).select({ 'amountWon': 1 }).populate({ path: 'playerId', select: { '_id': 0, 'firstName': 1 } });

  let x = winners.map(d => {
    let name = 'DUCKE'
    if (d.playerId && d.playerId.firstName) {
      name = d.playerId.firstName;
    }

    return name + ' Won ' + d.amountWon + ' ' + res.app.get('site_setting').one.currency_symbol;
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
  //   d['imageUrl'] = process.env.IMAGE_URL + d.imageId;
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
  if (sms.one.TEMPLATE_APP_LINK_ID) {
    let x = await smsOtp('91' + mobile, vcode, sms);
  }

  res.status(200).json({
    success: true,
    data: []
  });
});

let smsOtp = async (phone, otp, sms) => {

  var params = {
    "template_id": sms.one.TEMPLATE_APP_LINK_ID,
    "mobile": phone,
    "authkey": sms.one.AUTHKEY,
    "URL": 'https://www.dukeplay.com/assets/DukePlay.apk'
  };
  console.error('sendingotp', otp, phone)
  return axios.get('https://api.msg91.com/api/v5/otp', { params }).catch(error => { console.error(error) });

}

let referCommision = async (player_id, amount, note) => {

  let parentPlayer1 = await Player.findOne({ '_id': player_id, status: 'active' });
  if (!parentPlayer1) {
    return;
  }
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
  let playerStat = { $inc: { refer_lvl2_count: 1, refer_lvl2_total: amount, refrer_amount_total: amount } };
  if (codeGiver.refrer_level === 1) {
    playerStat['refrer_level'] = 2;
  }
  await Player.findByIdAndUpdate(parentPlayer1._id, playerStat, {
    new: false,
    runValidators: true
  });
  console.log('refrer level - 2');

}

exports.checkUpi = asyncHandler(async (req, res, next) => {
  const { upiId } = req.body;
  if (!req.player || req.player.status !== 'active') {
    return next(
      new ErrorResponse(`Player  not found`)
    );
  }
  if (!upiId) {
    return next(new ErrorResponse('Please Provide Upi Id'));
  }

  // Check if password matches
  const upiRes = await cashfreeCtrl.upiValidate(req, res, next);
  console.log(upiRes);
  // Check for user
  if (upiRes['status'] != 'SUCCESS') {
    return next(new ErrorResponse('upi verification failed'));
  }
  if (upiRes.data.accountExists === 'YES') {
    let fieldsToUpdate = { upiId };
    let player = await Player.findByIdAndUpdate(req.player.id, { upi: fieldsToUpdate }, {
      new: true,
      runValidators: true
    });



    res.status(200).json({
      success: true,
      data: upiRes
    });

  } else {
    return next(new ErrorResponse('upi verification failed'));
  }


});