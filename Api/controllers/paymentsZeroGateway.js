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
    account_id :row.one.APP_ID,
    secret_key :row.one.SECRET_KEY,
      payment_id:tran._id,
      payment_purpos:'Add Money',
      payment_amount:amount,
      payment_name:'test',
      payment_phone:1234567890,
      payment_email:'test@test.com',
      redirect_url:process.env.API_URI + '/payments/zeropg/notify?payment_id='+tran._id,
  };
    //data = JSON.stringify(data);
  
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
    headers: { 'Content-Type': 'application/json', },
    data:  {"init_payment" : data}
  };

  axios.post(gatewayurl, { init_payment: data }, {
    headers: {
        'Content-Type': 'application/json'
    }
})
    .then(function (response) {
    
       console.log(response.data);
       return    res.status(200).json({
        success: true,
        data: { id: tran._id, url: response.data }
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
  console.log('handleNotify-notify-body',req.query);
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
    url: url,
    headers: { accept: 'application/json', 'Content-Type': 'application/json', },
    data:  {"fetch_payment" : data}
  };

  axios.post(url, { fetch_payment: data }, {
    headers: {
        'Content-Type': 'application/json'
    }
})
    .then(function (response) {
      
      console.log(response.data);

      return res.status(200).json({
        success: true,
        data: response.data
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


 