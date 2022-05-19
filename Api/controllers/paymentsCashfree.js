const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Setting = require('../models/Setting');
const crypto = require('crypto');

const Transaction = require('../models/Transaction');
const Coupon = require('../models/Coupon');
const Player = require('../models/Player');
let axios = require('axios');




const paymentConfig = async (amount, trxId) => {
  const row = await Setting.findOne({ type: 'PAYMENT', name: 'CASHFREE' });
  let data = JSON.stringify({
    "orderId": trxId,
    "orderAmount": amount,
    "orderCurrency": "INR"
  });
  let config = {
    method: 'post',
    url: 'https://api.cashfree.com/api/v2/cftoken/order',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': row.one.APP_ID,
      'x-client-secret': row.one.SECRET_KEY
    },
    data: data
  };

  return config;

}

exports.getToken = asyncHandler(async (req, res, next) => {
  let { amount, membership_id = "", coupon_id = "" } = req.body;
  if (amount <= 0) {
    return next(
      new ErrorResponse(`Amount required`)
    );
  }
  //create a transaction ;
  if (!req.player) {
    return next(
      new ErrorResponse(`Invalid Code`)
    );
  }


  let tranData = {
    'playerId': req.player._id,
    'amount': amount,
    'couponId': coupon_id,
    'membershipId': membership_id,

    'transactionType': "credit",
    'note': req.body.note,
    'paymentGateway': 'Cash Free',
    'logType': 'payment',
    'prevBalance': 0,

  }
  let tran = await Transaction.create(tranData);
  if (!tran._id) {
    return next(
      new ErrorResponse(`Provide all required fields`)
    );
  }

  let config = await paymentConfig(amount, tran._id);

  axios(config)
    .then(function (response) {
      response.data['orderId'] = tran._id;
      response.data['appId'] = config.headers['x-client-id'];
      response.data['notifyUrl'] = process.env.API_URI + '/payments/cashfree/notify';
      response.data['source'] = 'app-sdk';
      response.data['orderCurrency'] = 'INR';
      response.data['customerEmail'] = req.player.email;
      response.data['customerPhone'] = req.player.phone;
      response.data['customerName'] = req.player.firstName;
      response.data['orderAmount'] = amount;

      console.log(response.data);
      res.status(200).json({
        success: true,
        data: response.data
      });
    })
    .catch(function (error) {
      return next(
        new ErrorResponse(`Try again`)
      );
    });
});

exports.getKey = asyncHandler(async (req, res, next) => {
  const row = await Setting.findOne({ type: 'PAYMENT', name: 'CASHFREE' });
  tran = new Transaction();
  row.one['orderId'] = tran._id;
  res.status(200).json({
    success: true,
    data: row.one
  });
});

exports.handleNotify = asyncHandler(async (req, res, next) => {
  console.log('casfree-notify-body', req.body);
  // {
  //   orderId: '628528ebdf38c5099b17e3b4',
  //   orderAmount: '10.00',
  //   referenceId: '961967351',
  //   txStatus: 'SUCCESS',
  //   paymentMode: 'UPI',
  //   txMsg: '00::Transaction Success',
  //   txTime: '2022-05-18 22:42:13',
  //   signature: 'gyGch0TKO/KMvPnnhrJ7cIr0SLfcRjyuORnyqN706ww='
  // }
  const row = await Setting.findOne({ type: 'PAYMENT', name: 'CASHFREE' });
  let ok = verifySignature(req.body, req.body.signature, row.one.SECRET_KEY);
  console.log('casfree-ok', ok);
  if (req.body.txStatus !== 'SUCCESS') {
    return next(
      new ErrorResponse(`Payment not success full`)
    );
  }
  // if (!ok) {
  //   return next(
  //     new ErrorResponse(`Signature failed`)
  //   );
  // }
  let tran = await Transaction.findOne({ _id: req.body.orderId, status: 'log' });
  if (!tran) {
    return next(
      new ErrorResponse(`Transaction not found`)
    );
  }
  let playerStat = {};
  let player;
  const amount = req.body.orderAmount;
  if (tran.membershipId) {
    player = await tran.memberShip(amount);
    await Transaction.findByIdAndUpdate(tran._id, { status: 'complete' });
    playerStat = { $inc: { refer_vip_count: 1 } };
    await Player.findByIdAndUpdate(player.refrer_player_id, playerStat, {
      new: true,
      runValidators: true
    });
    console.log('Membership added');
  } else {

    player = await tran.creditPlayerDeposit(amount);
    await Transaction.findByIdAndUpdate(tran._id, { status: 'complete' });
    console.log('Deposit added');
    playerStat = { $inc: { refer_deposit_count: 1 } };
    await Player.findByIdAndUpdate(player.refrer_player_id, playerStat, {
      new: true,
      runValidators: true
    });
    if (tran.couponId) {
      let bonusAmount = 0;
      let couponRec = await Coupon.findOne({ _id: tran.couponId });
      if (!couponRec) {
        res.status(200);
        return;
      }
      if (couponRec.minAmount > amount) {
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
        'logType': 'payment',
        'prevBalance': player.balance,
        'paymentStatus': 'SUCCESS',
        'status': 'complete',
        'paymentId': req.body.referenceId
      }
      bonusTran = await Transaction.create(tranBonusData);
      bonusTran.creditPlayerBonus(bonusAmount);

      console.log('bonus added');

    }
  }

  res.status(200).json({
    success: true,
    data: player
  });
});


const verifySignature = (body, signature, clientSecret) => {

  if (!(body && signature && clientSecret)) {
    throw Error(
      'Invalid Parameters: Please give request body,' +
      'signature sent in X-Cf-Signature header and ' +
      'clientSecret from dashboard as parameters',
    );
  }

  const expectedSignature = crypto
    .createHmac('sha256', clientSecret)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === signature;
};
