const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Dashboard = require('../models/Dashboard');
const Player = require('../models/Player');
const Transaction = require('../models/Transaction');
const Ticket = require('../models/Ticket');
const PlayerGame = require('../models/PlayerGame');
// @desc      Get all Dashboards
// @desc      Get all Dashboards
// @route     GET /api/v1/auth/Dashboards
// @access    Private/Admin
exports.getDashboards = asyncHandler(async (req, res, next) => {
  Dashboard.dataTables({
    limit: req.body.length,
    skip: req.body.start,
    //select: { 'gameId': 1, 'status': 1, 'createdAt': 1 },
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

// @desc      Get single Dashboard
// @route     GET /api/v1/auth/Dashboards/:id
// @access    Private/Admin
exports.getDashboard = asyncHandler(async (req, res, next) => {

  const row = await Dashboard.findById(req.params.id);
  res.locals = { title: 'Dashboard', adminUrl: process.env.ADMIN_URL };
  res.status(200).json({
    success: true,
    data: row
  });
});
// @desc      Get single Dashboard
// @route     GET /api/v1/auth/Dashboards/:id
// @access    Private/Admin
const getGraphData = async (req) => {
  if (req.period === 'year') {
    return getGraphMonth(req)
  }
  const row = await Transaction.aggregate([
    {
      $match: {
        'createdAt': {
          $gte: new Date(req.body.s_date),
          $lt: new Date(req.body.e_date)
        },
        logType: req.body.logType
      }
    },
    {
      $group:
      {
        _id: { day: { $dayOfMonth: "$createdAt" }, year: { $year: "$createdAt" }, "month": { "$month": "$createdAt" } },
        totalAmount: { $sum: "$amount" },

      }
    },
    {
      "$addFields": {
        "_id": {
          "$concat": [
            { "$toString": "$_id.month" },
            "/",
            { "$toString": "$_id.day" },
            "/",
            { "$toString": "$_id.year" },
          ]
        },
        "month": {
          "$toString": "$_id.month"
        },
        "year": {
          "$toString": "$_id.year"
        },
        "day": {
          "$toString": "$_id.day"
        },
        "week": {
          "$toString": "$_id.week"
        }
      }
    }
  ]);
  return row;
};

const getGraphMonth = async (req) => {

  const row = await Transaction.aggregate([
    {
      $match: {
        'createdAt': {
          $gte: new Date(req.body.s_date),
          $lt: new Date(req.body.e_date)
        },
        logType: req.body.logType
      }
    },
    {
      $group:
      {
        _id: { day: { $dayOfMonth: "$createdAt" }, year: { $year: "$createdAt" }, "month": { "$month": "$createdAt" } },
        totalAmount: { $sum: "$amount" },

      }
    },
    {
      "$addFields": {
        "_id": {
          "$concat": [
            { "$toString": "$_id.month" },
            "/",
            { "$toString": "$_id.day" },
            "/",
            { "$toString": "$_id.year" },
          ]
        },
        "month": {
          "$toString": "$_id.month"
        },
        "year": {
          "$toString": "$_id.year"
        },
        "day": {
          "$toString": "$_id.day"
        },
        "week": {
          "$toString": "$_id.week"
        }
      }
    }
  ]);
  return row;
};

const adminCommision = async () => {
  const row = await Transaction.aggregate([
    {
      '$group': {
        '_id': null,
        'totalIncome': {
          '$sum': '$adminCommision'
        }
      }
    }
  ]);
  if (row.length === 0) {
    return 0;
  }
  console.log(row);
  return row[0].totalIncome;
}
// @desc      Get single Dashboard
// @route     GET /api/v1/auth/Dashboards/filter/:id
// @access    Private/Admin
exports.getFilterDashboard = asyncHandler(async (req, res, next) => {
  const row = await Dashboard.findOne({ 'type': req.params.type }).lean();
  row['livePlayers'] = req.io.engine.clientsCount;
  let payout = await payoutTotal();
  //console.log('payoutTotal', payout);
  row['withdrawRequest'] = payout['totalCount'];
  row['withdrawTotal'] = payout['totalWithdraw'];

  row['supportRequest'] = await Ticket.countDocuments();
  row['gameCount'] = await PlayerGame.countDocuments();
  row['totalIncome'] = await adminCommision();
  const graph = await getGraphData(req);
  row['totals'] = await calTotal();


  res.status(200).json({
    success: true,
    data: { row, graph }
  });
});
let calTotal = async () => {

  const total = await Player.aggregate([{
    $group: {
      _id: null,
      bonusTotal: {
        $sum: "$bonus"
      },
      balanceTotal: {
        $sum: "$balance"
      },
      depositTotal: {
        $sum: "$deposit"
      },
      winingsTotal: {
        $sum: "$winings"
      }
    }
  }]);
  console.log('total', total);
  if (total.length === 0) {
    return {
      bonusTotal: 0,
      balanceTotal: 0,
      winingsTotal: 0
    };
  }
  return total[0];

}
const payoutTotal = async () => {

  const row = await Transaction.aggregate([
    { '$match': { logType: 'withdraw', paymentStatus: 'PROCESSING' } },
    {

      '$group': {
        '_id': null,
        'totalWithdraw': {
          '$sum': '$amount'
        },
        'totalCount': {
          '$sum': 1
        }
      }
    }
  ]);
  if (!row[0]) {
    return { 'totalWithdraw': 0, 'totalCount': 0 };
  }
  return row[0];
}
// @desc      Get single Dashboard
// @route     GET /api/v1/auth/Dashboards/filter/:id
// @access    Private/Admin
exports.getGraphData = asyncHandler(async (req, res, next) => {

  const graph = await getGraphData(req);
  //console.log('graph', graph, req.body)
  res.status(200).json({
    success: true,
    data: { graph }
  });
});

// @desc      Create Dashboard
// @route     POST /api/v1/auth/Dashboards
// @access    Private/Admin
exports.createDashboard = asyncHandler(async (req, res, next) => {
  const row = await Dashboard.create(req.body);

  res.status(201).json({
    success: true,
    data: row
  });
});

// @desc      Update Dashboard
// @route     PUT /api/v1/auth/Dashboards/:id
// @access    Private/Admin
exports.updateDashboard = asyncHandler(async (req, res, next) => {
  let { status, complexity } = req.body
  let row = await Dashboard.findById(req.params.id);
  if (!row) {
    return next(
      new ErrorResponse(`Dashboard  not found`)
    );
  }
  let fieldsToUpdate = { status, complexity }

  row = await Dashboard.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  //Dashboard.isNew = false;
  // await Dashboard.save();
  res.status(200).json({
    success: true,
    data: row
  });
});

// @desc      Delete Dashboard
// @route     DELETE /api/v1/auth/Dashboards/:id
// @access    Private/Admin
exports.deleteDashboard = asyncHandler(async (req, res, next) => {
  const row = await Dashboard.findById(req.params.id);
  await Dashboard.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

