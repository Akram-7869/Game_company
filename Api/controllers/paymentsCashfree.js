const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Setting = require('../models/Setting');
const { PaymentGateway } = require('cashfree-sdk');
const { Payouts } = require('cashfree-sdk');
const Transaction = require('../models/Transaction');

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
    url: 'https://test.cashfree.com/api/v2/cftoken/order',
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
  let amount = req.body.amount;
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
    'transactionType': "credit",
    'note': req.body.note,
    'paymentGateway': 'Cash Free',
    'logType': 'payment',
    'prevBalance': 0,
    'logType': 'payment'
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
  const row = await Setting.findOne({ type: 'PAYMENT', name: 'CASHFREE' });
  let ok = Payouts.verifySignature(req.body, req.body.signature, row.one.SECRET_KEY);
  if (req.body.txStatus !== 'SUCCESS') {
    return next(
      new ErrorResponse(`Payment not success full`)
    );
  }
  if (!ok) {
    return next(
      new ErrorResponse(`Signature failed`)
    );
  }

  let fieldsToUpdate = {
    $inc: { balance: parseInt(req.body.orderAmount) }
  }
  let tran = await Transaction.find({ _id: req.body.orderId, status: 'log' });
  if (!tran) {
    return next(
      new ErrorResponse(`Transaction not found`)
    );
  }

  let player = await Player.findByIdAndUpdate(tran.playerId, fieldsToUpdate, {
    new: true,
    runValidators: true
  });
  await Transaction.findByIdAndUpdate(tran._id, { status: 'complete' });

  res.status(200).json({
    success: true,
    data: player
  });
});