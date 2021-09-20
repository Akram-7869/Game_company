const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Notification = require('../models/Notification');
const File = require('../models/File');
const PlayerNotifcation = require('../models/PlayerNotifcation');
const mongoose = require('mongoose');

// @desc      Update Notification
// @route     PUT /api/v1/auth/Notifications/:id
// @access    Private/Admin
exports.readNotification = asyncHandler(async (req, res, next) => {
  if (!req.player) {
    return next(
      new ErrorResponse(`Notifications  not found`)
    );
  }

  // let row = await Notification.findById(req.params.id);
  // if (!row) {
  //   return next(
  //     new ErrorResponse(`Notification  not found`)
  //   );
  // }


  row = await PlayerNotifcation.findOneAndUpdate({ notificationId: req.body.id, playerId: req.player._id }, { read: req.body.read }, {
    new: true, upsert: true,
    runValidators: true
  });

  //Notification.isNew = false;
  // await Notification.save();
  res.status(200).json({
    success: true,
    data: {}
  });
});
// @desc      Get all Notificationss
// @route     GET /api/v1/auth/Notificationss
// @access    Private/Admin
exports.getPlayerNotifications = asyncHandler(async (req, res, next) => {

  if (!req.player) {
    return next(
      new ErrorResponse(`player  not found`)
    );
  }
  // console.log(req.player._id)
  let query = [
    {
      '$lookup': {
        'from': 'playernotications',
        'localField': '_id',
        'foreignField': 'notificationId',
        'as': 'msg_read'
      }
    }, {
      '$match': {
        '$or': [
          {
            'sendTo': 'all'
          }, {
            'msg_read.playerId': req.player._id
          }
        ]
      }
    }, {
      '$unwind': {
        'path': '$msg_read',
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$addFields': {
        'read': {
          '$cond': [
            '$msg_read.read', true, false
          ]
        }
      }
    }, {
      '$project': {
        'msg_read': 0,
        'updatedAt': 0
      }
    }
  ];
  const rows = await Notification.aggregate(query);
  res.status(200).json(rows);
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
      _id: 1
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
    message: req.body.message,
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
  console.log('sdsdsssdsdsdsd', req.body, req.files, req.query);
  let row = await Notification.findById(req.params.id);

  if (!row) {
    return next(
      new ErrorResponse(`Notification  not found`)
    );
  }
  let fieldsToUpdate = {
    url: req.body.url,
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

  const row = await Notification.findById(req.params.nid);
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
  }



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