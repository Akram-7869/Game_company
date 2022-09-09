const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const PlayerGame = require('../models/PlayerGame');
const Player = require('../models/Player');
const Transaction = require('../models/Transaction');
// @desc      Get all PlayerGames
// @route     GET /api/v1/auth/PlayerGames
// @access    Private/Admin
exports.getPlayerGames = asyncHandler(async (req, res, next) => {

  let filter = {
    limit: req.body.length,
    skip: req.body.start,
    //select: { 'gameId': 1, 'status': 1, 'createdAt': 1 },
    find: {},
    search: {
      value: req.body.search ? req.body.search.value : '',
      fields: ['opponentName', 'email', 'gameId', 'isbot']
    },
    columns: req.body.columns,
    populate: { path: 'playerId', select: { firstName: 1, lastName: 1, rank: 1, email: 1 } },
    sort: {
      _id: -1
    }
  };

  // let filter = { logType: 'won' };

  //plaerId filter
  if (req.body.playerId) {
    filter['find']['playerId'] = req.body.playerId;
  }
  // //date filter
  if (req.body.s_date && req.body.e_date) {
    filter['find']['createdAt'] = {
      $gte: req.body.s_date,
      $lt: req.body.e_date
    }

  }
  // let row = await Transaction.aggregate([{ $match: filter },
  // //, tr: "$transactionType", gr: "$groupStatus " 
  // {
  //   $group: { _id: "$playerId", n: { $sum: "$amount" } }
  // }
  //   , { $sort: { n: -1 } }
  //   , { $limit: 100 },
  // ]);
  // let x = await Player.populate(row, { path: "_id", select: { phone: 1, firstName: 1, lastName: 1, rank: 1, profilePic: 1 } });

  PlayerGame.dataTables(filter).then(function (table) {
    res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
  })
  //res.status(200).json({ data: row, recordsTotal: row.length, recordsFiltered: row.length, draw: req.body.draw });
});

// @desc      Get all PlayerGames
// @route     GET /api/v1/auth/PlayerGames
// @access    Private/Admin
exports.getPlayerLeaderBoard = asyncHandler(async (req, res, next) => {



  let filter = {};

  //plaerId filter
  // if (req.body.playerId) {
  //   filter['find']['playerId'] = req.body.playerId;
  // }
  // //date filter
  // if (req.body.s_date && req.body.e_date) {
  //   filter['find']['createdAt'] = {
  //     $gte: req.body.s_date,
  //     $lt: req.body.e_date
  //   }

  // }
  let row = await PlayerGame.aggregate([{ $match: filter },
  //, tr: "$transactionType", gr: "$groupStatus " 
  {
    $group: { _id: "$playerId", n: { $sum: 1 }, t: { $sum: "$amountWon" } }
  }
    , { $sort: { n: -1 } }
    , { $limit: 20 },
  ]);
  let x = await Player.populate(row, { path: "_id", select: { phone: 1, firstName: 1, lastName: 1, rank: 1, profilePic: 1 } });

  // PlayerGame.dataTables(filter).then(function (table) {
  //   res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
  // })
  res.status(200).json({ data: row, recordsTotal: row.length, recordsFiltered: row.length, draw: req.body.draw });
});
// @desc      Get single PlayerGame
// @route     GET /api/v1/auth/PlayerGames/:id
// @access    Private/Admin
exports.getPlayerGame = asyncHandler(async (req, res, next) => {
  const row = await PlayerGame.findById(req.params.id);

  res.status(200).json({
    success: true,
    data: row
  });
});

// @desc      Create PlayerGame
// @route     POST /api/v1/auth/PlayerGames
// @access    Private/Admin
exports.createPlayerGame = asyncHandler(async (req, res, next) => {
  const row = await PlayerGame.create(req.body);

  res.status(201).json({
    success: true,
    data: row
  });
});

// @desc      Update PlayerGame
// @route     PUT /api/v1/auth/PlayerGames/:id
// @access    Private/Admin
exports.updatePlayerGame = asyncHandler(async (req, res, next) => {
  let { status, complexity } = req.body
  let row = await PlayerGame.findById(req.params.id);
  if (!row) {
    return next(
      new ErrorResponse(`PlayerGame  not found`)
    );
  }
  let fieldsToUpdate = { status, complexity }

  row = await PlayerGame.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  //PlayerGame.isNew = false;
  // await PlayerGame.save();
  res.status(200).json({
    success: true,
    data: row
  });
});

// @desc      Delete PlayerGame
// @route     DELETE /api/v1/auth/PlayerGames/:id
// @access    Private/Admin
exports.deletePlayerGame = asyncHandler(async (req, res, next) => {
  const row = await PlayerGame.findById(req.params.id);
  await PlayerGame.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

