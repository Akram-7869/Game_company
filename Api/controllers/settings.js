const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Setting = require('../models/Setting');

// @desc      Get all Settings
// @route     GET /api/v1/auth/Settings
// @access    Private/Admin
exports.getSettings = asyncHandler(async (req, res, next) => {
  ;
  Setting.dataTables({
    limit: req.body.length,
    skip: req.body.start,
    select:{'type':1,'name':1},
    search: {
      value: req.body.search?  req.body.search.value:'',
      fields: ['type']
    },
    sort: {
      type: 1
    }
  }).then(function (table) {
    res.json({data: table.data, recordsTotal:table.total,recordsFiltered:table.total, draw:req.body.draw}); // table.total, table.data
  })
  //res.status(200).json(res.advancedResults);
});

// @desc      Get single Setting
// @route     GET /api/v1/auth/Settings/:id
// @access    Private/Admin
exports.getSetting = asyncHandler(async (req, res, next) => {
  const setting = await Setting.findOne({name:req.params.id});

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

  let {one, many}=req.body;
    console.log('server-post',one);
  let setting = await Setting.findOne({name:req.params.id});
  if (!setting) {
    return next(
      new ErrorResponse(`Setting  not found`, 404)
    );
  }
  let fieldsToUpdate= {one, many}
   
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

