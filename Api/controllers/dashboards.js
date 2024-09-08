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

exports.getFranchiseDashboard = asyncHandler(async (req, res, next) => {
 
  let d={
    totalCommissions: req.user.totalCommissions,
    totalBalance:req.user.totalBalance,
    totalBetAmount:req.user.totalBetAmount,
    livePlayers :req.io.engine.clientsCount,
    totalPlayers :req.user.totalPlayers,
    stateCode:req.user.stateCode,
   }
  res.status(200).json(d);
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
  return [];
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
  return 0;
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
  const row = await Dashboard.findOne({ 'type': 'admin' }).lean();
  row['livePlayers'] = req.io.engine.clientsCount;


  row['totals'] = await calTotal();

  row['totalPlayers'] = await Player.estimatedDocumentCount();
  row['payoutCount'] = await Transaction.countDocuments({ logType: 'withdraw', paymentStatus: 'PROCESSING' });
  res.status(200).json({
    success: true,
    data: { row, graph: [] }
  });
});
let calIncome = async (s_date, e_date, userId ,role='influencer') => {
  const today = new Date();
  // Calculate tomorrow's date
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  // Set s_date to today if not provided
  const startDate = s_date ? new Date(s_date) : today;
  // Set e_date to tomorrow if not provided
  const endDate = e_date ? new Date(e_date) : tomorrow;

  const results = await PlayerGame.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lt: endDate },
        influencerId: userId
      }
    },
    {
      $group: {
        _id: "$game",
        totalBets: { $sum: "$amountBet" },
        totalWinnings: { $sum: "$amountWon" },
        totalGift: { $sum: "$amountGift" },
        playerCount: { $sum: 1 }
      }
    },
  
    {
      $addFields: {
        totalCommission: {$round: [{ $multiply: ["$totalBets", 0.07] }, 2] } // Calculate 20% commission on total bets
      }
    },
    {
      $project: {
        _id: 1,
        
        totalBets: 1,
        totalWinnings: 1,
        totalCommission: 1,
        playerCount: 1,
        totalGift:1
      }
    },
    { $sort: { totalBets: -1 } } // Optional: Sort by total bets descending
  

  ]);
  return results;


}
let calfranchiseIncome = async (s_date, e_date, user ) => {
  const today = new Date();
  // Calculate tomorrow's date
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  // Set s_date to today if not provided
  const startDate = s_date ? new Date(s_date) : today;
  // Set e_date to tomorrow if not provided
  const endDate = e_date ? new Date(e_date) : tomorrow;

  const results = await PlayerGame.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lt: endDate },
        stateCode: user.stateCode,
      },
    },
    
     {
      $group: {
        _id: "$game",
        totalBets: { $sum: "$amountBet" },
        totalWinnings: { $sum: "$amountWon" },
        playerCount: { $sum: 1 }
      }
    },
  
    {
      $addFields: {
        totalCommission: {$round: [{ $multiply: ["$totalBets", 0.07] }, 2] } // Calculate 20% commission on total bets
      }
    },
    {
      $project: {
        _id: 1,
        
        totalBets: 1,
        totalWinnings: 1,
        totalCommission: 1,
        playerCount: 1
      }
    },
    { $sort: { totalBets: -1 } } // Optional: Sort by total bets descending
  
 
  
  ]);
  return results;


}
let calTotal = async (s_date, e_date) => {
  const today = new Date();
  // Calculate tomorrow's date
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  // Set s_date to today if not provided
  const startDate = s_date ? new Date(s_date) : today;
  // Set e_date to tomorrow if not provided
  const endDate = e_date ? new Date(e_date) : tomorrow;

  const row = await Transaction.aggregate([
    {
      $match: {
        s_date: startDate,
        e_date: endDate,
        paymentStatus:'SUCCESS',
        logType: { $in: ["withdraw", "deposit"] }

      },
    },
    {
      $group:
      /**
       * _id: The id of the group.
       * fieldN: The first field name.
       */
      {
        _id: "$logType",
        Total: {
          $sum: "$amount",
        },
      },
    },
  ]);

  const withdrawalsTotal = row.find(item => item._id === 'withdraw');
  const depositsTotal = row.find(item => item._id === 'deposit');


  return {
    withdrawalsTotal: withdrawalsTotal ?? 0,
    depositsTotal: depositsTotal ?? 0,

  };


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
// @desc      Get single Dashboard
// @route     GET /api/v1/auth/Dashboards/filter/:id
// @access    Private/Admin
exports.totalIncome = asyncHandler(async (req, res, next) => {
  let income = await calTotal();
  let gameWiseStats = await getTopGames();


  //console.log('graph', graph, req.body)
  res.status(200).json({
    success: true,
    data: {gameWiseStats , income}
  });
});
exports.getInfluencerDashboard = asyncHandler(async (req, res, next) => {
  let d={
   totalGifts:req.user.totalGifts,
   totalCommissions: req.user.totalCommissions,
   totalBalance:req.user.totalBalance,
   totalBetAmount:req.user.totalBetAmount,
   livePlayers :req.io.engine.clientsCount
  }
 res.status(200).json(d);
});
exports.influencerIncome = asyncHandler(async (req, res, next) => {
  let  gameWiseStats = await calIncome(req.body.s_date, req.body.e_date, req.user._id);
  //console.log('graph', graph, req.body)
  res.status(200).json({
    success: true,
    data:  {gameWiseStats}
  });
});

exports.franchiseIncome = asyncHandler(async (req, res, next) => {
  let gameWiseStats = await calfranchiseIncome(req.body.s_date, req.body.e_date, req.user);
  //console.log('graph', graph, req.body)
  res.status(200).json({
    success: true,
    data: {gameWiseStats}
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

let getTopGames  = async (s_date, e_date) => {

 
  const today = new Date();
  // Calculate tomorrow's date
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  // Set s_date to today if not provided
  const startDate = s_date ? new Date(s_date) : today;
  // Set e_date to tomorrow if not provided
  const endDate = e_date ? new Date(e_date) : tomorrow;
  
  const results = await PlayerGame.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lt: endDate }, // Filter documents by date range
      },
    },
    {
      $group: {
        _id: "$game",
        totalBets: { $sum: "$amountBet" },
        totalWinnings: { $sum: "$amountWon" },
      },
    },
    {
      $addFields: {
        totalCommission: { $subtract: ["$totalBets", "$totalWinnings"] }, // Calculate totalCommission
      },
    },
    {
      $project: {
        _id: 1,
        totalBets: 1,
        totalWinnings: 1,
        totalCommission: 1,
      },
    },
    { $sort: { totalBets: -1 } }, // Optional: Sort by total bets descending
  ]);
  
  
  console.log('results',results);
  return results;
  }
  exports.getTopTournament = asyncHandler(async (req, res, next) => {
 
    const startDate = new Date("2024-09-01"); // Set your start date
    const endDate = new Date("2024-09-07"); // Set your end date
    
    const results = await PlayerGame.aggregate(
      [
        {
          $match: {
            createdAt: { $gte: startDate, $lt: endDate } // Filter documents by date range
          }
        },
        {
          $group: {
            _id: {
              gameId: "$tournamentId", // Group by game
            },
            totalPlayers: { $sum: 1 } // Increment count for each document
          }
        },
        {
          $sort: { "_id.day": 1, "_id.gameId": 1 } // Sort by day and game
        },
        {
          $project: {
            _id: 0,
            gameId: "$_id.gameId",
            day: "$_id.day",
            totalPlayers: 1
          }
        }
      ]
    );
    
    console.log('results',results);
    let d = results.length > 0 ? results[0] : { totalBetAmount: 0, playerCount: 0, gameCount: 0, commission: 0 };
    res.status(200).json(d);
    });
  exports.getTopPlayers = asyncHandler(async (req, res, next) => {
 
      const startDate = new Date("2024-09-01"); // Set your start date
      const endDate = new Date("2024-09-07"); // Set your end date
      
      const results = await PlayerGame.aggregate(
        [
          {
            $match: {
              createdAt: { $gte: startDate, $lt: endDate } // Filter documents by date range
            }
          },
          {
            $group: {
              _id: {
                gameId: "$playerId", // Group by game
              },
              totalPlayers: { $sum: 1 } // Increment count for each document
            }
          },
          {
            $sort: { "_id.day": 1, "_id.gameId": 1 } // Sort by day and game
          },
          {
            $project: {
              _id: 0,
              gameId: "$_id.gameId",
              day: "$_id.day",
              totalPlayers: 1
            }
          }
        ]
      );
      
      console.log('results',results);
      let d = results.length > 0 ? results[0] : { totalBetAmount: 0, playerCount: 0, gameCount: 0, commission: 0 };
      res.status(200).json(d);
      });