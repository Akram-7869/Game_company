const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Bot = require('../models/Bot');

// @desc      Get all Bots
// @route     GET /api/v1/auth/Bots
// @access    Private/Admin
exports.getBots = asyncHandler(async (req, res, next) => {
  ;
  Bot.dataTables({
    limit: req.body.length,
    skip: req.body.start,
    select: { 'complexity': 1, 'status': 1, 'createdAt': 1 },
    search: {
      value: req.body.search ? req.body.search.value : '',
      fields: ['complexity', 'status']
    },
    sort: {
      _id: -1
    }
  }).then(function (table) {
    res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
  })
  //res.status(200).json(res.advancedResults);
});

// @desc      Get single Bot
// @route     GET /api/v1/auth/Bots/:id
// @access    Private/Admin
exports.getBot = asyncHandler(async (req, res, next) => {
  const row = await Bot.findById(req.params.id);

  res.status(200).json({
    success: true,
    data: row
  });
});

// @desc      Create Bot
// @route     POST /api/v1/auth/Bots
// @access    Private/Admin
exports.createBot = asyncHandler(async (req, res, next) => {
  const row = await Bot.create(req.body);

  res.status(201).json({
    success: true,
    data: row
  });
});

// @desc      Update Bot
// @route     PUT /api/v1/auth/Bots/:id
// @access    Private/Admin
exports.updateBot = asyncHandler(async (req, res, next) => {
  let { status, complexity } = req.body
  let row = await Bot.findById(req.params.id);
  if (!row) {
    return next(
      new ErrorResponse(`Bot  not found`)
    );
  }
  let fieldsToUpdate = { status, complexity }

  row = await Bot.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  //Bot.isNew = false;
  // await Bot.save();
  res.status(200).json({
    success: true,
    data: row
  });
});

// @desc      Delete Bot
// @route     DELETE /api/v1/auth/Bots/:id
// @access    Private/Admin
exports.deleteBot = asyncHandler(async (req, res, next) => {
  const row = await Bot.findById(req.params.id);
  await Bot.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

