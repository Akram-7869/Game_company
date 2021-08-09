const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Notification = require('../models/Notification');
const File = require('../models/File');
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


  row = await Notification.findOneAndUpdate({ _id: req.body.id, playerId: req.player._id }, { read: req.body.read }, {
    new: true,
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
      new ErrorResponse(`Notifications  not found`)
    );
  }
  // console.log(req.player._id)

  Notification.dataTables({
    limit: 1000,
    skip: 0,
    select: { 'amount': 1, 'transactionType': 1, 'note': 1, 'createdAt': 1, logType: 1, paymentStatus: '1' },
    search: {
      value: req.player._id,
      fields: ['playerId']
    },
    sort: {
      updatedAt: 1
    }
  }).then(function (table) {
    res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
  })
  //res.status(200).json(res.advancedResults);
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
    status: req.body.status
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

