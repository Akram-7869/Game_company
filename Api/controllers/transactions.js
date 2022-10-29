const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Transaction = require('../models/Transaction');
const Player = require('../models/Player');
const PlayerNotifcation = require('../models/PlayerNotifcation');
const Notification = require('../models/Notification');
const admin = require('../utils/fiebase');
// @desc      Get all Transactions
// @route     GET /api/v1/auth/Transactions
// @access    Private/Admin
exports.getPlayerTransaction = asyncHandler(async (req, res, next) => {

  if (!req.player) {
    return next(
      new ErrorResponse(`Transaction  not found`)
    );
  }
  // console.log(req.player._id)

  Transaction.dataTables({
    limit: 1000,
    skip: 0,
    select: { 'amount': 1, 'transactionType': 1, 'note': 1, 'createdAt': 1, logType: 1, paymentStatus: 1 },
    search: {

    },
    find: { 'playerId': req.player._id },
    sort: {
      updatedAt: -1
    }
  }).then(function (table) {
    res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
  })
  //res.status(200).json(res.advancedResults);
});

// @desc      Get all Transactions
// @route     GET /api/v1/auth/Transactions
// @access    Private/Admin
exports.getTransactions = asyncHandler(async (req, res, next) => {
  let empty = { "data": [], "recordsTotal": 0, "recordsFiltered": 0, "draw": req.body.draw }
  let filter = {
    limit: req.body.length,
    skip: req.body.start,
    find: req.query,
    select: { 'withdrawTo': 1, 'playerId': 1, 'amount': 1, 'transactionType': 1, 'note': 1, 'createdAt': 1, paymentStatus: 1 },
    search: {

    },

    populate: {
      path: 'playerId', select: { firstName: 1, lastName: 1, phone: 1, rank: 1, profilePic: 1, email: 1 }, options: { sort: { 'membership': -1 } }
    },
    sort: {
      _id: -1
    }
  };
  let key = req.body.search ? req.body.search.value : '';
  if (req.body.status && req.body.status != 'All') {
    filter['find']['status'] = req.body.status;
  }
  if (req.body.paymentStatus) {
    filter['find']['paymentStatus'] = req.body.paymentStatus;
  }

  if (req.body.transactionType) {
    filter['find']['transactionType'] = req.body.transactionType;
  }
  if (key) {


    let player = await Player.findOne({ $or: [{ 'email': { '$regex': key, '$options': 'i' } }, { phone: { '$regex': key, '$options': 'i' } }] });
    if (!player) {
      return res.json(empty);
    }

    filter['find']['playerId'] = player._id;
  }

  //plaerId filter
  if (req.body.rf && req.body.rfv) {
    filter['find'][req.body.rf] = { '$regex': req.body.rfv, '$options': 'i' };
  }
  if (req.body.logType) {
    filter['find']['logType'] = req.query.logType;
  }
  if (req.body._id) {
    filter['find']['_id'] = req.body._id;
  }

  if (req.body.s_date && req.body.e_date) {
    filter['find']['createdAt'] = {
      $gte: req.body.s_date,
      $lt: req.body.e_date
    }

  }



  Transaction.dataTables(filter).then(function (table) {
    res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
  })
  //res.status(200).json(res.advancedResults);
});

// @desc      Get single Transaction
// @route     GET /api/v1/auth/Transactions/:id
// @access    Private/Admin
exports.getTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);

  res.status(200).json({
    success: true,
    data: transaction
  });
});
// @desc      Get single Transaction
// @route     GET /api/v1/auth/Transactions/:id
// @access    Private/Admin
exports.getPayoutDetail = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id).populate({ path: 'playerId' });
  res.status(200).json({
    success: true,
    data: transaction
  });
});
exports.updatePayoutDetail = asyncHandler(async (req, res, next) => {

  let transaction = await Transaction.findById(req.params.id);
  if (!transaction) {
    return next(
      new ErrorResponse(`Transaction  not found`)
    );
  }
  let fieldsToUpdate = { paymentStatus: req.body.paymentStatus, status: 'complete', paymentStatus: req.body.paymentStatus, note: req.body.note }
  let amount = transaction.amount;
  let playerId = transaction.playerId

  transaction = await Transaction.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  if (req.body.paymentStatus === 'DECLINED') {
    player = await transaction.creditPlayerWinings(amount);
  }


  let title = `Rs.${amount} ${req.body.paymentStatus} `;
  let notification = {
    title: title,
    message: req.body.note,
    sendTo: 'player',
    status: 'active',

  }

  // const notificationDb = await Notification.create(notification);
  // let updated = { read: false }
  // await PlayerNotifcation.findOneAndUpdate({ playerId: transaction.playerId, notificationId: notificationDb._id }, updated, {
  //   new: false, upsert: true,
  //   runValidators: true
  // });
  // //console.log('sending message');

  // let to_player = await Player.findById(transaction.playerId).select('+firebaseToken');
  // var message = {
  //   notification: {
  //     title: title,
  //     body: req.body.note
  //   },
  //   // topic: "/topics/all",
  //   // token: ''
  // };
  // message['token'] = to_player.firebaseToken;
  // console.log('COnstructinmessage:', message);
  // await admin.messaging().send(message)
  //   .then((response) => {
  //     // Response is a message ID string.
  //     console.log('Successfully sent message:', response);

  //   })
  //   .catch((error) => {
  //     console.log('Error sending message:', error);
  //   });

  //req.io.to('notification_channel').emit('res', { ev: 'notification_player', data: { "playerId": transaction.playerId } });





  res.status(200).json({
    success: true,
    data: transaction
  });
});

// @desc      Create Transaction
// @route     POST /api/v1/auth/Transactions
// @access    Private/Admin
exports.createTransaction = asyncHandler(async (req, res, next) => {
  // console.log('req.body'.red, req.body);
  let { amount, note, gameId, transactionType, logType } = req.body;
  let player = await Player.findById(req.params.id);
  let fieldsToUpdate;
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
  amount = parseFloat(amount).toFixed(2);


  let commision = 0;
  let tranData = {
    'playerId': player._id,
    'amount': amount,
    'transactionType': transactionType,
    'note': note,
    'prevBalance': player.balance,
    status: 'complete', paymentStatus: 'SUCCESS',
    'logType': logType

  }

  const transaction = await Transaction.create(tranData);
  if (transactionType === 'credit') {
    if (logType === 'won') {
      player = await transaction.creditPlayerWinings(amount);
    } else if (logType === 'bonus') {
      player = await transaction.creditPlayerBonus(amount);
    } else if (logType === 'deposit') {
      player = await transaction.creditPlayerDeposit(amount);
    }
  } else if (transactionType === 'debit') {
    if (logType === 'won') {
      player = await transaction.debitPlayerWinings(amount);
    } else if (logType === 'bonus') {
      player = await transaction.debitPlayerBonus(amount);
    } else if (logType === 'deposit') {
      player = await transaction.debitPlayerDeposit(amount);
    }
  }

  let title = `Rs. ${amount} ${transactionType} `;
  let notification = {
    title: title,
    message: title,
    sendTo: 'player',
    status: 'active',

  }



  // const notificationDb = await Notification.create(notification);
  // let updated = { read: false }
  // await PlayerNotifcation.findOneAndUpdate({ playerId: req.params.id, notificationId: notificationDb._id }, updated, {
  //   new: false, upsert: true,
  //   runValidators: true
  // });
  // //console.log('sending message');

  // let to_player = await Player.findById(req.params.id).select('+firebaseToken');
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
  //req.io.to('notification_channel').emit('res', { ev: 'notification_player', data: { "playerId": req.params.id } });

  res.status(200).json({
    success: true,
    data: player
  });
});

// @desc      Update Transaction
// @route     PUT /api/v1/auth/Transactions/:id
// @access    Private/Admin
exports.updateTransaction = asyncHandler(async (req, res, next) => {
  let { one, many } = req.body
  let transaction = await Transaction.findById(req.params.id);
  if (!transaction) {
    return next(
      new ErrorResponse(`Transaction  not found`)
    );
  }
  let fieldsToUpdate = { one, many }

  transaction = await Transaction.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  //Transaction.isNew = false;
  // await Transaction.save();
  res.status(200).json({
    success: true,
    data: transaction
  });
});

// @desc      Delete Transaction
// @route     DELETE /api/v1/auth/Transactions/:id
// @access    Private/Admin
exports.deleteTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);
  await Transaction.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

