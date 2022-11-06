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
      new ErrorResponse(`Player not found`)
    );
  }
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

      //  console.log(response.data);
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
  console.log('casfree-notify-body');

  //const row = await Setting.findOne({ type: 'PAYMENT', name: 'CASHFREE' });
  //let ok = verifySignature(req.body, req.body.signature, row.one.SECRET_KEY);
  //console.log('casfree-ok', ok);
  if (req.body.data.payment.payment_status !== 'SUCCESS') {
    return next(
      new ErrorResponse(`Payment not success full`)
    );
  }
  const orderId = req.body.data.order.order_id;
  //const payment_status = req.body.data.payment.payment_status;
  const amount = parseFloat(req.body.data.payment.payment_amount).toFixed(2);
  // if (!ok) {
  //    {
  //  data: {
  //      order: {
  //        order_id: '628a3967594a521adb9983e0',
  //        order_amount: 49,
  //        order_currency: 'INR',
  //        order_tags: null
  //      },
  //      payment: {
  //        cf_payment_id: 969879417,
  //        payment_status: 'SUCCESS',
  //        payment_amount: 49,
  //        payment_currency: 'INR',
  //        payment_message: '00::Transaction success',
  //        payment_time: '2022-05-22T18:53:53+05:30',
  //        bank_reference: '214261124865',
  //        auth_id: null,
  //        payment_method: [Object],
  //        payment_group: 'upi'
  //      },
  //      customer_details: {
  //        customer_name: null,
  //        customer_id: null,
  //        customer_email: 'mobile@52.com',
  //        customer_phone: '918758989518'
  //      }
  //    },
  //    event_time: '2022-05-22T18:54:06+05:30',
  //    type: 'PAYMENT_SUCCESS_WEBHOOK'
  //  }
  //     new ErrorResponse(`Signature failed`)
  //   );
  // }
  let tran = await Transaction.findOne({ _id: orderId, 'amount': { $eq: amount }, status: 'log' });
  if (!tran) {
    return next(
      new ErrorResponse(`Transaction not found`)
    );
  }
  let playerStat = {};
  let player;

  if (tran.membershipId) {
    // player = await tran.memberShip(amount);

    // await Transaction.findByIdAndUpdate(tran._id, { status: 'complete', 'paymentStatus': 'SUCCESS' });
    // if (player && player.refrer_player_id) {
    //   playerStat = { $inc: { refer_vip_count: 1 } };
    //   await Player.findByIdAndUpdate(player.refrer_player_id, playerStat, {
    //     new: true,
    //     runValidators: true
    //   });
    // }
    // console.log('Membership added');
  } else {

    player = await tran.creditPlayerDeposit(amount);
    await Transaction.findByIdAndUpdate(tran._id, { status: 'complete', 'paymentStatus': 'SUCCESS' });
    console.log('Deposit added');
    if (player.refrer_player_id) {
      playerStat = { $inc: { refer_deposit_count: 1 } };
      await Player.findByIdAndUpdate(player.refrer_player_id, playerStat, {
        new: true,
        runValidators: true
      });
    }

    if (tran.couponId) {
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
        'paymentId': tran._id
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
exports.payout = asyncHandler(async (req, res, next) => {
  const row = await Setting.findOne({ type: 'PAYMENT', name: 'CASHFREE' });
  let { withdrawId } = req.body;
  let tran = await Transaction.findOne({ _id: withdrawId, logType: 'withdraw', status: 'log' });

  if (!tran) {
    return next(
      new ErrorResponse('Transaction canot be processed')
    );
  }
  let player = await Player.findById(tran.playerId).select('+withdraw');
  if (player.status === 'banned') {
    return next(
      new ErrorResponse('Account is banned')
    );
  }
  if (!player.phone) {
    return next(
      new ErrorResponse('Phone no is required')
    );
  }
  let bene = {};
  let transferMode = '';

  bene['phone'] = player.phone;
  bene['name'] = player.firstName;
  bene['email'] = player.email;
  bene['address1'] = 'India' + player.state;
  if (tran.withdrawTo === 'bank') {
    transferMode = 'banktransfer';
    bene = {
      "bankAccount": tran.withdraw.get('bankAccount'),
      "ifsc": tran.withdraw.get('bankIfc'),
      "name": tran.withdraw.get('bankAccountHolder'),
      "email": player.email,
      "phone": player.phone,
      "address1": tran.withdraw.get('bankAddress')
    };
  } else if (tran.withdrawTo === 'wallet') {
    transferMode = 'upi';
    bene['vpa'] = tran.withdraw.get('walletAddress');
  } else if (tran.withdrawTo === 'upi') {
    transferMode = 'upi';
    bene['vpa'] = tran.withdraw.get('upiId');
  }


  let data = JSON.stringify({
    "amount": tran.amount,
    "transferId": tran._id,
    "transferMode": transferMode,
    "remarks": "withdraw request",
    "beneDetails": bene
  });

  let config = {
    method: 'post',
    url: 'https://payout-api.cashfree.com/payout/v1/authorize',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': row.one.PAYOUT_ID,
      'x-client-secret': row.one.PAYOUT_SECRET,
    }
  };

  let response = await axios(config);
  if (response['data']['status'] === 'ERROR') {

    return next(
      new ErrorResponse(response['data']['message'])
    );

  }

  let token = response['data']['data']['token']
  //   console.log(token);
  let url = 'https://payout-api.cashfree.com/payout/v1/directTransfer';
  console.log(data);
  let resPayout = await axios({
    method: 'post',
    url: url,
    data: data,
    headers: {
      Authorization: 'Bearer ' + token,
    }

  })

  if (response['data']['status'] === 'ERROR') {

    return next(
      new ErrorResponse(response['data']['message'])
    );

  }
  let updateData = { 'paymentStatus': 'ERROR', gateWayResponse: JSON.stringify(resPayout['data']) };
  if (resPayout['data']['status'] == 'SUCCESS') {
    updateData['status'] = 'complete';
    updateData['paymentStatus'] = 'SUCCESS';
  }
  if (resPayout['data']['status'] == 'PENDING') {
    updateData['paymentStatus'] = 'PENDING';
  }
  await Transaction.findByIdAndUpdate(tran._id, updateData);

  res.status(200).json({
    success: true,
    data: resPayout['data']
  });

});
exports.upiValidate = async (req, res, next) => {
  //disalbe it
  return { 'status': 'SUCCESS' };
  //asyncHandler(async (req, res, next) => {
  const row = await Setting.findOne({ type: 'PAYMENT', name: 'CASHFREE' });
  let { upiId } = req.body;

  //console.log('req.query', upiId);

  let config = {
    method: 'post',
    url: 'https://payout-api.cashfree.com/payout/v1/authorize',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': row.one.PAYOUT_ID,
      'x-client-secret': row.one.PAYOUT_SECRET,
    }
  };

  let response = await axios(config);

  if (response['data']['status'] === 'ERROR') {

    return response['data'];

  }

  let token = response['data']['data']['token']
  //   console.log(token);
  //let url = 'https://payout-api.cashfree.com/payout/v1/validation/upiDetails?vpa=success@upi&name=Cashfree';
  let url = 'https://payout-api.cashfree.com/payout/v1/validation/upiDetails?vpa=' + upiId;


  let resPayout = await axios({
    method: 'get',
    url: url,
    headers: {
      Authorization: 'Bearer ' + token,
    }

  });
  // console.log('upi-verify', upiId, resPayout['data']);
  // if (resPayout['data']['status'] === 'ERROR') {

  //   return resPayout['data'];

  // }

  return resPayout['data'];
};

