const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Setting = require('../models/Setting');
const File = require('../models/File');



// @desc      Get all Settings
// @route     GET /api/v1/auth/Settings
// @access    Private/Admin
exports.getSettings = asyncHandler(async (req, res, next) => {

  Setting.dataTables({
    limit: req.body.length,
    skip: req.body.start,
    select: { 'type': 1, 'name': 1 },
    find: { type: req.params.type },
    search: {
      value: req.body.search ? req.body.search.value : '',
      fields: ['name']
    },
    sort: {
      type: 1
    }
  }).then(function (table) {
    res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
  })
  //res.status(200).json(res.advancedResults);
});

// @desc      Get single Setting
// @route     GET /api/v1/auth/Settings/:id
// @access    Private/Admin
exports.getSetting = asyncHandler(async (req, res, next) => {
  const setting = await Setting.findOne({ _id: req.params.id });

  res.status(200).json({
    success: true,
    data: setting
  });
});
// @desc      Get single Setting
// @route     GET /api/v1/auth/Settings/:id
// @access    Private/Admin
exports.getSettingByName = asyncHandler(async (req, res, next) => {
  const setting = await Setting.findOne({
    type: req.params.type,
    name: req.params.name
  });

  res.status(200).json({
    success: true,
    data: setting
  });
});
// @desc      Get single Setting
// @route     GET /api/v1/auth/Settings/:id
// @access    Private/Admin
exports.getSitedata = asyncHandler(async (req, res, next) => {
  const setting = await Setting.findOne({
    type: 'SITE'
  });

  res.status(200).json({
    success: true,
    data: setting
  });
});

// @desc      Create Setting
// @route     POST /api/v1/auth/Settings
// @access    Private/Admin
exports.createSetting = asyncHandler(async (req, res, next) => {
  const setting = await Setting.create(req.body);

  res.status(201).json({
    success: true,
    data: Setting
  });
});

// @desc      Update Setting
// @route     PUT /api/v1/auth/Settings/:id
// @access    Private/Admin
exports.updateSetting = asyncHandler(async (req, res, next) => {

  let { one, many } = req.body;
  console.log('server-post', one);
  let setting = await Setting.findOne({ _id: req.params.id });
  if (!setting) {
    return next(
      new ErrorResponse(`Setting  not found`)
    );
  }
  let fieldsToUpdate = { one, many }

  setting = await Setting.findByIdAndUpdate(setting.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  //Setting.isNew = false;
  // await Setting.save();
  res.status(200).json({
    success: true,
    data: setting
  });
});

// @desc      Update Setting
// @route     PUT /api/v1/auth/Settings/:id
// @access    Private/Admin
exports.setCommission = asyncHandler(async (req, res, next) => {
  let setting = await Setting.findOne({ _id: req.params.id });
  if (!setting) {
    return next(
      new ErrorResponse(`Setting  not found`)
    );
  }
  let fieldsToUpdate = {
    'commission': req.body.commission
  }

  setting = await Setting.findByIdAndUpdate(setting.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: setting
  });
});

// @desc      Delete Setting
// @route     DELETE /api/v1/auth/Settings/:id
// @access    Private/Admin
exports.deleteSetting = asyncHandler(async (req, res, next) => {
  const setting = await Setting.findById(req.params.id);
  await Setting.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});


// @desc      Update Banner
// @route     PUT /api/v1/auth/Banners/:id
// @access    Private/Admin
exports.uploadeImage = asyncHandler(async (req, res, next) => {
  //console.log('sdsdsssdsdsdsd',req.body,req.files, req.query);
  let row = await Setting.findById(req.params.id);

  if (!row) {
    return next(
      new ErrorResponse(`Setting  not found`)
    );
  }
  if (!req.files) {
    return next(
      new ErrorResponse(`File  not found`)
    );
  }
  let newfile = {}
  let dataSave = {
    // createdBy: req.user.id,
    data: req.files.file.data,
    contentType: req.files.file.mimetype,
    size: req.files.file.size,
  }
  if (!row.siteLogo) {
    newfile = await File.create(dataSave);
  } else {
    newfile = await File.findByIdAndUpdate(row.siteLogo, dataSave, {
      new: true,
      runValidators: true
    });
  }


  if (!newfile) {
    return next(
      new ErrorResponse(`Setting  not found`)
    );
  }

  let fieldsToUpdate = { siteLogo: newfile._id };
  row = await Setting.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  //Banner.isNew = false;
  // await Banner.save();
  res.status(200).json({
    success: true,
    data: row
  });
});

// @desc      Update Banner
// @route     PUT /api/v1/auth/Banners/:id
// @access    Private/Admin
exports.getFile = asyncHandler(async (req, res, next) => {

  let rec = await File.findById(req.params.id);
  res.contentType('image/png');
  res.send(rec.data);

});
