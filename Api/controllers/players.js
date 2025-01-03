const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Player = require("../models/Player");
const Transaction = require("../models/Transaction");
const Ticket = require("../models/Ticket");
const File = require("../models/File");
const Dashboard = require("../models/Dashboard");
const { request } = require("express");
const Setting = require("../models/Setting");
//const Lobby = require('../models/Lobby');
const Coupon = require("../models/Coupon");
//const Gift = require('../models/Gift');
const PlayerNotifcation = require("../models/PlayerNotifcation");
const Notification = require("../models/Notification");
//const admin = require('../utils/fiebase');
const Tournament = require("../models/Tournament");
const Banner = require("../models/Banner");
const PlayerPoll = require("../models/PlayerPoll");
const Poll = require("../models/Poll");
const PlayerGame = require("../models/PlayerGame");
const Franchise = require("../models/Franchise");
const Influencer = require("../models/Influencer");
const User = require("../models/User");
const Version = require("../models/Version");
const moment = require("moment");
const cashfreeCtrl = require("./paymentsCashfree");
const mongoose = require("mongoose");
const {
  Types: { ObjectId },
} = mongoose;
var path = require("path");
const { uploadFile, deletDiskFile, getKey } = require("../utils/utils");
const { state, gameName } = require("../utils/JoinRoom");

let axios = require("axios");
const FormData = require("form-data");
const Commission = require("../models/Commission");
const PlayerInfluencer = require("../models/PlayerInfluencer");
const WallPost = require("../models/WallPost");

const checkOrderStatus = async (trxId) => {
  const row = await Setting.findOne({ type: "PAYMENT", name: "CASHFREE" });
  let data = new FormData();
  data.append("appId", row.one.APP_ID);
  data.append("secretKey", row.one.SECRET_KEY);
  data.append("orderId", trxId);

  let config = {
    method: "post",
    url: "https://api.cashfree.com/api/v1/order/info",
    headers: {
      ...data.getHeaders(),
    },
    data: data,
  };

  return await axios(config);
};
exports.withDrawRequest = asyncHandler(async (req, res, next) => {
  let { amount, note, gameId, to, upiId } = req.body;

  if (!req.player) {
    return next(new ErrorResponse(`Player Not Found`));
  }

  if (!amount || amount < 0) {
    return next(new ErrorResponse(`Invalid amount`));
  }
  if (amount > req.player.balance) {
    return next(new ErrorResponse(`Insufficent wining Balance`));
  }
  const row = await Setting.findOne({ type: "SITE", name: "ADMIN" });

  if (amount < row.minwithdraw) {
    return next(new ErrorResponse(`Minimum Withdraw ${row.minwithdraw}`));
  }

  // if (req.player.phoneStatus !== 'verified') {
  //   return next(
  //     new ErrorResponse(`Please Verify Phone`)
  //   );
  // }
  let player = await Player.findById(req.player._id).select(
    "+bank +wallet +upi"
  );

  // console.log('req.player---->',req.player)
  console.log('req.body---->',req.body)
  

  let tranData = {
    playerId: req.player._id,
    amount: amount,
    transactionType: "debit",
    note: note,
    prevBalance: req.player.balance,
    status: "log",
    logType: "withdraw",
    withdrawTo: req.body.to,
    stateCode: req.player.stateCode,
    paymentStatus: "REQUESTED",
    coins: req.body.coins,
    value: req.body.value,
    type: req.body.type,
    walletAddress:req.body.walletAddress 


  };
  if (req.body.to === "bank") {
    tranData["withdraw"] = player.bank;
  } else if (req.body.to === "wallet") {
    tranData["withdraw"] = player.wallet;
    req.body["upiId"] = player.wallet.get("walletAddress");
  } else if (req.body.to === "upi") {
    tranData["withdraw"] = { upiId: upiId };
    req.body["upiId"] = upiId;
  }
  //tranData['gameId'] = gameId;

  // const upiStatus = await cashfreeCtrl.upiValidate(req, res, next);
  // if (upiStatus['status'] !== 'SUCCESS') {
  //   return next(
  //     new ErrorResponse(upiStatus['message'])
  //   );
  // }
  // if (upiStatus.data.accountExists === 'NO') {
  //   return next(
  //     new ErrorResponse('Invalid Upi')
  //   );
  // }

  let taxableAmount =
    player.totalWithdraw +
    parseFloat(amount) -
    player.totalDeposit -
    player.totalTaxableAmount -
    player.openingBalance;
  let tds = 0;
  let totalAmount = 0;
  let incFiled = { balance: -amount, winings: -amount, totalWithdraw: amount };

  if (taxableAmount > 0) {
    tds = taxableAmount * parseFloat(row.tds * 0.01);
    incFiled["totalTaxableAmount"] = taxableAmount;
    incFiled["totalTds"] = tds;
  } else {
    taxableAmount = 0;
    tds = 0;
  }

  totalAmount = amount - tds;
  totalAmount = parseFloat(totalAmount).toFixed(2);
  tranData["totalAmount"] = totalAmount;

  tranData["taxableAmount"] = taxableAmount;
  tranData["tds"] = tds;
  // console.log(player.totalWithdraw, amount, player.totalDeposit, player.totalTaxableAmount, player.openingBalance, tranData);
  let tran = await Transaction.create(tranData);
  player = await Player.findByIdAndUpdate(
    req.player._id,
    { $inc: incFiled },
    {
      new: true,
      runValidators: true,
    }
  );

  let dash = await Dashboard.findOneAndUpdate(
    { type: "dashboard" },
    { $set: { $inc: { totalPayoutRequest: 1 } } },
    {
      new: true,
      runValidators: true,
    }
  );

  let title = `Withdraw Request Rs. ${amount}  `;
  let notification = {
    title: title,
    message: title,
    sendTo: "player",
    status: "active",
  };

  // const notificationDb = await Notification.create(notification);
  // let updated = { read: false }
  // await PlayerNotifcation.findOneAndUpdate({ playerId: req.player._id, notificationId: notificationDb._id }, updated, {
  //   new: false, upsert: true,
  //   runValidators: true
  // });
  // //console.log('sending message');

  // let to_player = await Player.findById(req.player._id).select('+firebaseToken');
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

  //req.io.to('notification_channel').emit('res', { ev: 'notification_player', data: { "playerId": req.player._id } });

  res.status(200).json({
    success: true,
    data: player,
  });
});

exports.addBank = asyncHandler(async (req, res, next) => {
  let { bankName, bankAccount, bankIfc, bankAddress, bankAccountHolder } =
    req.body;
  let fieldsToUpdate = {
    bankName,
    bankAccount,
    bankIfc,
    bankAddress,
    bankAccountHolder,
  };
  let player;
  if (!bankAccount || !bankIfc || !bankAccountHolder) {
    return next(new ErrorResponse(`All fields are requied`));
  }
  if (req.staff) {
    player = await Player.findById(req.params.id);
    // fieldsToUpdate['kycStatus'] = kycStatus;
  } else if (req.player) {
    player = req.player;
  }
  //console.log('req.player'.red, req.player);
  if (!player) {
    return next(new ErrorResponse(`Player  not found`));
  }

  player = await Player.findByIdAndUpdate(
    player.id,
    { bank: fieldsToUpdate },
    {
      new: true,
      runValidators: true,
    }
  );

  //Player.isNew = false;
  // await Player.save();
  res.status(200).json({
    success: true,
    data: player,
  });
});
exports.addWallet = asyncHandler(async (req, res, next) => {
  let { walletAddress, walletName } = req.body;
  let fieldsToUpdate = { walletName, walletAddress };
  let player;
  if (!walletName || !walletAddress) {
    return next(new ErrorResponse(`All fields are requied`));
  }
  if (req.staff) {
    player = await Player.findById(req.params.id);
    //fieldsToUpdate['kycStatus'] = kycStatus;
  } else if (req.player) {
    player = req.player;
  }
  if (!player) {
    return next(new ErrorResponse(`Player  not found`));
  }
  player = await Player.findByIdAndUpdate(
    player.id,
    { wallet: fieldsToUpdate },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: player,
  });
});
exports.addUpi = asyncHandler(async (req, res, next) => {
  let { upiId } = req.body;
  let fieldsToUpdate = { upiId };
  let player = req.player;
  if (!upiId) {
    return next(new ErrorResponse(`All fields are requied`));
  }
  if (!player) {
    return next(new ErrorResponse(`Player  not found`));
  }

  // const upiStatus = await cashfreeCtrl.upiValidate(req, res, next);
  // if (upiStatus['status'] !== 'SUCCESS') {
  //   return next(
  //     new ErrorResponse(upiStatus['message'])
  //   );
  // }

  player = await Player.findByIdAndUpdate(
    player.id,
    { upi: fieldsToUpdate },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: player,
  });
});
exports.addMoney = asyncHandler(async (req, res, next) => {
  let { orderId } = req.body;
  let player = req.player;
  // if (!amount || amount < 0) {
  //   return next(
  //     new ErrorResponse(`Invalid amount`)
  //   );
  // }
  if (!req.player) {
    return next(new ErrorResponse(`Player Not Found`));
  }
  if (!orderId) {
    return next(new ErrorResponse(`Order Not Found`));
  }

  let tran = await Transaction.findOne({
    _id: orderId,
    paymentStatus: "SUCCESS",
  });
  if (!tran) {
    return next(new ErrorResponse(`Transaction faild`));
  }

  res.status(200).json({
    success: true,
    data: player,
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
    return next(new ErrorResponse(`Player Not Found`));
  }
  if (!orderId) {
    return next(new ErrorResponse(`Order Not Found`));
  }

  let tran = await Transaction.findOne({ _id: orderId, status: "log" });
  if (!tran) {
    return next(new ErrorResponse(`Transaction not found`));
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
  if (row.data.details.orderStatus == "PAID") {
    //if (tran) {
    player = await tran.memberShip(amount);
    if (player.refrer_player_id) {
      playerStat = { $inc: { refer_vip_count: 1 } };
      await Player.findByIdAndUpdate(player.refrer_player_id, playerStat, {
        new: true,
        runValidators: true,
      });
    }

    await Player.findByIdAndUpdate(
      player.refrer_player_id,
      { $inc: { refer_vip_count: 1 } },
      {
        new: true,
        runValidators: true,
      }
    );
    await Transaction.findByIdAndUpdate(tran._id, {
      status: "complete",
      paymentStatus: "SUCCESS",
    });
  } else {
    //await Transaction.findByIdAndUpdate(tran._id, { paymentStatus: row.data.details.orderStatus });
  }
  res.status(200).json({
    success: true,
    data: player,
  });
  //console.log('player/membership');
});

// @desc      Get all Players
// @route     GET /api/v1/auth/Players
// @access    Private/Admin
exports.getPlayers = asyncHandler(async (req, res, next) => {
  let empty = {
    data: [],
    recordsTotal: 0,
    recordsFiltered: 0,
    draw: req.body.draw,
  };
  //console.log(req.body);
  let filter = {
    limit: req.body.length,
    skip: req.body.start,
    find: req.query,
    search: {},
    sort: {
      _id: -1,
      email: 1,
      phone: 1,
    },
  };
  if (req.body.s_date && req.body.e_date) {
    req.query["createdAt"] = {
      $gte: req.body.s_date,
      $lt: req.body.e_date,
    };
  }

  let key = req.body.search ? req.body.search.value : "";
  if (key) {
    filter["search"] = {
      value: req.body.search.value,
      fields: ["phone", "email", "firstName"],
    };
  }
  if (req.body.status) {
    filter["find"]["status"] = req.body.status;
  }
  Player.dataTables(filter).then(function (table) {
    res.json({
      data: table.data,
      recordsTotal: table.total,
      recordsFiltered: table.total,
      draw: req.body.draw,
    }); // table.total, table.data
  });
  //res.status(200).json(res.advancedResults);
});

// @desc      Get single Player
// @route     GET /api/v1/auth/Players/:id
// @access    Private/Admin
exports.getPlayer = asyncHandler(async (req, res, next) => {
  let player;
  //set
  if (req.staff) {
    player = await Player.findById(req.params.id).select(
      "+panNumber +aadharNumber +bank +wallet +upi +firebaseToken +usdt"
    );
  } else {
    //player = req.player;
    if (req.player.status === "active") {
      player = await Player.findById(req.player._id).select(
        "+panNumber +aadharNumber +bank +wallet +upi +firebaseToken +refer_code +usdt"
      );
    } else {
      player = await Player.findById(req.player._id).select(
        "+panNumber +aadharNumber +bank +wallet +upi +firebaseToken +usdt"
      );
    }
  }

  if (!player) {
    return next(new ErrorResponse(`Player  not found`));
  }

  player["profileUrl"] = "dfdfdfdf";

  res.status(200).json({
    success: true,
    data: player,
  });
});

// @desc      Create Player
// @route     POST /api/v1/auth/Players
// @access    Private/Admin
exports.createPlayer = asyncHandler(async (req, res, next) => {
  // const player = await Player.create(req.body);

  res.status(201).json({
    success: true,
    data: Player,
  });
});

// @desc      Update Player
// @route     PUT /api/v1/auth/Players/:id
// @access    Private/Admin
exports.updatePlayer = asyncHandler(async (req, res, next) => {
  console.log("updatePlayer");
  let {
    firstName,
    lastName,
    email,
    gender,
    country,
    aadharNumber,
    panNumber,
    dob,
    kycStatus,
    state,
  } = req.body;
  let fieldsToUpdate = { firstName };
  let player;

  if (req.staff) {
    player = await Player.findById(req.params.id);
    fieldsToUpdate["kycStatus"] = kycStatus;
  } else if (req.player) {
    return next(new ErrorResponse(`Player  not found`));
  }

  if (!player || player.status !== "active") {
    return next(new ErrorResponse(`Player  not found`));
  }

  if (!firstName && !player.firstName) {
    return next(new ErrorResponse(`firstName is requied`));
  }
  if (firstName) {
    fieldsToUpdate["firstName"] = firstName;
  }
  if (lastName) {
    fieldsToUpdate["lastName"] = lastName;
  }

  if (gender) {
    fieldsToUpdate["gender"] = gender;
  }
  if (country) {
    fieldsToUpdate["country"] = country;
  }
  if (aadharNumber) {
    fieldsToUpdate["aadharNumber"] = aadharNumber;
  }
  if (panNumber) {
    fieldsToUpdate["panNumber"] = panNumber;
  }
  if (dob) {
    fieldsToUpdate["dob"] = dob;
  }
  if (state) {
    fieldsToUpdate["state"] = state;
  }
  if (!player.email) {
    if (email) {
      fieldsToUpdate["email"] = email;
    }
  }

  player = await Player.findByIdAndUpdate(player.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  //Player.isNew = false;
  // await Player.save();
  res.status(200).json({
    success: true,
    data: player,
  });
});
// @desc      Update Player
// @route     PUT /api/v1/auth/Players/:id
// @access    Private/Admin
exports.updateProfile = asyncHandler(async (req, res, next) => {
  console.log("updateProfile", req.body);
  let {
    firstName,
    lastName,
    email,
    gender,
    country,
    aadharNumber,
    panNumber,
    dob,
    kycStatus,
    state,
    phone = "",
    playerProfileUrl,
  } = req.body;
  let fieldsToUpdate = {};

  if (!req.player || req.player.status !== "active") {
    return next(new ErrorResponse(`Player  not found`));
  }
  if (phone) {
    let checkPhone = await Player.findOne({
      phone: phone,
      playerId: { $neq: req.player._id },
    }).select({ phone: 1 });
    if (checkPhone) {
      return next(new ErrorResponse(`Phone Register With other Player`));
    }

    if (phone && !req.player.phone) {
      fieldsToUpdate["phone"] = phone;
    }
  }

  if (firstName) {
    fieldsToUpdate["firstName"] = firstName;
  }
  if (lastName) {
    fieldsToUpdate["lastName"] = lastName;
  }

  if (gender) {
    fieldsToUpdate["gender"] = gender;
  }
  if (country) {
    fieldsToUpdate["country"] = country;
  }
  if (aadharNumber) {
    fieldsToUpdate["aadharNumber"] = aadharNumber;
  }
  if (panNumber) {
    fieldsToUpdate["panNumber"] = panNumber;
  }
  if (dob) {
    fieldsToUpdate["dob"] = dob;
  }
  if (playerProfileUrl) {
    fieldsToUpdate["playerProfileUrl"] = playerProfileUrl;
  }
  //if (state) { fieldsToUpdate['state'] = state; }
  // if (!player.email) {
  //   if (email) { fieldsToUpdate['email'] = email; }
  // }

  let player = await Player.findByIdAndUpdate(req.player._id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: player,
  });
});

exports.updatePlayerImage = asyncHandler(async (req, res, next) => {
  console.log("Request body:", req.body);
  console.log("Request body ID:", req.body.id, "File:", req.files);

  // Retrieve the player by ID
  let player = await Player.findById(req.body.id);
  if (!player) {
    return next(new ErrorResponse(`Player not found`, 404));
  }

  // Check if files are uploaded
  if (!req.files || !req.files.file) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  // Construct filename and remove old profile picture if it exists
  const file = req.files.file;
  const filename = `/img/player/${req.body.id}/${file.name}`;

  if (player.profilePic) {
    const filePath = path.resolve(
      __dirname,
      "../../assets/" + player.profilePic
    );
    deletDiskFile(filePath); // Ensure `deletDiskFile` is defined to handle file deletion
  }

  // Upload the new file
  uploadFile(req, filename, res); // Ensure this function uploads the file as expected

  // Update player's profile picture in the database
  const fieldsToUpdate = { profilePic: filename };
  player = await Player.findByIdAndUpdate(player.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: player,
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
    data: {},
  });
});
// @desc      Delete Player
// @route     DELETE /api/v1/auth/Players/:id
// @access    Private/Admin
exports.deletePlayerData = asyncHandler(async (req, res, next) => {
  // const player = await Player.findById(req.params.id);
  //console.log('deleting', req.params.id);
  const user = req.staff;

  if (user.role !== "admin") {
    return next(new ErrorResponse(`Not Allowed`));
  }
  await Transaction.deleteMany({ playerId: req.params.id });
  //await Ticket.deleteMany({ playerId: req.params.id });
  await PlayerPoll.deleteMany({ playerId: req.params.id });
  await PlayerGame.deleteMany({ playerId: req.params.id });

  await Player.findByIdAndDelete(req.params.id);
  res.status(200).json({
    success: true,
    data: {},
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
    return next(new ErrorResponse(`Select Players`));
  }
  const user = req.staff;

  if (!ids || user.role !== "admin") {
    return next(new ErrorResponse(`Not Allowed`));
  }
  await Transaction.deleteMany({ playerId: { $in: ids } });
  //await Ticket.deleteMany({ playerId: { $in: ids } });
  await PlayerPoll.deleteMany({ playerId: { $in: ids } });
  await PlayerGame.deleteMany({ playerId: { $in: ids } });

  await Player.deleteMany({ _id: { $in: ids } });
  res.status(200).json({
    success: true,
    data: {},
  });
});
// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.setPin = asyncHandler(async (req, res, next) => {
  const { pin } = req.body;

  if (!pin || !req.player || req.player.role !== "player") {
    return next(new ErrorResponse("user not found"));
  }

  // Check for user
  let user = await Player.findByIdAndUpdate(
    req.player._id,
    { password: pin },
    {
      new: true,
      runValidators: true,
    }
  );
  if (req.player.status === "notverified") {
    console.log("bonus-adding");
    const addamount = 10;
    //all ok new user
    let fieldsToUpdate = {
      status: "active",
      $inc: { balance: addamount, deposit: addamount },
    };

    let tranData = {
      playerId: user._id,
      amount: addamount,
      transactionType: "credit",
      note: "player register",
      prevBalance: user.balance,
      status: "complete",
      paymentStatus: "SUCCESS",
      stateCode: req.player.stateCode,
    };
    let tran = await Transaction.create(tranData);
    user = await Player.findByIdAndUpdate(user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
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
    return next(new ErrorResponse("authentication faild"));
  }

  // Check for user
  const user = await Player.findOne({ _id: playerId }).select("+password");

  if (!user) {
    return next(new ErrorResponse("user not found"));
  }
  //console.log('lllllllllllllllllllllllllllllllllllllll', user.password, req.body.pin, user.id)
  // Check if password matches
  const isMatch = user.password === req.body.pin;
  // Check for user
  if (!isMatch) {
    return next(new ErrorResponse("authentication faild"));
  }
  // sendTokenResponse(user, 200, res);

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
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
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
      lastName: user.lastName,
    });
};

exports.join = asyncHandler(async (req, res, next) => {
  //dahboard online +
  // player game add {gameStatus='playing', amountPaid:'10'}
  // player stat
  // let fieldsToUpdate = { playerId: req.player._id, logType: 'join', amountPaid: req.body.amountPaid };
  // let tran = await Transactions.findOneAndUpdate({ playerId: req.player._id, gameId: req.body.gameId }, fieldsToUpdate, {
  //   new: true, upsert: true,
  //   runValidators: true
  // });
  // let addamount = req.body.amountPaid;
  // let dashUpdate = { $inc: { livePlayer: 1 }, $inc: { grossIncome: addamount } }
  // let dash = await Dashboard.findOneAndUpdate({ type: 'dashboard' }, dashUpdate, {
  //   new: true, upsert: true,
  //   runValidators: true
  // });
  // let player = await Player.joinCount(req.player._id);
  res.status(200).json({
    success: true,
    data: {},
  });
});

exports.won = asyncHandler(async (req, res, next) => {
  let player = req.player; //await Player.findById(req.body.id);
  let {
    betNo = 0,
    amount,
    note,
    gameId,
    adminCommision = 0,
    tournamentId,
    winner = "winner_1",
    gameStatus = "win",
    claimed = "",
  } = req.body;
  console.log("creditAmount", req.body);
  if (req.body.logType !== "won") {
    return next(new ErrorResponse(`Invalid amount`));
  }
  if (!tournamentId) {
    return next(new ErrorResponse(`Invalid tournament`));
  }
  if (amount < 0.0 || !gameId) {
    return next(new ErrorResponse(`Invalid amount`));
  }
  if (!player) {
    return next(new ErrorResponse(`Player Not found`));
  }
  let gameRec = await PlayerGame.findOne({
    gameId: gameId,
    tournamentId: tournamentId,
  });
  if (!gameRec) {
    return next(new ErrorResponse(`Game not found`));
  }
  amount = parseFloat(amount).toFixed(2);
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    return next(new ErrorResponse(`Tournament Not found`));
  }
  //get amount
  if (tournament.mode === gameName.tambola) {
    winner = claimed;

    const count = await PlayerGame.countDocuments({
      gameId: gameId,
      tournamentId: tournamentId,
      winner: winner, // Ensure this is defined
    });
    if (count >= tournament.numberOfWinners) {
      return next(new ErrorResponse(`All Claimed`));
    }
    amount = tournament.winnerRow[claimed];
  }

  let playerGame = {
    playerId: req.player._id,
    $inc: { amountWon: amount },
    // 'tournamentId': tournamentId,
    winner: winner,
    gameId: gameId,
    gameStatus: "won",
    note: note,
    status: "paid",
  };
  let tranData = {
    playerId: player._id,
    amount: amount,
    transactionType: "credit",
    note: note,
    prevBalance: player.balance,
    adminCommision: adminCommision,
    status: "complete",
    paymentStatus: "SUCCESS",
    logType: req.body.logType,
    gameId: gameId,
    betNo,
  };

  let tran = await Transaction.create(tranData);
  player = await tran.creditPlayerWinings(amount);

  // let commisonInf = {
  //   'gameId': gameId,
  // }
  // if (tournament.influencerId) {
  //   commisonInf['influencerId'] = tournament.influencerId;
  //   commisonInf['influencerCommission'] = parseFloat((adminCommision * 0.7).toFixed(2));

  //   await Influencer.findByIdAndUpdate(tournament.influencerId, {
  //     $inc: {
  //       totalBalance: commisonInf['influencerCommission'],
  //       totalCommissions: commisonInf['influencerCommission']
  //     }
  //   });

  // }

  // if (player.stateCode) {
  //   let franchiseDoc = await Franchise.findOne({ stateCode: player.stateCode, status: 'active' });
  //   if (franchiseDoc) {
  //     commisonInf['franchiseId'] = franchiseDoc._id;
  //     commisonInf['franchiseCommission'] = parseFloat((adminCommision * 0.3).toFixed(2));

  //     await Franchise.findByIdAndUpdate(franchiseDoc._id, {
  //       $inc: {
  //         totalBalance: commisonInf['franchiseCommission'],
  //         totalCommissions: commisonInf['franchiseCommission']
  //       }
  //     });
  //   }
  // }

  // const options = {
  //   new: true,          // Return the modified document rather than the original
  //   upsert: true,       // Create the document if it doesn't exist
  //   setDefaultsOnInsert: true  // Use schema default values if creating a new document
  // };
  // await Commission.findOneAndUpdate({ gameId }, commisonInf, options);

  await PlayerGame.findOneAndUpdate(
    { gameId: gameId, playerId: req.player._id },
    playerGame
  );

  res.status(200).json({
    success: true,
    data: player,
  });
});

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.ticketAdd = asyncHandler(async (req, res, next) => {
  let filename;

  if (req.files) {
    filename = "/img/ticket/" + req.player._id + "/" + req.files.file.name;
    uploadFile(req, filename, res);
    req.body["ticketImage"] = filename;
  }
  req.body["playerId"] = req.player._id;
  const row = await Ticket.create(req.body);

  res.status(200).json({
    success: true,
    data: row,
  });
});

exports.ticketList = asyncHandler(async (req, res, next) => {
  let row = await Ticket.find({ playerId: req.player._id }).populate(
    "playerId"
  );
  res.status(200).json({
    success: true,
    data: row,
  });
});

exports.getLobbys = asyncHandler(async (req, res, next) => {
  let rows = await Lobby.find({ active: true }).lean();
  let x = rows.map((d) => {
    d["imageUrl"] = process.env.IMAGE_URL + d.lobbyImage;
    return d;
  });
  // console.log('dsdsdsdsdsd', x);
  res.status(200).json({
    success: true,
    data: x,
  });
});

exports.ticketReply = asyncHandler(async (req, res, next) => {
  //req.body['playerId'] = req.player._id
  if (!req.player) {
    return next(new ErrorResponse(`Please Login`));
  }
  let row = await Ticket.findById(req.body.id).populate("playerId");
  if (!row) {
    return next(new ErrorResponse(`Ticket  not found`));
  }
  let reply = { reply: req.body.history, from: req.player.firstName };
  let fieldsToUpdate = {
    status: req.body.status,
    $addToSet: { history: reply },
  };

  row = await Ticket.findByIdAndUpdate(req.body.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: row,
  });
});

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.debiteAmount = asyncHandler(async (req, res, next) => {
  console.log("req.body", req.body);
  let { amount, note, gameId, betNo = 0, tournamentId, logType } = req.body;
  console.log("debiteAmount =", gameId);
  if (!amount || amount < 0) {
    return next(new ErrorResponse(`Invalid amount`));
  }
  if (!req.player) {
    return next(new ErrorResponse(`Invalid Code`));
  }
  if (!gameId) {
    return next(new ErrorResponse(`Game id requied`));
  }
  let tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    return next(new ErrorResponse(`tournament id requied`));
  }
  let total = req.player.balance + req.player.winings;
  if (total < amount) {
    return next(new ErrorResponse(`Insufficent balance`));
  }
  if (req.player.deposit < amount) {
    note += " using rest wining";
  }

  let playerGame = await PlayerGame.findOne({
    playerId: req.player._id,
    gameId,
  })
    .select({ _id: 1, influencerId: 1 })
    .lean();
  if (playerGame) {
    if (req.body.logType !== "influencer_gift") {
      await PlayerGame.findOneAndUpdate(
        { playerId: req.player._id, gameId },
        { $inc: { amountBet: amount } }
      );
    }
  } else {
    let c = {
      game: tournament.mode,
      stateCode: req.player.stateCode,
      playerId: req.player._id,
      gameId,
      amountBet: amount,
      tournamentId,
      influencerId: tournament.influencerId,
    };
    if (req.body.logType === "influencer_gift") {
      c.amountBet = 0;
    }
    console.log("adding-player game", c);
    playerGame = await PlayerGame.create(c);
  }
  let tranData = {
    playerId: req.player._id,
    amount: amount,
    transactionType: "debit",
    note: note,
    prevBalance: req.player.balance,
    influencerId: tournament.influencerId,
    logType: req.body.logType,
    betNo,
    gameId: gameId,
    status: "complete",
    paymentStatus: "SUCCESS",
  };

  let tran = await Transaction.create(tranData);
  let player;
  if (req.player.deposit < amount) {
    let damount = req.player.deposit;
    let windeduction;
    if (damount > 0) {
      player = await tran.debitPlayerDeposit(damount);
      windeduction = amount - damount;
    } else {
      windeduction = amount;
    }

    if (windeduction > 0) {
      player = await tran.debitPlayerWinings(windeduction);
    }
  } else {
    player = await tran.debitPlayerDeposit(amount);
  }
  let setting = getKey("site_setting");

  if (logType === "influencer_gift") {
    let influencerAmount = amount * setting.gift_commission * 0.01;
    let adminAmount = amount - influencerAmount;

    let influencerUser = await Influencer.findByIdAndUpdate(
      playerGame.influencerId,
      {
        $inc: {
          totalBalance: influencerAmount,
          totalGifts: influencerAmount,
        },
      }
    );
    await PlayerGame.findByIdAndUpdate(playerGame._id, {
      $inc: { amountGift: influencerAmount, adminCommision: adminAmount },
    });
    const influencerTransactionData = {
      playerId: req.player._id,
      amount: influencerAmount,
      transactionType: "credit",
      note: `Gift received ${amount} -${gameId}`,
      influencerId: tournament.influencerId,
      prevBalance: influencerUser.totalBalance,
      adminCommision: adminAmount,
      logType: req.body.logType,
      betNo,
      gameId: gameId,
      status: "complete",
      paymentStatus: "SUCCESS",
    };
    await Transaction.create(influencerTransactionData);
  }
  res.status(200).json({
    success: true,
    data: player,
  });
});

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.debitBonus = asyncHandler(async (req, res, next) => {
  let { amount, note, gameId } = req.body;

  if (!amount || amount < 0) {
    return next(new ErrorResponse(`Invalid amount`));
  }
  if (!req.player) {
    return next(new ErrorResponse(`Invalid Code`));
  }
  if (!gameId) {
    return next(new ErrorResponse(`Game id requied`));
  }
  if (req.player.bonus < amount) {
    return next(new ErrorResponse(`Insufficent bonus balance`));
  }

  let tranData = {
    playerId: req.player._id,
    amount: amount,
    transactionType: "debit",
    note: note,
    prevBalance: req.player.balance,
    logType: "deposit",
    status: "complete",
    paymentStatus: "SUCCESS",
    stateCode: req.player.stateCode,
  };

  tranData["gameId"] = gameId;

  let tran = await Transaction.create(tranData);

  let player = await tran.debitPlayerBonus(amount);
  res.status(200).json({
    success: true,
    data: player,
  });
});
// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.creditBonus = asyncHandler(async (req, res, next) => {
  let { amount, note, gameId } = req.body;

  if (!amount || amount < 0) {
    return next(new ErrorResponse(`Invalid amount`));
  }
  if (!req.player) {
    return next(new ErrorResponse(`Invalid Code`));
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
    playerId: req.player._id,
    amount: amount,
    transactionType: "credit",
    note: note,
    gameId: !gameId ? "" : gameId,
    prevBalance: req.player.balance,
    logType: "deposit",
    status: "complete",
    paymentStatus: "SUCCESS",
    stateCode: req.player.stateCode,
  };

  //tranData['gameId'] = gameId;

  let tran = await Transaction.create(tranData);
  let player = await tran.creditPlayerDeposit(amount);

  res.status(200).json({
    success: true,
    data: player,
  });
});

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.creditAmount = asyncHandler(async (req, res, next) => {
  let player = req.player; //await Player.findById(req.body.id);
  let {
    amount,
    note,
    gameId,
    adminCommision = 0,
    tournamentId,
    winner = "winner_1",
    gameStatus = "win",
  } = req.body;
  console.log("creditAmount", gameId);
  if (req.body.logType !== "won") {
    new ErrorResponse(`Invalid amount`);
  }
  if (!tournamentId) {
    return next(new ErrorResponse(`Invalid tournament`));
  }
  if (amount < 0 || !gameId) {
    return next(new ErrorResponse(`Invalid amount`));
  }
  if (!player) {
    return next(new ErrorResponse(`Player Not found`));
  }
  let gameRec = await PlayerGame.findOne({
    gameId: gameId,
    tournamentId: tournamentId,
  });
  if (!gameRec) {
    return next(new ErrorResponse(`Game not found`));
  }
  amount = parseFloat(amount).toFixed(2);
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    return next(new ErrorResponse(`Tournament Not found`));
  }

  const betAmout = parseFloat(tournament.betAmount) * 2;
  const winAmount = parseFloat(tournament.winnerRow.winner_1).toFixed(2);
  const commision = betAmout - winAmount;
  //let win = winAmount - parseFloat(tournament.betAmount);
  let tds = 0;
  //let winAfterTax = win - tds;
  let gst = 0;
  let stateCode = player.stateCode;

  let PlayerAmount = amount;
  let paymentStatus = "paid";
  if (gameStatus === "tie") {
    PlayerAmount = amount;
    gameStatus = "tie";
    paymentStatus = "tie";
    if (gameRec.status === "tie") {
      paymentStatus = "paid";
    }
  }

  let playerGame = {
    playerId: req.player._id,
    amountWon: PlayerAmount,
    tournamentId: tournamentId,
    winner: winner,
    gameId: gameId,
    amountPaid: betAmout,
    gameStatus: gameStatus,
    note: note,
    isBot: false,
    status: paymentStatus,
    gameStatus: "won",
  };

  // let leaderboard = await PlayerGame.create(playerGame);

  let tranData = {
    playerId: player._id,
    amount: PlayerAmount,
    transactionType: "credit",
    note: note,
    prevBalance: player.balance,
    adminCommision: adminCommision,
    status: "complete",
    paymentStatus: "SUCCESS",
    logType: req.body.logType,
    gameId: gameId,
    tds: tds,
    gst: gst,
    stateCode: stateCode,
  };

  if (gameRec.status !== "paid") {
    console.log("firsttime");
    let tran = await Transaction.create(tranData);
    player = await tran.creditPlayerWinings(PlayerAmount);
    if (gameRec.status === "start") {
      Dashboard.totalIncome(betAmout, winAmount, adminCommision);
    }

    let leaderboard = await PlayerGame.findOneAndUpdate(
      { gameId: gameId, tournamentId: tournamentId },
      playerGame
    );
  }
  res.status(200).json({
    success: true,
    data: player,
  });
});

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.reverseAmount = asyncHandler(async (req, res, next) => {
  let player = req.player; //await Player.findById(req.body.id);
  let { amount, gameId, note } = req.body;
  console.log("creditAmount", gameId);
  if (req.body.logType !== "reverse") {
    new ErrorResponse(`Invalid amount`);
  }
  if (!note) {
    return next(new ErrorResponse(`Note is required`));
  }
  if (!req.player || req.player.status !== "active") {
    return next(new ErrorResponse(`Player Not Found`));
  }

  if (amount < 0 || !gameId) {
    return next(new ErrorResponse(`Invalid amount`));
  }
  if (!player) {
    return next(new ErrorResponse(`Player Not found`));
  }
  // let leaderboard = await PlayerGame.findOne({ 'gameId': gameId });
  // if (!leaderboard || leaderboard.status === 'paid') {
  //   return next(
  //     new ErrorResponse(`Game Paid`)
  //   );

  // }
  // let tranReverse = await Transaction.findOne({ 'gameId': gameId, logType: 'reverse', playerId: player._id });
  // if (tranReverse) {
  //   return next(
  //     new ErrorResponse(`refund given`)
  //   );

  // }
  //let gameRec = await PlayerGame.findOne({ 'gameId': gameId, playerCount: { $gt: 0 } });
  // let tranJoin = await Transaction.findOne({ 'gameId': gameId, logType: 'join', playerId: player._id });

  // if (!tranJoin) {
  //   return next(
  //     new ErrorResponse(`Transaction not found`)
  //   );

  // }
  let commision = 0;
  let tranData = {
    playerId: player._id,
    amount: amount,
    transactionType: "credit",
    note: note,
    prevBalance: player.balance,
    adminCommision: commision,
    status: "complete",
    paymentStatus: "SUCCESS",
    logType: "reverse",
    gameId: gameId,
    stateCode: player.stateCode,
  };

  console.log("reseved");

  // let lobbyId = leaderboard.tournamentId;
  // if (req.publicRoom[lobbyId]) {
  //   let rn = req.publicRoom[lobbyId]['roomName'];
  //   if (rn == gameId) {
  //     console.log('gameId', gameId);
  //     req.publicRoom[lobbyId] = '';
  //   }

  // }

  let tran = await Transaction.create(tranData);
  player = await tran.creditPlayerDeposit(amount);

  res.status(200).json({
    success: true,
    data: player,
  });

  res.status(200).json({
    success: true,
    data: player,
  });
});
// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.playerInfo = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.gameStatus = asyncHandler(async (req, res, next) => {
  let { gameId } = req.body;
  let gameRec = await PlayerGame.findOne({ gameId: gameId });

  res.status(200).json({
    success: true,
    data: gameRec,
  });
});

// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.getNotication = asyncHandler(async (req, res, next) => {
  // const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: [],
  });
});
// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.updateStatus = asyncHandler(async (req, res, next) => {
  let fieldsToUpdate = {};
  player = await Player.findById(req.params.id);
  if (!player) {
    return next(new ErrorResponse(`Player  not found`));
  }
  if (!req.staff) {
    return next(new ErrorResponse(`Not Autherized`));
  }

  fieldsToUpdate["status"] = req.body.status;
  player = await Player.findByIdAndUpdate(player.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: player,
  });
});
// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.saveLeaderBoard = asyncHandler(async (req, res, next) => {
  console.log("saveLeaderBoard");
  let {
    playerId,
    amount,
    note,
    gameId,
    adminCommision = 0,
    tournamentId,
    winner = "winner_1",
    players = [],
  } = req.body;
  let leaderboard;
  let updatedData = { isBot: false, players };
  playersObj = JSON.parse(players);
  const winnerPlayer = playersObj.matchWinLeaderDatas.filter(
    (x) => x.userId === playerId
  )[0];
  const looserPlayer = playersObj.matchWinLeaderDatas.filter(
    (x) => x.userId !== playerId
  )[0];
  const tournament = await Tournament.findById(tournamentId);
  if (winnerPlayer.isBot) {
    const betAmout = parseFloat(tournament.betAmount) * 2;
    const winAmount = parseFloat(tournament.winnerRow.winner_1).toFixed(2);
    const commision = betAmout - winAmount;
    Dashboard.totalIncome(betAmout, winAmount, commision);
    updatedData["isBot"] = true;
    //updatedData['playerId'] = looserPlayer.userId;
    updatedData["gameStatus"] = "lost";
    updatedData["note"] = note;
    updatedData["opponentName"] = winnerPlayer.userName;
    updatedData["opponentId"] = winnerPlayer.userId;
  } else {
    updatedData["opponentName"] = looserPlayer.userName;
    updatedData["isBot"] = looserPlayer.isBot;
  }

  leaderboard = await PlayerGame.findOneAndUpdate(
    { gameId: gameId, tournamentId: tournamentId },
    updatedData
  );

  res.status(200).json({
    success: true,
    data: leaderboard,
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
      terms: process.env.API_URI + "/page/term",
      policy: process.env.API_URI + "/page/policy",
    },
  });
});

let buildProfileUrl = (player) => {
  if (player.profilePic) {
    // console.log('image'.green);
    return process.env.IMAGE_URL + player.profilePic;
  } else {
    // console.log('image'.red);

    return "";
  }
};
exports.getTournaments = asyncHandler(async (req, res, next) => {
  const rows = await Tournament.find({ active: true, tournamentType: "admin" });

  res.status(200).json({
    success: true,
    data: rows,
  });
});

// @desc      Get current  in coupon
// @route     POST /api/v1/auth/me
// @access    Private
exports.getCoupons = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.find({
    couponType: req.params.type,
    active: true,
  }).lean();
  let x = coupon.map((d) => {
    d["imageUrl"] = process.env.IMAGE_URL + d.couponImage;
    return d;
  });
  res.status(200).json({
    success: true,
    data: x,
  });
});

// @desc      Get current  in coupon
// @route     POST /api/v1/auth/me
// @access    Private

exports.getBanners = asyncHandler(async (req, res, next) => {
  const banner = await Banner.find({ status: "active" }).lean();
  // console.log(banner);
  let x = banner.map((d) => {
    d["imageUrl"] = process.env.IMAGE_URL + d.imageId;

    return d;
  });
  res.status(200).json({
    success: true,
    data: x,
  });
});
exports.getGifts = asyncHandler(async (req, res, next) => {
  const gift = await Gift.find({ active: true }).lean();
  let x = gift.map((d) => {
    d["imageUrl"] = process.env.IMAGE_URL + d.giftImage;
    return d;
  });
  res.status(200).json({
    success: true,
    data: x,
  });
});

// @desc      Update Notification
// @route     PUT /api/v1/auth/Notifications/:id
// @access    Private/Admin
exports.clearAllNotification = asyncHandler(async (req, res, next) => {
  if (!req.player) {
    return next(new ErrorResponse(`Notifications  not found`));
  }

  player = await Player.findByIdAndUpdate(
    req.player._id,
    { notificationRead: Date.now() },
    {
      new: false,
      runValidators: true,
    }
  );
  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc      Update firebase
// @route     PUT /api/v1/auth/savefbtoken/:id
// @access    Private/player
exports.savefbtoken = asyncHandler(async (req, res, next) => {
  if (!req.player) {
    return next(new ErrorResponse(`Player  not found`));
  }

  player = await Player.findByIdAndUpdate(
    req.player._id,
    { firebaseToken: req.body.firebaseToken },
    {
      new: false,
      runValidators: true,
    }
  );
  res.status(200).json({
    success: true,
    data: {},
  });
});
// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.poll = asyncHandler(async (req, res, next) => {
  if (!req.player || !req.body.id) {
    return next(new ErrorResponse(`Player  not found`));
  }

  const polled = await PlayerPoll.findOne({
    playerId: req.player._id,
    pollId: req.body.id,
  });
  const poll = await Poll.find({ _id: req.body.id, status: "active" }).lean();

  if (!poll) {
    return next(new ErrorResponse(`Poll  not found`));
  }

  if (polled) {
    return next(new ErrorResponse(`Polled `));
  }

  let m = await PlayerPoll.create({
    playerId: req.player._id,
    pollId: req.body.id,
  });

  let s = await Poll.findByIdAndUpdate(
    req.body.id,
    { $inc: { poll: 1 } },
    {
      new: false,
      runValidators: true,
    }
  );
  res.status(200).json({
    success: true,
    data: {},
  });
});
// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.pollList = asyncHandler(async (req, res, next) => {
  const list = await Poll.find({ status: "active" }).lean();
  let x = list.map((d) => {
    d["imageUrl"] = process.env.IMAGE_URL + d.imageId;

    return d;
  });
  res.status(200).json({
    success: true,
    data: x,
  });
});

exports.wallPostList = asyncHandler(async (req, res, next) => {
  const list = await WallPost.find({ status: "active" }).lean();
  let x = list.map((d) => {
    d["imageUrl"] = process.env.IMAGE_URL + d.imageId;

    return d;
  });
  res.status(200).json({
    success: true,
    data: x,
  });
});

// @desc      Update refer
// @route     PUT /api/v1/auth/savefbtoken/:id
// @access    Private/player
exports.updateRefer = asyncHandler(async (req, res, next) => {
  console.log("updateRefer");
  let { referId } = req.body;
  if (!req.player || req.player.status !== "active") {
    return next(new ErrorResponse(`Player  not found`));
  }
  if (!referId) {
    return next(new ErrorResponse(`refer id  not found`));
  }

  let codeGiver = await Player.findOne({
    refer_code: req.body.referId,
    status: "active",
  });
  if (
    !codeGiver ||
    req.player.refrer_player_id ||
    req.player.createdAt < codeGiver.createdAt
  ) {
    return next(new ErrorResponse(`You already used someone referral code`));
  }

  const row = await Setting.findOne({ type: "SITE", name: "ADMIN" });
  let note = "Refrer bonus";
  let amount = row.lvl1_commission;
  if (amount <= 0) {
    return;
  }
  let tranData = {
    playerId: codeGiver._id,
    referer_playerId: req.player._id,
    amount: amount,
    transactionType: "credit",
    note: note,
    prevBalance: codeGiver.balance,
    logType: "refer_bonus",
    status: "complete",
    paymentStatus: "SUCCESS",
    stateCode: req.player.stateCode,
  };

  let tran = await Transaction.create(tranData);
  await tran.creditPlayerBonus(amount);
  let player = await Player.findByIdAndUpdate(
    req.player._id,
    { refrer_player_id: codeGiver._id },
    {
      new: true,
      runValidators: true,
    }
  );
  let playerStat = {
    $inc: {
      joinCount: 1,
      refer_count: 1,
      refer_lvl1_count: 1,
      refer_lvl1_total: amount,
      refrer_amount_total: amount,
    },
  };
  if (codeGiver.refrer_level === 0) {
    playerStat["refrer_level"] = 1;
  }
  await Player.findByIdAndUpdate(codeGiver._id, playerStat, {
    new: false,
    runValidators: true,
  });
  console.log("refrer level - 1");
  // if (codeGiver.refrer_player_id) {
  //   await referCommision(codeGiver.refrer_player_id, row.lvl2_commission, 'refer bonus level 2')

  // }
  res.status(200).json({
    success: true,
    data: player,
  });
});

// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.getWinnerfeed = asyncHandler(async (req, res, next) => {
  const winners = await PlayerGame.find()
    .sort({ _id: -1 })
    .limit(20)
    .select({ amountWon: 1, tournamentId: 1 })
    .populate({ path: "playerId", select: { _id: 0, firstName: 1 } });

  let x = winners.map((d) => {
    let name = "starx";
    if (d.playerId && d.playerId.firstName) {
      name = d.playerId.firstName;
    }
    return {
      amountWon: d.amountWon,
      firstName: name,
      tournamentId: d.tournamentId,
    };
  });
  res.status(200).json({
    success: true,
    data: x,
  });
});
exports.getWinnertop = asyncHandler(async (req, res, next) => {
  const winners = await Player.find({ status: "active" })
    .sort({ balance: -1 })
    .limit(10)
    .select({ _id: 0, firstName: 1, picture: 1, balance: 1 });

  let x = winners;
  res.status(200).json({
    success: true,
    data: x,
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
    data: list,
  });
});

// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.sendAppUrl = asyncHandler(async (req, res, next) => {
  let { mobile } = req.body;
  const sms = await Setting.findOne({ type: "SMSGATEWAY", name: "MSG91" });
  // Get reset token
  let vcode = "1234";
  if (sms.one.TEMPLATE_APP_LINK_ID) {
    //let x = await smsOtp('91' + mobile, vcode, sms);
  }

  res.status(200).json({
    success: true,
    data: [],
  });
});
// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.sendotp = asyncHandler(async (req, res, next) => {
  let { phone } = req.body;
  if (!req.player) {
    return next(new ErrorResponse(`Player not found`));
  }
  console.log(
    req.player.verifyPhoneExpire,
    req.player.verifyPhoneExpire > Date.now()
  );

  // if (req.player.phoneStatus !== 'verified') {
  //   if (req.player.verifyPhoneExpire > Date.now()) {
  //     return next(
  //       new ErrorResponse(`Try after 10 min`)
  //     );
  //   }

  let vcode = Math.floor(1000 + Math.random() * 9000);
  const sms = await Setting.findOne({ type: "SMSGATEWAY", name: "MSG91" });
  let fieldsToUpdate = {
    verifyPhone: vcode,
    verifyPhoneExpire: Date.now() + 10 * 60 * 1000,
  };
  player = await Player.findByIdAndUpdate(req.player._id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });
  let x = await smsOtp(phone, vcode, sms.one.TEMPLATE_ID, sms.one.AUTHKEY);

  res.status(200).json({
    success: true,
    data: [],
  });
});

let smsOtp = async (mobile, otp, template_id, authkey) => {
  var params = {
    template_id,
    mobile,
    authkey,
    otp,
  };
  // console.error('sendingotp', otp, phone)
  return axios
    .get("https://api.msg91.com/api/v5/otp", { params })
    .catch((error) => {
      console.error(error);
    });
};

let referCommision = async (player_id, amount, note) => {
  let parentPlayer1 = await Player.findOne({
    _id: player_id,
    status: "active",
  });
  if (!parentPlayer1) {
    return;
  }
  let tranData = {
    playerId: parentPlayer1._id,
    amount: amount,
    transactionType: "credit",
    note: note,
    prevBalance: parentPlayer1.balance,
    logType: "bonus",
    status: "complete",
    paymentStatus: "SUCCESS",
    stateCode: parentPlayer1.stateCode,
  };

  let tran = await Transaction.create(tranData);

  await tran.creditPlayerDeposit(amount);
  let playerStat = {
    $inc: {
      refer_lvl2_count: 1,
      refer_lvl2_total: amount,
      refrer_amount_total: amount,
    },
  };
  if (codeGiver.refrer_level === 1) {
    playerStat["refrer_level"] = 2;
  }
  await Player.findByIdAndUpdate(parentPlayer1._id, playerStat, {
    new: false,
    runValidators: true,
  });
  console.log("refrer level - 2");
};

exports.checkUpi = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {
      status: "SUCCESS",
      subCode: "200",
      message: "VPA verification successful",
      data: { nameAtBank: "", accountExists: "" },
    },
  });
  const { upiId } = req.body;
  if (!req.player || req.player.status !== "active") {
    return next(new ErrorResponse(`Player  not found`));
  }
  if (!upiId) {
    return next(new ErrorResponse("Please Provide Upi Id"));
  }

  // Check if password matches
  const upiRes = await cashfreeCtrl.upiValidate(req, res, next);
  console.log(upiRes);
  // Check for user
  if (upiRes["status"] != "SUCCESS") {
    return next(new ErrorResponse("upi verification failed"));
  }
  if (upiRes.data.accountExists === "YES") {
    let fieldsToUpdate = { upiId };
    let player = await Player.findByIdAndUpdate(
      req.player._id,
      { upi: fieldsToUpdate },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: upiRes,
    });
  } else {
    return next(new ErrorResponse("upi verification failed"));
  }
});
// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.creditReferalComission = asyncHandler(async (req, res, next) => {
  let player = req.player;
  let {
    betNo = 0,
    amount,
    note,
    gameId,
    adminCommision = 0,
    tournamentId,
    winner = "winner_1",
    gameStatus = "win",
  } = req.body;
  let commision = 0.05;
  // if (!player) {
  //   return next(new ErrorResponse(`Player Not found`));
  // }
  let filter = {
    commissionStatus: "processing",
    gameStatus: "lost",
    amountBet: { $gt: 0 },
  };
  const gamePlayed = await PlayerGame.find(filter)
    .select({ amountBet: 1, tournamentId: 1, gameStatus: "lost" })
    .populate({
      path: "playerId",
      select: { _id: 0, firstName: 1, refrer_player_id: 1 },
      match: { refrer_player_id: { $exists: true } },
    });

  const setting = await Setting.findOne({ type: "SITE", name: "ADMIN" });

  const refrealComission = setting.admin_referral_commission * 0.01;
  if (refrealComission <= 0) {
    return;
  }
  console.log("gamePlayed", gamePlayed);
  for await (const game of gamePlayed) {
    let amount = game.amountBet * refrealComission;
    if (!game.playerId) {
      continue;
    }
    let tranData = {
      playerId: game.playerId.refrer_player_id,
      amount: amount,
      transactionType: "credit",
      note: "Admin Refreal Bonus",
      prevBalance: 0,
      adminCommision: 0,
      status: "complete",
      paymentStatus: "SUCCESS",
      logType: "bonus",
      gameId: game.gameId,
    };

    let tran = await Transaction.create(tranData);
    await tran.creditPlayerDeposit(amount);
  }
  console.log("I Cron excuted");

  // let betAmout = parseFloat(amount) + parseFloat(adminCommision);
  // betAmout = parseFloat(amount).toFixed(2);

  await PlayerGame.updateMany(filter, { commissionStatus: "processed" });

  res.status(200).json({
    success: true,
    data: winners,
  });
});

exports.getReferList = asyncHandler(async (req, res, next) => {
  if (!req.player) {
    return next(new ErrorResponse(`Player  not found`));
  }
  const winners = await Transaction.find({
    playerId: req.player._id,
    logType: "refer_bonus",
  })
    .select({ amount: 1, createdAt: 1 })
    .populate({
      path: "referer_playerId",
      select: { _id: 0, firstName: 1, picture: 1 },
    });

  let x = winners;
  res.status(200).json({
    success: true,
    data: x,
  });
});

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.paymentAdd = asyncHandler(async (req, res, next) => {
  console.log("req------>", req.body);

  let filename;
  let updateFiled = {};
  let { id, paymentId } = req.body;
  if (!paymentId) {
    return next(new ErrorResponse(`TransactionId  is required`));
  }
  let tran = await Transaction.find({ _id: id, playerId: req.player._id });
  if (!tran) {
    return next(new ErrorResponse(`Transaction not found`));
  }
  if (!req.files) {
    return next(new ErrorResponse(`File not found`));
  }
  if (req.files) {
    filename = "/img/payment/" + req.player._id + "/" + req.files.file.name;
    uploadFile(req, filename, res);
    updateFiled = { imageUrl: filename, paymentStatus: "REQUESTED", paymentId };
  }
  // updateFiled = { paymentId, paymentStatus: "REQUESTED" };
  const row = await Transaction.findByIdAndUpdate(id, updateFiled);

  res.status(200).json({
    success: true,
    data: row,
  });
});

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private

exports.verifyPhoneCode = asyncHandler(async (req, res, next) => {
  let { phone, code } = req.body;
  if (!code || !phone) {
    return next(new ErrorResponse(`Please provide all required data`));
  }

  let user = await Player.findOne({ _id: req.player._id, verifyPhone: code });

  if (!user) {
    return next(new ErrorResponse(`Invalid Code`));
  }
  let player = await Player.findByIdAndUpdate(
    user.id,
    {
      phoneStatus: "verified",
      phone,
      verifyPhone: undefined,
      verifyPhoneExpire: undefined,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: player,
  });
});
exports.getGift = asyncHandler(async (req, res, next) => {
  if (!req.player) {
    return next(new ErrorResponse(`Player  not found`));
  }
  let data = {
    title: "better luck next time",
    giftAmount: req.player.giftAmount,
    isCalimed: req.player.isCalimed,
  };
  if (req.player.giftAmount > 0) {
    let data = {
      title: "Reward",
      giftAmount: req.player.giftAmount,
      isCalimed: req.player.isCalimed,
    };
  }
  res.status(200).json({
    success: true,
    data: data,
  });
});

exports.calimedGift = asyncHandler(async (req, res, next) => {
  let { playerId } = req.body;

  if (!req.player) {
    return next(new ErrorResponse(`Player  not found`));
  }

  const player = await Player.findByIdAndUpdate(
    req.player._id,
    { giftAmount: 0, isCalimed: true },
    {
      new: true,
      runValidators: true,
    }
  );
  if (req.player.giftAmount > 0) {
    let tranData = {
      playerId: req.player._id,
      amount: req.player.giftAmount,
      transactionType: "credit",
      note: "player gift",
      prevBalance: req.player.balance,
      status: "complete",
      paymentStatus: "SUCCESS",
      stateCode: req.player.stateCode,
      logType: "player_gift",
    };
    let tran = await Transaction.create(tranData);
  }

  res.status(200).json({
    success: true,
    data: {},
  });
});

exports.playerGift = asyncHandler(async (req, res, next) => {
  let { giftAmount } = req.body;
  let playerId = req.params.id;

  if (req.role !== "admin") {
    return next(new ErrorResponse(`Not allowed `));
  }

  const player = await Player.findByIdAndUpdate(
    playerId,
    { giftAmount: giftAmount, isCalimed: false },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: {},
  });
});

exports.unfollowPlayer = asyncHandler(async (req, res, next) => {
  let { otherPlayerId } = req.body;

  let playerId = req.player.id;

  if (!req.player) {
    return next(new ErrorResponse(`Player  not found`));
  }

  await PlayerInfluencer.deleteMany({ playerId, otherPlayerId });

  await updateFollowCount(playerId);

  res.status(200).json({
    success: true,
    data: req.player,
  });
});

exports.followPlayer = asyncHandler(async (req, res, next) => {
  let { otherPlayerId } = req.body;

  let playerId = req.player.id;

  if (!req.player) {
    return next(new ErrorResponse(`Player  not found`));
  }

  await PlayerInfluencer.updateOne(
    { otherPlayerId: otherPlayerId, playerId: playerId }, // Filter to check if the follow relationship exists
    { $setOnInsert: { otherPlayerId: otherPlayerId, playerId: playerId } }, // Only set these fields if inserting a new document
    { upsert: true } // Perform an upsert
  );

  await updateFollowCount(playerId);

  // await admin.messaging().subscribeToTopic(player.deviceToken, influencerId.toString());

  res.status(200).json({
    success: true,
    data: req.player,
  });
});

// exports.getPlayerList = asyncHandler(async (req, res, next) => {

//   const playerId = req.player._id; // Replace with the current player's ID

//   const page = 1; // The current page (1-indexed)
//   const limit = 10; // The number of influencers per page
//   const searchTerm = ""; // Replace with the search term (empty if no search)

//   const pipeline = [
//     {
//       $lookup: {
//         from: "playerinfluencers",
//         let: { playerId: "$_id" }, // Use the player's _id from the Players collection
//         pipeline: [
//           {
//             $match: {
//               $expr: {
//                 $and: [
//                   { $eq: ["$playerId", otherPlayerId] },   // Check if otherPlayerId is the one doing the following
//                   { $eq: ["$otherPlayerId", "$$playerId"] } // Check if this player is being followed
//                 ]
//               }
//             }
//           },
//           { $limit: 1 } // We just need to know if there's one match
//         ],
//         as: "isFollowing"
//       }
//     },
//     {
//       $project: {
//         _id: 1,
//         firstName: 1,
//         displayName: 1,
//         profilePic: { $concat: [process.env.IMAGE_URL, '$imageId'] },
//         isFollowing: { $gt: [{ $size: "$isFollowing" }, 0] } // true if the other player is following
//       }
//     },
//     { $skip: (page - 1) * limit }, // Pagination logic
//     { $limit: limit } // Limit to control page size
//   ];

//   // Conditionally add the $match stage only if a search term is provided
//   if (searchTerm) {
//     pipeline.unshift({
//       $match: {
//         $or: [
//           { firstname: { $regex: searchTerm, $options: "i" } },  // Case-insensitive search on firstname
//           { displayname: { $regex: searchTerm, $options: "i" } } // Case-insensitive search on displayname
//         ]
//       }
//     });
//   }

//   // Run the aggregation pipeline
//   let rows = await Player.aggregate(pipeline);

//   res.json({ data: rows }); // table.total, table.dat

// });

exports.getPlayerList = asyncHandler(async (req, res, next) => {
  const playerId = req.player ? req.player._id : null; // Ensure playerId is defined
  const otherPlayerId = req.query.otherPlayerId || null; // Define otherPlayerId, if passed in query params

  // Get pagination and search term from query parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const searchTerm = req.query.search || "";

  // Define aggregation pipeline

  const pipeline = [
    {
      $lookup: {
        from: "playerinfluencers",
        let: {
          playerId: ObjectId(playerId), // ID of the player in the Players collection
          targetOtherPlayerId: "$_id", // otherPlayerId we want to match
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$playerId", "$$playerId"] }, // Check if the current player is following
                  { $eq: ["$otherPlayerId", "$$targetOtherPlayerId"] }, // Check if otherPlayerId is being followed
                ],
              },
            },
          },
          { $limit: 1 }, // We only need one match to confirm "isFollowing" status
        ],
        as: "isFollowing",
      },
    },
    {
      $project: {
        _id: 1,
        firstName: 1,
        displayName: 1,
        // profilePic: {
        //   $concat: [`${process.env.IMAGE_URL}`, "$picture"] // Pass process.env.IMAGE_URL as a string
        // },

        profilePic: {
          $cond: {
            if: {
              $and: [
                { $ne: ["$picture", null] },
                { $ne: [process.env.IMAGE_URL, null] },
              ],
            },
            then: { $concat: [`${process.env.IMAGE_URL}`, "$picture"] },
            else: "img/logo/profile_default.png", // Replace with your default picture URL
          },
        },

        isFollowing: { $gt: [{ $size: "$isFollowing" }, 0] }, // true if the other player is following
      },
    },
    { $skip: (page - 1) * limit }, // Skip for pagination
    { $limit: limit }, // Limit for page size
  ];

  // Conditionally add the $match stage if a search term is provided
  if (searchTerm) {
    pipeline.unshift({
      $match: {
        $or: [
          { firstName: { $regex: searchTerm, $options: "i" } }, // Case-insensitive search on firstName
          { displayName: { $regex: searchTerm, $options: "i" } }, // Case-insensitive search on displayName
        ],
      },
    });
  }

  try {
    // Run the aggregation pipeline
    const rows = await Player.aggregate(pipeline);

    // Send the response
    res.json({
      page,
      limit,
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching player list:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

const updateFollowCount = async (playerId) => {
  // Step 1: Calculate the counts using aggregation
  const counts = await PlayerInfluencer.aggregate([
    {
      $facet: {
        followersCount: [
          { $match: { otherPlayerId: ObjectId(playerId) } },
          { $count: "count" },
        ],
        followingCount: [
          { $match: { playerId: ObjectId(playerId) } },
          { $count: "count" },
        ],
      },
    },
    {
      $project: {
        followersCount: {
          $ifNull: [{ $arrayElemAt: ["$followersCount.count", 0] }, 0],
        },
        followingCount: {
          $ifNull: [{ $arrayElemAt: ["$followingCount.count", 0] }, 0],
        },
      },
    },
  ]);

  console.log("count", counts);
  // Step 2: Update the counts in the Players collection
  if (counts && counts.length > 0) {
    await Player.findByIdAndUpdate(playerId, {
      followersCount: counts[0].followersCount,
      followingCount: counts[0].followingCount,
    });
  }
};
