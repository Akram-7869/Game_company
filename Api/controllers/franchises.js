const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Franchise = require('../models/Franchise');
const Transaction = require('../models/Transaction');


// @desc      Get all users
// @route     GET /api/v1/auth/users
// @access    Private/Admin
exports.getFranchises = asyncHandler(async (req, res, next) => {
  Franchise.dataTables({
    limit: req.body.length,
    skip: req.body.start,
    select: { 'firstName': 1, 'phone': 1, 'email': 1, 'status': 1, 'createdAt': 1, 'role': 1 ,totalBalance:1},
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
exports.getFranchise = asyncHandler(async (req, res, next) => {
  const user = await Franchise.findById(req.params.id).select('+upi +usdt +bank');

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc      Create user
// @route     POST /api/v1/auth/users
// @access    Private/Admin
exports.createFranchise = asyncHandler(async (req, res, next) => {
  if (req.body.role === 'superadmin') {
    return next(
      new ErrorResponse(
        `Franchise ${req.user.id} is not authorized to update provider ${provider._id}`)
    );
  }
  console.log(req.body)
  const user = await Franchise.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc      Update user
// @route     PUT /api/v1/auth/users/:id
// @access    Private/Admin
exports.updateFranchise = asyncHandler(async (req, res, next) => {
  const user = await Franchise.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorResponse(`Franchise  not found`)
    );
  }
  //  Make sure user is provider owner
  if (req.staff.role == 'superadmin') {
    if (req.staff.role == user.role && user.id !== req.staff.id) {
      return next(
        new ErrorResponse(
          `Franchise  is not authorized to update`)
      );
    }

  } else if (req.staff.role == 'admin') {
    if (user.role == 'superadmin') {
      return next(
        new ErrorResponse(
          `Franchise  is not authorized to update`)
      );
    }

  } else if (user.id !== req.staff.id) {
    return next(
      new ErrorResponse(
        `Franchise  is not authorized to update`)
    );
  }

  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.status = req.body.status;
  user.phone = req.body.phone;

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
exports.deleteFranchise = asyncHandler(async (req, res, next) => {
  const user = await Franchise.findById(req.params.id);

  // Make sure user is provider owner
  if (user.role === 'superadmin') {
    return next(
      new ErrorResponse(
        `Franchise is not authorized`)
    );
  }
  await Franchise.findByIdAndDelete(req.params.id);

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
  let user = req.staff;
  if (!user) {
    return next(
      new ErrorResponse(`Franchise  not found`)
    );
  }
  //  Make sure user is provider owner
  if (user.role === 'superadmin') {

    if (user.resetPasswordToken !== code) {
      return next(
        new ErrorResponse(`Invalid code`)
      );
    };

    user.password = req.body.password;


  } else {
    // Check for user
    user = await Franchise.findById(user._id).select('+password');

    if (!user) {
      return next(new ErrorResponse('Franchise not found'));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(oldpass);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials'));
    }

    user.password = req.body.password;

  }
  await user.save();
  res.status(200).json({
    success: true,
    data: user
  });
});

exports.withDrawRequest = asyncHandler(async (req, res, next) => {
  let { amount, note='withdraw request ', gameId, to, upiId } = req.body;

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
  let user = await Franchise.findById(req.user._id).select('+bank +upi');

  let tranData = {
    'userId': req.user._id,
    'amount': amount,
    'transactionType': "debit",
    'note': note,
    'prevBalance': req.user.totalBalance,
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
  let incFiled = { totalBalance: -amount };

  if (taxableAmount > 0) {
    // tds = taxableAmount * (parseFloat(row.tds * 0.01));
    // incFiled['totalTaxableAmount'] = taxableAmount;
    // incFiled['totalTds'] = tds;
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
  user = await Franchise.findByIdAndUpdate(req.user._id, { $inc: incFiled }, {
    new: true,
    runValidators: true
  });


  res.status(200).json({
    success: true,
    data: user
  });
});
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const user = await Franchise.findById(req.user.id);
  let { filename } = req.body;
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
    
  }

  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.phone = req.body.phone;
  user.displayName = req.body.displayName;
  if (filename) {
    user.imageId = filename;
  }

  //user.isNew = false;
  await user.save();
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
    user = await Franchise.findById(req.params.id);
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


  user = await Franchise.findByIdAndUpdate(user.id, { bank: fieldsToUpdate }, {
    new: true,
    runValidators: true
  });

  //Franchise.isNew = false;
  // await Franchise.save();
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
    user = await Franchise.findById(req.params.id);
    //fieldsToUpdate['kycStatus'] = kycStatus;
  } else if (req.user) {
    user = req.user;
  }
  if (!user) {
    return next(
      new ErrorResponse(`User  not found`)
    );
  }
  user = await Franchise.findByIdAndUpdate(user.id, { wallet: fieldsToUpdate }, {
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

  user = await Franchise.findByIdAndUpdate(user.id, { upi: fieldsToUpdate }, {
    new: true,
    runValidators: true
  });


  res.status(200).json({
    success: true,
    data: user
  });
});

exports.updateUsdt = asyncHandler(async (req, res, next) => {
  let {usdtId} = req.body;
  let user = await Franchise.findById(req.user.id);
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
    
  }
  let fieldsToUpdate ={usdtId};
  user = await Franchise.findByIdAndUpdate(user.id, { usdt: fieldsToUpdate }, {
    new: true,
    runValidators: true
  });   
  res.status(200).json({
    success: true,
    data: user
  });
});
