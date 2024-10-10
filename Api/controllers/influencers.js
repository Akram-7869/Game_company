const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/Influencer');
const PlayerInfluencer = require('../models/PlayerInfluencer');

const axios = require('axios');
const Influencer = require('../models/Influencer');
const Transaction = require('../models/Transaction');

const admin = require('../utils/fiebase');
const { deletDiskFile, uploadFile } = require('../utils/utils');
const path = require('path');
const fs = require('fs');



// @desc      Get all users
// @route     GET /api/v1/auth/users
// @access    Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  User.dataTables({
    limit: req.body.length,
    skip: req.body.start,
    select: { 'firstName': 1, 'phone': 1, 'email': 1, 'status': 1, 'createdAt': 1, 'role': 1,totalBalance:1 },
    search: {
      value: req.body.search ? req.body.search.value : '',
      fields: ['email']
    },
    sort: {
      _id: 1
    }
  }).then(function (table) {
    res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
  })
});

// @desc      Get single user
// @route     GET /api/v1/auth/users/:id
// @access    Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc      Create user
// @route     POST /api/v1/auth/users
// @access    Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  if (req.body.role === 'superadmin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update provider ${provider._id}`)
    );
  }
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc      Update user
// @route     PUT /api/v1/auth/users/:id
// @access    Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  let {filename} =req.body;
  if (!user) {
    return next(
      new ErrorResponse(`User  not found`)
    );
  }
  //  Make sure user is provider owner
  if (req.role === 'admin') {

    return next(
      new ErrorResponse(
        `User  is not authorized to update`)
    );
  } else if (user.id !== req.user.id) {
    return next(
      new ErrorResponse(
        `User  is not authorized to update`)
    );
  }
    
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.phone = req.body.phone;
  user.displayName = req.body.displayName;
  if(filename){
     user.imageId = filename;
  }

  //user.isNew = false;
  await user.save();
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc      Delete user
// @route     DELETE /api/v1/auth/users/:id
// @access    Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  // Make sure user is provider owner
  if (user.role === 'superadmin') {
    return next(
      new ErrorResponse(
        `User is not authorized`)
    );
  }
  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});
// @desc      Update user
// @route     PUT /api/v1/auth/users/:id
// @access    Private/Admin
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { code, password, oldpass } = req.body;
  let user = req.user;
  if (!user) {
    return next(
      new ErrorResponse(`User  not found`)
    );
  }

  // Check for user
  user = await User.findById(user._id).select('+password');

  if (!user) {
    return next(new ErrorResponse('User not found'));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(oldpass);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials'));
  }

  user.password = req.body.password;


  await user.save();
  res.status(200).json({
    success: true,
    data: user
  });
});

exports.withDrawRequest = asyncHandler(async (req, res, next) => {
  let { amount, note, gameId, to, upiId } = req.body;

  if (!req.user) {
    return next(
      new ErrorResponse(`User Not Found`)
    );
  }

  if (!amount || amount < 0) {
    return next(
      new ErrorResponse(`Invalid amount`)
    );
  }
  if (amount > req.user.balance) {
    return next(
      new ErrorResponse(`Insufficent wining Balance`)
    );
  }
  // const row = await Setting.findOne({ type: 'SITE', name: 'ADMIN' });

  // if (amount < row.minwithdraw) {
  //   return next(
  //     new ErrorResponse(`Minimum Withdraw ${row.minwithdraw}`)
  //   );
  // }

  // if (req.user.phoneStatus !== 'verified') {
  //   return next(
  //     new ErrorResponse(`Please Verify Phone`)
  //   );
  // }
  let user = await User.findById(req.user._id).select('+bank +upi');

  let tranData = {
    'userId': req.user._id,
    'amount': amount,
    'transactionType': "debit",
    'note': note,
    'prevBalance': req.user.balance,
    'status': 'log',
    'logType': 'withdraw',
    'withdrawTo': req.body.to,
    'stateCode': req.user.stateCode,
    paymentStatus: 'REQUESTED'


  }
  if (req.body.to === 'bank') {
    tranData['withdraw'] = user.bank;
  } else if (req.body.to === 'wallet') {
    tranData['withdraw'] = user.wallet;
    req.body['upiId'] = user.wallet.get('walletAddress');
  } else if (req.body.to === 'upi') {
    tranData['withdraw'] = { 'upiId': upiId };
    req.body['upiId'] = upiId;
  }


  let taxableAmount = (user.totalWithdraw + parseFloat(amount)) - user.totalDeposit - user.totalTaxableAmount - user.openingBalance;
  let tds = 0;
  let totalAmount = 0;
  let incFiled = { balance: -amount, winings: -amount, 'totalWithdraw': amount };

  if (taxableAmount > 0) {
    tds = taxableAmount * (parseFloat(row.tds * 0.01));
    incFiled['totalTaxableAmount'] = taxableAmount;
    incFiled['totalTds'] = tds;
  }
  else {
    taxableAmount = 0;
    tds = 0;
  }

  totalAmount = amount - tds;
  totalAmount = parseFloat(totalAmount).toFixed(2);
  tranData['totalAmount'] = totalAmount;

  tranData['taxableAmount'] = taxableAmount;
  tranData['tds'] = tds;
  // console.log(user.totalWithdraw, amount, user.totalDeposit, user.totalTaxableAmount, user.openingBalance, tranData);
  let tran = await Transaction.create(tranData);
  user = await User.findByIdAndUpdate(req.user._id, { $inc: incFiled }, {
    new: true,
    runValidators: true
  });


  res.status(200).json({
    success: true,
    data: user
  });
});


exports.addBank = asyncHandler(async (req, res, next) => {
  let { bankName, bankAccount, bankIfc, bankAddress, bankAccountHolder } = req.body;
  let fieldsToUpdate = { bankName, bankAccount, bankIfc, bankAddress, bankAccountHolder };
  let user;
  if (!bankAccount || !bankIfc || !bankAccountHolder) {
    return next(
      new ErrorResponse(`All fields are requied`)
    );
  }
  if (req.staff) {
    user = await User.findById(req.params.id);
    // fieldsToUpdate['kycStatus'] = kycStatus;
  } else if (req.user) {

    user = req.user;
  }
  //console.log('req.user'.red, req.user);
  if (!user) {
    return next(
      new ErrorResponse(`User  not found`)
    );
  }


  user = await User.findByIdAndUpdate(user.id, { bank: fieldsToUpdate }, {
    new: true,
    runValidators: true
  });

  //User.isNew = false;
  // await User.save();
  res.status(200).json({
    success: true,
    data: user
  });
});
exports.addWallet = asyncHandler(async (req, res, next) => {
  let { walletAddress, walletName } = req.body;
  let fieldsToUpdate = { walletName, walletAddress };
  let user;
  if (!walletName || !walletAddress) {
    return next(
      new ErrorResponse(`All fields are requied`)
    );
  }
  if (req.staff) {
    user = await User.findById(req.params.id);
    //fieldsToUpdate['kycStatus'] = kycStatus;
  } else if (req.user) {
    user = req.user;
  }
  if (!user) {
    return next(
      new ErrorResponse(`User  not found`)
    );
  }
  user = await User.findByIdAndUpdate(user.id, { wallet: fieldsToUpdate }, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});
exports.addUpi = asyncHandler(async (req, res, next) => {
  let { upiId } = req.body;
  let fieldsToUpdate = { upiId };
  let user = req.user;
  if (!upiId) {
    return next(
      new ErrorResponse(`All fields are requied`)
    );
  }
  if (!user) {
    return next(
      new ErrorResponse(`User  not found`)
    );
  }

  // const upiStatus = await cashfreeCtrl.upiValidate(req, res, next);
  // if (upiStatus['status'] !== 'SUCCESS') {
  //   return next(
  //     new ErrorResponse(upiStatus['message'])
  //   );
  // }

  user = await User.findByIdAndUpdate(user.id, { upi: fieldsToUpdate }, {
    new: true,
    runValidators: true
  });


  res.status(200).json({
    success: true,
    data: user
  });
});

const sendOnlineNotification = async (influencerId) => {
  const message = {
    notification: {
      title: 'Influencer Online!',
      body: `Your favorite influencer is now online!`
    },
    topic: influencerId.toString()
  };

console.log('test');
    await admin.messaging().send(message)
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);

    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
};
const ONE_SINAL_APPID = process.env.ONE_SINAL_APPID;
exports.onlineNotifcation = asyncHandler(async (req, res, next) => {
//   let { influencerId } = req.body;
 
//  let result =  await sendOnlineNotification(influencerId);
//  res.status(200).json({
//   success: true,
//   data: {}
// }); return ;
 
 
  const data = {
    "app_id": process.env.ONE_SINAL_APPID,
    "contents": { "en": "English Message" },
    "headings": { "en": "English " },
    "target_channel": "push",
    "include_aliases":{"external_id": [
      '66619f8f980bf75b5ec9ac0d','664f4345447e35c8799cfe53'
    ]}

  };

  const config = {
    method: 'post',
    url: 'https://api.onesignal.com/notifications',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': 'Basic ' + process.env.ONE_SINAL_SECARET
    },
    data: data
  };

  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });


});
exports.unfollowInfulencer = asyncHandler(async (req, res, next) => {
  let { influencerId } = req.body;

  if (!req.player) {
    return next(
      new ErrorResponse(`Player  not found`)
    );
  }
  let playerId = req.player._id;

  await PlayerInfluencer.deleteMany({ influencerId, playerId });
  const followerCount = await PlayerInfluencer.countDocuments({ influencerId: influencerId });
  await Influencer.findOneAndUpdate(
    { _id: influencerId },
    { $set: { followCount: followerCount } }
  );
 // await admin.messaging().unsubscribeFromTopic(player.deviceToken, influencerId.toString());


  res.status(200).json({
    success: true,
    data: req.player
  });

});

exports.followInfulencer = asyncHandler(async (req, res, next) => {
  let { influencerId } = req.body;

  if (!req.player) {
    return next(
      new ErrorResponse(`Player  not found`)
    );
  }
  let playerId = req.player._id;

  await PlayerInfluencer.updateOne(
    { influencerId, playerId }, // Filter to check if the follow relationship exists
    { $setOnInsert: { influencerId, playerId } }, // Only set these fields if inserting a new document
    { upsert: true } // Perform an upsert
  );
    const followerCount = await PlayerInfluencer.countDocuments({ influencerId: influencerId });
  await Influencer.findOneAndUpdate(
    { _id: influencerId },
    { $set: { followCount: followerCount } }
  );
 // await admin.messaging().subscribeToTopic(player.deviceToken, influencerId.toString());

  res.status(200).json({
    success: true,
    data: req.player
  });


});



exports.getUserList = asyncHandler(async (req, res, next) => {

  const playerId = req.player._id; // Replace with the current player's ID

  const page = 1; // The current page (1-indexed)
  const limit = 10; // The number of influencers per page
  const searchTerm = ""; // Replace with the search term (empty if no search)

  const pipeline = [
    {
      $lookup: {
        from: "playerinfluencers",
        let: { influencerId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$influencerId", "$$influencerId"] },
                  { $eq: ["$playerId", playerId] }
                ]
              }
            }
          },
          { $limit: 1 }
        ],
        as: "isFollowing"
      }
    },
    
    {
    $project: {
      _id: 1,
      firstName: 1,
      displayName: 1,
      followCount:1,
      isFollowing: { $gt: [{ $size: "$isFollowing" }, 0] },
      profilePic: { $concat: [process.env.IMAGE_URL, '$imageId'] },

    }
  }, 
  { $skip: (page - 1) * limit }, 
  { $limit: limit }


  ];

  // Conditionally add the $match stage only if a search term is provided
  if (searchTerm) {
    pipeline.unshift({
      $match: {
        $or: [
          { firstname: { $regex: searchTerm, $options: "i" } },  // Case-insensitive search on firstname
          { displayname: { $regex: searchTerm, $options: "i" } } // Case-insensitive search on displayname
        ]
      }
    });
  }

  

  // Run the aggregation pipeline
  let rows = await Influencer.aggregate(pipeline);


  res.json({ data: rows }); // table.total, table.dat

});

exports.getFollowingList = asyncHandler(async (req, res, next) => {
  const playerId = req.player._id; // The current player's ID
  const page = parseInt(req.query.page) || 1; // Current page (1-indexed)
  const limit = parseInt(req.query.limit) || 10; // Number of influencers per page
  const searchTerm = req.query.search || ""; // Search term from query

  // First step: Get the list of influencer IDs the player is following
  const pipeline = [
    {
      $match: { playerId } // Match the playerId in the follows collection
    },
    {
      $lookup: {
        from: "influencers", // Join the influencers collection
        localField: "influencerId", // Field from follows collection
        foreignField: "_id", // Field from influencers collection
        as: "influencerInfo" // Name of the array to hold the matched influencers
      }
    },
    { $unwind: "$influencerInfo" }, // Unwind the matched influencers to avoid arrays
    {
      $project: {
        // _id: 0, // Exclude the original _id from follows
        _id: "$influencerInfo._id", // Include influencer's ID
        firstName: "$influencerInfo.firstName",
        displayName: "$influencerInfo.displayName",
        followCount: "$influencerInfo.followCount",
        profilePic: { $concat: [process.env.IMAGE_URL, '$influencerInfo.imageId'] },
        isFollowing:true
      }
    },
    { $skip: (page - 1) * limit }, // Skip for pagination
    { $limit: limit } // Limit for pagination
  ];

  // Conditionally add search logic if a search term is provided
  if (searchTerm) {
    pipeline.unshift({
      $match: {
        $or: [
          { "influencerInfo.firstName": { $regex: searchTerm, $options: "i" } },  // Case-insensitive search on firstName
          { "influencerInfo.displayName": { $regex: searchTerm, $options: "i" } } // Case-insensitive search on displayName
        ]
      }
    });
  }

  // Run the aggregation pipeline
  const influencers = await PlayerInfluencer.aggregate(pipeline);

  res.json({ data: influencers }); // Return the list of following influencers
});
exports.uploadeImage = asyncHandler(async (req, res, next) => {
   //console.log('fileiii->>>>', req.body, req.files);
  let row = await Influencer.findById(req.params.id);

  if (!row) {
    return next(
      new ErrorResponse(`game  not found`)
    );
  }
  if (!req.files) {
    return next(
      new ErrorResponse(`File  not uploaded`)
    );
  }
  let fieldsToUpdate;

  let filename;
  let filePath;

  if (req.files) {
    
    filename = '/img/inf/' +  req.files.file.name;
    uploadFile(req, filename, res);
    
      if (row.imageId) {
        filePath = path.resolve(__dirname, '../../assets/' + row.imageId);
        deletDiskFile(filePath);
      }
      fieldsToUpdate = { 'imageId': filename };

    
  }
  if (fieldsToUpdate) {
    row = await Influencer.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });
  }


  res.status(200).json({
    success: true,
    data: row
  });
});

exports.geTopList = asyncHandler(async (req, res, next) => {
 
  const influencers = await Influencer.aggregate([
    {
      $match: {
        status: 'active' // Filter only active users
      }
    },
    {
      $sort: {
        followCount: -1 // Sort by followCount in descending order
      }
    },
    {
      $limit: 10 // Limit the results to 10
    },
    {
      $project: {
        _id: 1,
        firstName: 1,
        displayName: 1,
        followCount:1,
        isFollowing: { $gt: [{ $size: "$isFollowing" }, 0] },
        profilePic: { $concat: [process.env.IMAGE_URL, '$imageId'] },
      }
    }
  ]);

  
  res.json({ data: influencers }); // Return the list of following influencers
});