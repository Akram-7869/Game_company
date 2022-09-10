const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Notification = require('../models/Notification');
const File = require('../models/File');
const PlayerNotifcation = require('../models/PlayerNotifcation');
const Player = require('../models/Player');
const mongoose = require('mongoose');
const admin = require('../utils/fiebase');


// @desc      Get all Notificationss
// @route     GET /api/v1/auth/Notificationss
// @access    Private/Admin
exports.getPlayerNotifications = asyncHandler(async (req, res, next) => {

  // if (!req.player) {
  //   return next(
  //     new ErrorResponse(`player  not found`)
  //   );
  // }
  // let query = [
  //   {
  //     '$match': {
  //       'status': 'active',
  //       // 'createdAt': {
  //       //   '$gt': req.player.notificationRead
  //       // }
  //     }
  //   }, {
  //     '$lookup': {
  //       'from': 'playernotications',
  //       'let': {
  //         'notificationId': '$_id',
  //         'playerId': req.player._id
  //       },
  //       'pipeline': [
  //         {
  //           '$match': {
  //             '$expr': {
  //               '$and': [
  //                 {
  //                   '$eq': [
  //                     '$notificationId', '$$notificationId'
  //                   ]
  //                 }, {
  //                   '$eq': [
  //                     '$playerId', '$$playerId'
  //                   ]
  //                 }, {
  //                   '$eq': [
  //                     '$read', false
  //                   ]
  //                 }
  //               ]
  //             }
  //           }
  //         }
  //       ],
  //       'as': 'player_not'
  //     }
  //   }, {
  //     '$match': {
  //       '$or': [
  //         {
  //           'player_not.0': {
  //             '$exists': true
  //           }
  //         }, {
  //           'sendTo': 'all'
  //         }
  //       ]
  //     }
  //   }, { $sort: { _id: -1 } }
  // ];

  // if (req.player.notificationRead) {
  //   query[0]['$match']['createdAt'] = { $gt: req.player.notificationRead };
  // }
  // let rows = await Notification.aggregate(query);
  // rows = rows.map(d => {
  //   d['imageUrl'] = process.env.API_URI + '/files/' + d.imageId;
  //   return d;
  // });
  res.status(200).json([]);
});
// @desc      Get all Notifications
// @route     GET /api/v1/auth/Notifications
// @access    Private/Admin
exports.getNotifications = asyncHandler(async (req, res, next) => {

  Notification.dataTables({
    limit: req.body.length,
    skip: req.body.start,
    //select:{ 'complexity':1, 'status':1, 'createdAt':1},
    search: {
      value: req.body.search ? req.body.search.value : '',
      fields: ['playerId', 'read']
    },
    sort: {
      _id: -1
    }
  }).then(function (table) {
    res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
  })
  //res.status(200).json(res.advancedResults);
});

// @desc      Get single Notification
// @route     GET /api/v1/Notifications/:id
// @access    Private/Admin
exports.getNotification = asyncHandler(async (req, res, next) => {
  const row = await Notification.findById(req.params.id);

  res.status(200).json({
    success: true,
    data: row
  });
});

// @desc      Create Notification
// @route     POST /api/v1/Notifications
// @access    Private/Admin
exports.createNotification = asyncHandler(async (req, res, next) => {
  let notification = {
    url: req.body.url,
    title: req.body.title,
    message: req.body.message,
    sendTo: req.body.sendTo,
    status: 'active',

  }
  if (req.files) {
    let dataSave = {
      // createdBy: req.user.id,
      data: req.files.file.data,
      contentType: req.files.file.mimetype,
      size: req.files.file.size,
      sendTo: req.body.sendTo,
    }
    const newfile = await File.create(dataSave);
    notification['imageId'] = newfile._id;
  }

  const row = await Notification.create(notification);

  res.status(201).json({
    success: true,
    data: row
  });
});

// @desc      Update Notification
// @route     PUT /api/v1/auth/Notifications/:id
// @access    Private/Admin
exports.updateNotification = asyncHandler(async (req, res, next) => {

  let row = await Notification.findById(req.params.id);

  if (!row) {
    return next(
      new ErrorResponse(`Notification  not found`)
    );
  }
  let fieldsToUpdate = {
    url: req.body.url,
    title: req.body.title,
    message: req.body.message,
    status: req.body.status,
    sendTo: req.body.sendTo,
  };
  if (req.files) {
    let dataSave = {
      // createdBy: req.user.id,
      data: req.files.file.data,
      contentType: req.files.file.mimetype,
      size: req.files.file.size,
    }
    if (row.imageId) {
      await File.findByIdAndUpdate(row.imageId, dataSave, {
        new: true,
        runValidators: true
      });
    } else {
      const row = await File.create(dataSave);
      fieldsToUpdate['imageId'] = row._id
    }
  }

  row = await Notification.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });
  //Notification.isNew = false;
  // await Notification.save();
  res.status(200).json({
    success: true,
    data: row
  });
});

// @desc      Delete Notification
// @route     DELETE /api/v1/auth/Notifications/:id
// @access    Private/Admin
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const row = await Notification.findById(req.params.id);
  await Notification.findByIdAndDelete(req.params.id);
  if (req.params.id) {
    await PlayerNotifcation.deleteMany({ 'notificationId': req.params.id });
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});


exports.getPlayerList = asyncHandler(async (req, res, next) => {
  const row = await Notification.findById(req.params.id);
  await Notification.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});
exports.addPlayerList = asyncHandler(async (req, res, next) => {
  // req.io.emit("notification_channel", { content: req.body.content });

  const row = await Notification.findById(req.params.nid);
  var message = {
    notification: {
      title: row.title,
      body: row.message
    },
    // topic: "/topics/all",
    // token: ''
  };
  if (!row) {
    return next(
      new ErrorResponse(`Notification  not found`)
    );
  }

  if (row.sendTo === 'player') {
    let updated = { read: false }
    await PlayerNotifcation.findOneAndUpdate({ playerId: req.params.id, notificationId: req.params.nid }, updated, {
      new: false, upsert: true,
      runValidators: true
    });
    //console.log('sending message');
    // let to_player = await Player.findById(req.params.id).select('+firebaseToken');
    // message['token'] = to_player.firebaseToken;
    // if (to_player.imageId) {
    //   message['image'] = process.env.API_URI + '/files/' + Notification.imageId;
    // }


    // await admin.messaging().send(message)
    //   .then((response) => {
    //     // Response is a message ID string.
    //     console.log('Successfully sent message:', response);
    //     Notification.findOneAndUpdate({ _id: row._id }, { 'status': 'active' }, {
    //       new: false, upsert: true,
    //       runValidators: true
    //     });
    //   })
    //   .catch((error) => {
    //     console.log('Error sending message:', error);
    //   });
    //req.io.to('notification_channel').emit('res', { ev: 'notification_player', data: { "playerId": req.params.id } });

  }
  // else if (row.sendTo === 'all') {
  //   message['topic'] = "/topics/all";
  //   admin.messaging().send(message)
  //     .then((response) => {
  //       // Response is a message ID string.
  //       console.log('Successfully sent message:', response);
  //     })
  //     .catch((error) => {
  //       console.log('Error sending message:', error);
  //     });

  // }

  res.status(200).json({
    success: true,
    data: {}
  });
});
exports.removePlayerList = asyncHandler(async (req, res, next) => {

  await PlayerNotifcation.findOneAndDelete({ playerId: req.params.id, notificationId: req.params.nid });

  res.status(200).json({
    success: true,
    data: {}
  });
});

exports.notifiyAll = asyncHandler(async (req, res, next) => {

  const row = await Notification.findById(req.params.id);

  const check = await PlayerNotifcation.findOne({ 'notificationId': req.params.id });
  var message = {
    notification: {
      title: row.title,
      body: row.message
    },
    // topic: "/topics/all",
    // token: ''
  };
  if (!row) {
    return next(
      new ErrorResponse(`Notification  not found`)
    );
  }

  if (row.sendTo === 'all') {
    // let updated = { read: false }
    // let users = await Player.find({ status: 'active' }, { _id: 1 }).lean();
    // let data = [];
    // for (user of users) {
    //   data.push({ 'notificationId': req.params.id, 'playerId': user._id });
    // }
    // if (!check) {
    //   await PlayerNotifcation.insertMany(data);
    // }

    //console.log('sending message');
    // let to_player = await Player.findById(req.params.id).select('+firebaseToken');
    //  message['token'] = to_player.firebaseToken;

    message['topic'] = "/topics/all";
    // admin.messaging().send(message)
    //   .then((response) => {
    //     // Response is a message ID string.
    //     console.log('Successfully sent message:', response);
    //     Notification.findOneAndUpdate({ _id: req.params.id }, { 'status': 'active' }, {
    //       new: false, upsert: true,
    //       runValidators: true
    //     });
    //   })
    //   .catch((error) => {
    //     console.log('Error sending message:', error);
    //   });

    //req.io.to('notification_channel').emit('res', { ev: 'notification_all', data: {} });


  }

  res.status(200).json({
    success: true,
    data: {}
  });
});