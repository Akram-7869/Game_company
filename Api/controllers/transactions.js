const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Transaction = require('../models/Transaction');
const Player = require('../models/Player');
//const PlayerNotifcation = require('../models/PlayerNotifcation');
//const Notification = require('../models/Notification');
//const admin = require('../utils/fiebase');
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
    select: { 'taxableAmount': 1, 'tds': 1, 'totalAmount': 1, 'amount': 1, 'transactionType': 1, 'note': 1, 'createdAt': 1, logType: 1, paymentStatus: 1 },
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
    select: { 'stateCode': 1, 'logType': 1, 'taxableAmount': 1, 'tds': 1, 'totalAmount': 1, 'withdrawTo': 1, 'playerId': 1, 'amount': 1, 'transactionType': 1, 'note': 1, 'createdAt': 1, paymentStatus: 1 },
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
  if (req.body.logType) {
    filter['find']['logType'] = req.body.logType;
  }
  if (key) {


    let player = await Player.findOne({ $or: [{ 'email': { '$regex': key, '$options': 'i' } }, { phone: { '$regex': key, '$options': 'i' } }] });
    if (!player) {
      return res.json(empty);
    }

    filter['find']['playerId'] = player._id;
  }


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

  if (req.body.stateCode) {
    filter['find']['stateCode'] = req.body.stateCode;
  }

  if(req.role === 'influencer'){
    filter['find']['influencerId'] = req.user._id;
}else if(req.role === 'franchise'){
    filter['find']['franchiseId'] = req.user._id;

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
    player = await transaction.declineWithDrawPlayer(amount);
  } else if (req.body.paymentStatus === 'SUCCESS' && transaction.logType === 'deposit') {
    player = await transaction.creditPlayerDeposit(amount);
    await handleCoupon(transaction);
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

  if (req.userSocketMap[playerId]) {
    let socketId = req.userSocketMap[playerId]['socket_id'];
    req.io.to(socketId).emit('res', { ev: 'approved_notify', data: { "playerId": playerId, transaction } });

  }





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
    'logType': logType,
    'stateCode': player.stateCode


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

// @desc      Get all Transactions
// @route     GET /api/v1/auth/Transactions
// @access    Private/Admin
exports.getTdsRecord = asyncHandler(async (req, res, next) => {
  let empty = { "data": [], "recordsTotal": 0, "recordsFiltered": 0, "draw": req.query.draw }
  let filter = { 'logType': 'withdraw' };
  if (req.query.status && req.query.status != 'All') {
    filter['status'] = req.query.status;
  }
  if (req.query.paymentStatus) {
    filter['paymentStatus'] = req.query.paymentStatus;
  }

  if (req.query.transactionType) {
    filter['transactionType'] = req.query.transactionType;
  }
  let key = req.query.email;
  if (key) {


    let player = await Player.findOne({ $or: [{ 'email': { '$regex': key, '$options': 'i' } }, { phone: { '$regex': key, '$options': 'i' } }] });
    if (!player) {
      return res.json(empty);
    }

    filter['playerId'] = player._id;
  }

  //plaerId filter
  if (req.query.rf && req.query.rfv) {
    filter[req.query.rf] = { '$regex': req.query.rfv, '$options': 'i' };
  }
  if (req.query.logType) {
    filter['logType'] = req.query.logType;
  }


  if (req.query.s_date && req.query.e_date) {
    filter['createdAt'] = {
      $gte: new Date(req.query.s_date),
      $lt: new Date(req.query.e_date)
    }

  }

  if (req.query.stateCode) {
    filter['stateCode'] = req.query.stateCode;
  }
  let rows = [];
  if (req.query.report === 'download') {
    rows = Transaction.aggregate([
      {
        $match: filter
      },
      {
        $group: {
          _id: "$playerId",
          totalTds: { $sum: "$tds" },
          totalTaxAmount: { $sum: "$taxableAmount" },

        }
      },
      {
        $lookup: {
          from: "players",
          localField: "_id",
          foreignField: "_id",
          as: "player"
        }
      },
      {
        $unwind: "$player"
      },
      {
        $project: {
          totalTds: 1,
          email: "$player.email",
          panNumber: "$player.panNumber",
          firstName: "$player.firstName",
          totalTaxAmount: 1
        }
      }
    ]);
    // const filename = =="saved_from_db.csv";
    const columns = [
      "id",
      "firstName",
      "panNumber",
      "totalTaxAmount",
      "totalTds",
    ];
    res.write(['From : ', req.query.s_date, ' to: ', req.query.e_date].join(', ') + '\n');
    res.write(columns.join(', ') + '\n');
    let s = [];
    for await (const row of rows) {


      s[0] = row._id ?? '';
      s[1] = row.firstName ?? '';
      s[2] = row.panNumber ?? '';
      s[3] = row.totalTaxAmount ?? 0;
      s[4] = row.totalTds ?? 0;

      res.write(s.join(', ') + '\n');
    }
    res.end();
  } else if (req.query.report === 'datewise') {
    await dateWiseTds(filter, req, res);
  }




});

let dateWiseTds = async (filter, req, res) => {
  let rows = [];
  rows = Transaction.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {

          day: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          playerId: "$playerId",

        },
        totalTds: { $sum: "$tds" },
        totalTaxAmount: { $sum: "$taxableAmount" },
      },
    },
    {
      $sort: {
        "_id.day": 1
      }
    },
    {
      $lookup: {
        from: "players",
        localField: "_id.playerId",
        foreignField: "_id",
        as: "player",
      },
    },
    {
      $project: {
        _id: 0,
        totalTds: 1,
        email: {
          $arrayElemAt: ["$player.email", 0],
        },
        panNumber: {
          $arrayElemAt: ["$player.panNumber", 0],
        },
        firstName: {
          $arrayElemAt: ["$player.firstName", 0],
        },
        day: "$_id.day",
        id: "$_id.playerId",
        totalTaxAmount: 1,
      },
    },
  ]);
  // const filename = "saved_from_db.csv";
  const columns = [
    "id",
    "firstName",
    "panNumber",
    "totalTaxAmount",
    "totalTds",
    'date'
  ];
  res.write(['From : ', req.query.s_date, ' to: ', req.query.e_date].join(', ') + '\n');
  res.write(columns.join(', ') + '\n');
  let s = [];
  for await (const row of rows) {


    s[0] = row.id ?? '';
    s[1] = row.firstName ?? '';
    s[2] = row.panNumber ?? '';
    s[3] = row.totalTaxAmount ?? 0;
    s[4] = row.totalTds ?? 0;
    s[5] = row.day ?? '';

    res.write(s.join(', ') + '\n');

  }
  res.end();

}
let dateWiseAdminCommission = async (filter, req, res) => {
  let rows = [];
  rows = Transaction.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          day: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          stateCode: "$stateCode",

        },
        totalCommision: { $sum: "$adminCommision" },
      },
    },
    {
      $sort: {
        "_id.day": 1
      }
    },

    {
      $project: {
        _id: 0,
        totalCommision: 1,
        day: "$_id.day",
        stateCode: "$_id.stateCode",
      },
    },
  ]);
  // const filename = "saved_from_db.csv";
  const columns = [
    "stateCode",
    "totalCommision",
    'date'
  ];
  res.write(['From : ', req.query.s_date, ' to: ', req.query.e_date].join(', ') + '\n');
  res.write(columns.join(', ') + '\n');
  let s = [];
  for await (const row of rows) {
    s[0] = row.stateCode ?? '';
    s[1] = row.totalCommision ?? 0;
    s[2] = row.day ?? 0;

    res.write(s.join(', ') + '\n');
  }
  res.end();

}

// @desc      Get all Transactions
// @route     GET /api/v1/auth/Transactions
// @access    Private/Admin
exports.getAdminCommission = asyncHandler(async (req, res, next) => {
  let empty = { "data": [], "recordsTotal": 0, "recordsFiltered": 0, "draw": req.query.draw }
  let filter = {};
  if (req.query.status && req.query.status != 'All') {
    filter['status'] = req.query.status;
  }
  if (req.query.paymentStatus) {
    filter['paymentStatus'] = req.query.paymentStatus;
  }

  if (req.query.transactionType) {
    filter['transactionType'] = req.query.transactionType;
  }
  let key = req.query.email;
  if (key) {


    let player = await Player.findOne({ $or: [{ 'email': { '$regex': key, '$options': 'i' } }, { phone: { '$regex': key, '$options': 'i' } }] });
    if (!player) {
      return res.json(empty);
    }

    filter['playerId'] = player._id;
  }

  //plaerId filter
  if (req.query.rf && req.query.rfv) {
    filter[req.query.rf] = { '$regex': req.query.rfv, '$options': 'i' };
  }
  if (req.query.logType) {
    filter['logType'] = req.query.logType;
  }
  if (req.query.s_date && req.query.e_date) {
    filter['createdAt'] = {
      $gte: new Date(req.query.s_date),
      $lt: new Date(req.query.e_date)
    }

  }

  if (req.query.stateCode) {
    filter['stateCode'] = req.query.stateCode;
  }
  let rows = [];
  if (req.query.report === 'download') {
    rows = Transaction.aggregate([
      {
        $match: filter
      },
      {
        $group: {
          _id: "$stateCode",
          totalCommision: { $sum: "$adminCommision" },
        }
      },
      {
        $project: {
          totalCommision: 1
        }
      }
    ]);
    const columns = [
      "stateCode",
      "totalCommision",


    ];
    res.write(['From : ', req.query.s_date, ' to: ', req.query.e_date].join(', ') + '\n');
    res.write(columns.join(', ') + '\n');
    let s = [];
    for await (const row of rows) {
      s[0] = row._id ?? '';
      s[1] = row.totalCommision ?? 0;

      res.write(s.join(', ') + '\n');
    }
    res.end();
  } else if (req.query.report === 'datewise') {
    await dateWiseAdminCommission(filter, req, res);
  }
  //res.status(200).json(res.advancedResults);
});


// @desc      Get all Transactions
// @route     GET /api/v1/auth/Transactions
// @access    Private/Admin
exports.getGstRecord = asyncHandler(async (req, res, next) => {
  let empty = { "data": [], "recordsTotal": 0, "recordsFiltered": 0, "draw": req.query.draw }
  let filter = { 'logType': 'deposit' };
  if (req.query.status && req.query.status != 'All') {
    filter['status'] = req.query.status;
  }
  if (req.query.paymentStatus) {
    filter['paymentStatus'] = req.query.paymentStatus;
  }

  if (req.query.transactionType) {
    filter['transactionType'] = req.query.transactionType;
  }
  let key = req.query.email;
  if (key) {


    let player = await Player.findOne({ $or: [{ 'email': { '$regex': key, '$options': 'i' } }, { phone: { '$regex': key, '$options': 'i' } }] });
    if (!player) {
      return res.json(empty);
    }

    filter['playerId'] = player._id;
  }

  //plaerId filter
  if (req.query.rf && req.query.rfv) {
    filter[req.query.rf] = { '$regex': req.query.rfv, '$options': 'i' };
  }
  if (req.query.logType) {
    filter['logType'] = req.query.logType;
  }
  if (req.query.s_date && req.query.e_date) {
    filter['createdAt'] = {
      $gte: new Date(req.query.s_date),
      $lt: new Date(req.query.e_date)
    }

  }

  if (req.query.stateCode) {
    filter['stateCode'] = req.query.stateCode;
  }
  let rows = [];
  if (req.query.report === 'download') {
    rows = Transaction.aggregate([
      {
        $match: filter
      },
      {
        $group: {
          _id: "$stateCode",
          totalGst: { $sum: "$gst" },
        }
      },
      {
        $project: {
          totalGst: 1
        }
      }
    ]);
    const columns = [
      "stateCode",
      "totalGst",


    ];
    res.write(['From : ', req.query.s_date, ' to: ', req.query.e_date].join(', ') + '\n');
    res.write(columns.join(', ') + '\n');
    let s = [];
    for await (const row of rows) {
      s[0] = row._id ?? '';
      s[1] = row.totalGst ?? 0;

      res.write(s.join(', ') + '\n');
    }
    res.end();
  } else if (req.query.report === 'datewise') {
    await dateWiseGST(filter, req, res);
  }
  //res.status(200).json(res.advancedResults);
});

let dateWiseGST = async (filter, req, res) => {
  let rows = [];
  rows = Transaction.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          day: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          stateCode: "$stateCode",

        },
        totalGst: { $sum: "$gst" },
      },
    },
    {
      $sort: {
        "_id.day": 1
      }
    },

    {
      $project: {
        _id: 0,
        totalGst: 1,
        day: "$_id.day",
        stateCode: "$_id.stateCode",
      },
    },
  ]);
  // const filename = "saved_from_db.csv";
  const columns = [
    "stateCode",
    "totalGst",
    'date'
  ];
  res.write(['From : ', req.query.s_date, ' to: ', req.query.e_date].join(', ') + '\n');
  res.write(columns.join(', ') + '\n');
  let s = [];
  for await (const row of rows) {
    s[0] = row.stateCode ?? '';
    s[1] = row.totalGst ?? 0;
    s[2] = row.day ?? 0;

    res.write(s.join(', ') + '\n');
  }
  res.end();

}
let handleCoupon = async (tran) => {
  if (tran.couponId) {
    let bonusAmount = 0;
    let amount = tran.amount;

    let couponRec = await Coupon.findOne({ 'minAmount': { $lte: amount }, 'maxAmount': { $gte: amount }, '_id': tran.couponId });
    if (!couponRec) {
      console.log('Coupon not found');
      res.status(200);
      return;
    }
    if (couponRec.couponType == 'percentage') {
      bonusAmount = amount * (couponRec.couponAmount * 0.01);
    } else {
      bonusAmount = couponRec.couponAmount;
    }

    let tranBonusData = {
      'playerId': tran.playerId,
      'amount': bonusAmount,
      'transactionType': "credit",
      'note': 'Bonus amount',
      'paymentGateway': 'Cashfree Pay',
      'logType': 'bonus',
      'prevBalance': player.balance,
      'paymentStatus': 'SUCCESS',
      'status': 'complete',
      'paymentId': tran._id,
      'stateCode': player.stateCode

    }
   let bonusTran = await Transaction.create(tranBonusData);
    bonusTran.creditPlayerBonus(bonusAmount);
    console.log('bonus added');

  }
}
