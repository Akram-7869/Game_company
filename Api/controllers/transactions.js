const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Transaction = require('../models/Transaction');
const Player = require('../models/Player');

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
    select: { 'amount': 1, 'transactionType': 1, 'note': 1, 'createdAt': 1, logType: 1, paymentStatus: '1' },
    search: {

    },
    find: { 'playerId': req.player._id },
    sort: {
      updatedAt: 1
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

  let filter = {
    limit: req.body.length,
    skip: req.body.start,
    select: { 'playerId': 1, 'amount': 1, 'transactionType': 1, 'note': 1, 'createdAt': 1, paymentStatus: 1 },
    search: {

    },
    find: {},
    populate: { path: 'playerId', select: { firstName: 1, lastName: 1, rank: 1, profilePic: 1 } },
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

  if (key) {
    if (isNaN(key)) {
      filter['find']['playerId'] = key;
    } else {
      let player = await Player.findOne({ phone: { '$regex': key, '$options': 'i' } });
      filter['find']['playerId'] = player._id;
    }
  }
  //plaerId filter
  if (req.body.playerId) {
    filter['find']['playerId'] = req.body.playerId;
  }
  if (req.query.logType) {
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
  const transaction = await Transaction.findById(req.params.id).populate({ path: 'playerId', select: { firstName: 1, lastName: 1, rank: 1, profilePic: 1 } });
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

// @desc      Create Transaction
// @route     POST /api/v1/auth/Transactions
// @access    Private/Admin
exports.createTransaction = asyncHandler(async (req, res, next) => {
  console.log('req.body'.red, req.body);
  let { amount, note, gameId, transactionType } = req.body;
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
  amount = parseInt(amount).toFixed(3);
  if (transactionType === 'credit') {
    fieldsToUpdate = {
      $inc: { balance: amount }
    }
  } else if (transactionType === 'debit') {
    fieldsToUpdate = {
      $inc: { balance: -amount }
    }
  }

  let commision = 0;
  let tranData = {
    'playerId': player._id,
    'amount': amount,
    'transactionType': transactionType,
    'note': note,
    'prevBalance': player.balance,
    status: 'complete', paymentStatus: 'SUCCESS'

  }

  const transaction = await Transaction.create(tranData);
  player = await Player.findByIdAndUpdate(player.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });
  res.status(201).json({
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

