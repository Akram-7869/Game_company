const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Setting = require('../models/Setting');

const Transaction = require('../models/Transaction');
const Coupon = require('../models/Coupon');

// const Player = require('../models/Player');
// const PlayerCtrl = require('./players');
let axios = require('axios');
const urlParser = require('url');






exports.getToken = asyncHandler(async (req, res, next) => {
  let { amount, membership_id = "", coupon_id = "" } = req.body;
  const row = await Setting.findOne({ type: 'PAYMENT', name: 'ZERO' });
  if (amount <= 0) {
    return next(
      new ErrorResponse(`Amount required`)
    );
  }
  //create a transaction ;
  if (!req.player) {
    return next(
      new ErrorResponse(`Player not found`)
    );
  }
  //check coupon
  if (coupon_id.length === 24) {
    let couponRec = await Coupon.findOne({ minAmount: { $lte: amount }, maxAmount: { $gte: amount }, active: true, _id: coupon_id });
    if (!couponRec) {
      return next(
        new ErrorResponse(`Invalid Coupon`)
      );
    }
    if (couponRec.expiryDate) {
      let today = new Date();
      if (couponRec.expiryDate < today) {
        await Coupon.findByIdAndUpdate(couponRec._id, { active: false });
        return next(
          new ErrorResponse(`Code Expired`)
        );

      }
    }
    if (couponRec.useOnlyOnce === true) {
      let used = await Transaction.findOne({ 'playerId': req.player._id, 'couponId': couponRec._id, 'status': 'complete' });
      if (used) {
        return next(new ErrorResponse(`Code Used`));
      }
    }
    if (couponRec.usageLimit > 1) {
      let useCount = await Transaction.find({ 'couponId': couponRec._id });
      if (useCount > couponRec.usageLimit) {
        await Coupon.findByIdAndUpdate(couponRec._id, { active: false });
        return next(new ErrorResponse(`Code Limit reached`));

      }
    }

  }

  let tranData = {
    'playerId': req.player._id,
    'amount': amount,
    'couponId': coupon_id,
    // 'coin': coinDoc.coin,
    'membershipId': membership_id,
    'transactionType': "credit",
    'note':  'Add Money',
    'paymentGateway': 'Phonepay',
    'logType': 'payment',
    'prevBalance': 0,
    'stateCode': req.player.stateCode
  }
  let tran = await Transaction.create(tranData);
  if (!tran._id) {
    return next(
      new ErrorResponse(`Provide all required fields`)
    );
  }

  // let data = {
  //   account_id: row.one.APP_ID,
  //   secret_key: row.one.SECRET_KEY,
  //   payment_id: tran._id,
  //   payment_purpos: 'Add Money',
  //   payment_amount: amount,
  //   payment_name: 'test',
  //   payment_phone: 1234567890,
  //   payment_email: 'test@test.com',
  //   redirect_url: process.env.API_URI + '/payments/zeropg/notify?payment_id=' + tran._id,
  // };
  let gatewayurl = ' https://upimoney.co.in/api/payin/transaction';
  if (row.one.mode === 'production') {
    gatewayurl = ' https://upimoney.co.in/api/payin/transaction';
  }
  //console.log(data, 'input');
  let data = {
    "token": row.one.SECRET_KEY,
    "type": "upi",
    "mobile": "1111111111",
    "name": req.player.firstName ?? 'user',
    "email": req.player.email ?? 'test@tp.com',
    "callback": "https://panel.blackteenpatti.com/api/v1/payments/zeropg/notify",
    "apitxnid": tran._id,
    "amount": amount
  };
 

  axios.post(gatewayurl, data)
    .then( response => {
      console.log(response.data)
      let url =response.data.upiString.payment_url;
      res.status(200).json({
        success: true,
        data: { url, id: tran._id }
    });
    })
    .catch(function (error) {
      console.log(error.data || error);
      return next(
        new ErrorResponse(`Try again`)
      );
    });
});


exports.handleNotify = asyncHandler(async (req, res, next) => {
  console.log('handleNotify-body', req.query, req.body);
  // {
  //      apitxnid: 'apitxnid12456',
  //      amount: 1,
  //      status: 'success',
  //      refno: '404811830649'
  //    }
  let {  apitxnid} = req.query;
 
  const row = await Setting.findOne({ type: 'PAYMENT', name: 'ZERO' });
  const url = 'https://upimoney.co.in/api/transaction/query?token='+ row.SECRET_KEY ;
  data = {
    "apitxnid": apitxnid,
    "product": "payin"
  };

  axios.post(url, { fetch_payment: data }, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(async function (response) {

      console.log(response.data, 'hook-reponse');
       await handleSuccess(apitxnid,response.data);
      return res.status(200).json({
        success: true,
        data: {}
      });
    })
    .catch(function (error) {
      console.log(error.data);
      return next(
        new ErrorResponse(`Try again`)
      );
    });
});


let handleSuccess = async (orderId, responsObj) => {

  let tran = await Transaction.findOne({ paymentId: orderId, status: 'log' });
  if (!tran) {
    return;
  }
  if (tran.paymentStatus == 'FAILED') {
    return;
  }
  let updateField = {}
  let playerStat = {};
  let player;
  updateField = { status: 'complete', 'paymentStatus': responsObj.status.toUpperCase(), paymentId: responsObj.status.refno};
  if (responsObj.status.toUpperCase() === 'SUCCESS') {
    player = await tran.creditPlayerDeposit(tran.amount);
  }
  await Transaction.findByIdAndUpdate(tran._id, updateField);
  console.log('Deposit added');


  if (tran.couponId.length === 24) {
    let bonusAmount = 0;
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
    bonusTran = await Transaction.create(tranBonusData);
    bonusTran.creditPlayerBonus(bonusAmount);
    console.log('bonus added');

  }


  // res.status(200).json({
  //   success: true,
  //   data: player
  // });
}