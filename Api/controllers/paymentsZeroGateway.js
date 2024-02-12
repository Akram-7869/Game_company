const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Setting = require('../models/Setting');
const crypto = require('crypto');

const Transaction = require('../models/Transaction');
const Coupon = require('../models/Coupon');
// const Coin = require('../models/Coin');

const Player = require('../models/Player');
const PlayerCtrl = require('./players');
let axios = require('axios');






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
  // let coinDoc = await Coin.findOne({ amount, active: true });
  // if (!coinDoc) {
  //   return next(
  //     new ErrorResponse(`Amount not allowed`)
  //   );
  // }

  let tranData = {
    'playerId': req.player._id,
    'amount': amount,
    'couponId': coupon_id,
    // 'coin': coinDoc.coin,
    'membershipId': membership_id,
    'transactionType': "credit",
    'note': req.body.note,
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
  
  let data ={
    "account_id" :row.one.APP_ID,
    "secret_key" :row.one.SECRET_KEY,
      "payment_id":tran._id,
      "payment_purpose":'Add Money',
      "payment_amount":amount,
      "payment_name":'test',
      "payment_phone":'1234567890',
      "payment_email":'test@test.com',
      "redirect_url":process.env.API_URI + '/payments/zeropg/notify?payment_id='+tran._id,
  };

  console.log(data, 'data');
  //let urlpg = 'https://api.phonepe.com/apis/hermes/pg/v1/pay';
  let gatewayurl = 'https://zgw.oynxdigital.com/api_payment_init.php';
  if (row.one.mode === 'production') {
    gatewayurl = 'https://zgw.oynxdigital.com/api_payment_init.php';
  }
  let urlpg = row.one.URL;
  const options = {
    method: 'POST',
    url: gatewayurl,
    headers: { accept: 'application/json', 'Content-Type': 'application/json', },
    data:  data
  };

  axios
    .request(options)
    .then(function (response) {
    
       console.log(response);

      return res.status(200).json({
        success: true,
        data: d
      });
    })
    .catch(function (error) {
      console.log(error.data);
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
  console.log('zeroo-notify-body',req.query);
  let { payment_id } = req.query;
  const url ='https://zgw.oynxdigital.com/api_payment_status.php';
  const row = await Setting.findOne({ type: 'PAYMENT', name: 'ZERO' });
  
  data = {
    "account_id" :row.one.APP_ID,
    "secret_key" :row.one.SECRET_KEY,
    "payment_id" :payment_id
  };

  const options = {
    method: 'POST',
    url: gatewayurl,
    headers: { accept: 'application/json', 'Content-Type': 'application/json', },
    data:  data
  };

  axios
    .request(options)
    .then(function (response) {
      
      console.log(response);

      return res.status(200).json({
        success: true,
        data: response
      });
    })
    .catch(function (error) {
      console.log(error.data);
      return next(
        new ErrorResponse(`Try again`)
      );
    });
  



  // let tran = await Transaction.findOne({ _id: orderId, status: 'log' });
  // if (!tran) {
  //   return next(
  //     new ErrorResponse(`Transaction not found`)
  //   );
  // }
  // let updateField = {}

  // let playerStat = {};
  // let player;

  // if (tran.membershipId) {
  //   // player = await tran.memberShip(amount);

  //   // await Transaction.findByIdAndUpdate(tran._id, { status: 'complete', 'paymentStatus': 'SUCCESS' });
  //   // if (player && player.refrer_player_id) {
  //   //   playerStat = { $inc: { refer_vip_count: 1 } };
  //   //   await Player.findByIdAndUpdate(player.refrer_player_id, playerStat, {
  //   //     new: true,
  //   //     runValidators: true
  //   //   });
  //   // }
  //   // console.log('Membership added');
  // } else {
  //   updateField = { status: 'complete', 'paymentStatus': responsObj.data.state, paymentId: responsObj.data.transactionId };

  //   if (responsObj.code === 'PAYMENT_SUCCESS') {
  //     updateField = { status: 'complete', 'paymentStatus': 'SUCCESS', paymentId: responsObj.data.transactionId };
  //     player = await tran.creditPlayerDeposit(tran.coin);
  //   }


  //   await Transaction.findByIdAndUpdate(tran._id, updateField);
    console.log('Deposit added');
    // if (player.refrer_player_id) {
    //   playerStat = { $inc: { refer_deposit_count: 1 } };
    //   await Player.findByIdAndUpdate(player.refrer_player_id, playerStat, {
    //     new: true,
    //     runValidators: true
    //   });
    // }

    // if (tran.couponId.length === 24) {
    //   let bonusAmount = 0;
    //   let couponRec = await Coupon.findOne({ 'minAmount': { $lte: amount }, 'maxAmount': { $gte: amount }, '_id': tran.couponId });
    //   if (!couponRec) {
    //     console.log('Coupon not found');
    //     res.status(200);
    //     return;
    //   }
    //   if (couponRec.couponType == 'percentage') {
    //     bonusAmount = amount * (couponRec.couponAmount * 0.01);
    //   } else {
    //     bonusAmount = couponRec.couponAmount;
    //   }

    //   let tranBonusData = {
    //     'playerId': tran.playerId,
    //     'amount': bonusAmount,
    //     'transactionType': "credit",
    //     'note': 'Bonus amount',
    //     'paymentGateway': 'Cashfree Pay',
    //     'logType': 'bonus',
    //     'prevBalance': player.balance,
    //     'paymentStatus': 'SUCCESS',
    //     'status': 'complete',
    //     'paymentId': tran._id,
    //     'stateCode': player.stateCode

    //   }
    //   bonusTran = await Transaction.create(tranBonusData);
    //   bonusTran.creditPlayerBonus(bonusAmount);
    //   console.log('bonus added');

    // }
  // }

  // res.status(200).json({
  //   success: true,
  //   data: player
  // });
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
    "amount": tran.totalAmount,
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

exports.panValidate = async (req, res, next) => {
  //asyncHandler(async (req, res, next) => {
  if (!req.player) {
    return next(
      new ErrorResponse(`Player not found`)
    );
  }
  if (req.panStatus === 'verified') {
    return next(
      new ErrorResponse(`Pan is already verified`)
    );
  }
  const row = await Setting.findOne({ type: 'PAYMENT', name: 'CASHFREE' });
  let { name, pan } = req.body;

  let data = JSON.stringify({
    name,
    pan
  });
  let config = {
    method: 'post',
    url: 'https://sandbox.cashfree.com/verification/pan',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': row.one.APP_ID,
      'x-client-secret': row.one.SECRET_KEY
    },
    data: data

  };
  try {
    let response = await axios(config);
    if (response['data']['valid'] === true) {
      let updateData = { 'panNumber': response['data']['pan'], 'panStatus': 'verified' }
      await Player.findByIdAndUpdate(req.player._id, updateData);

    }


    res.status(200).json({
      success: true,
      data: response['data']

    });
  } catch (error) {
    console.error(error);
    next(
      new ErrorResponse(error['response']['data']['message'])
    );
  }
};


let calculateXHash = (data, row) => {

  let saltKey = row.one.SALT;
  let saltIndex = row.one.SALT_INDEX
  const sha256String = crypto.createHash('sha256').update(`${data}${saltKey}`).digest('hex');
  return `${sha256String}###${saltIndex}`;
}