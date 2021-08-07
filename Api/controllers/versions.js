const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Version = require('../models/Version');

// @desc      Get all Versions
// @route     GET /api/v1/auth/Versions
// @access    Private/Admin
exports.getVersions = asyncHandler(async (req, res, next) => {
  ;
  Version.dataTables({
    limit: req.body.length,
    skip: req.body.start,
    select:{'versionControle':1,'appLink':1, 'createdAt':1},
    search: {
      value: req.body.search?  req.body.search.value:'',
      fields: ['_id']
      
    },
    sort: {
      _id: 1
    }
  }).then(function (table) {
    res.json({data: table.data, recordsTotal:table.total,recordsFiltered:table.total, draw:req.body.draw}); // table.total, table.data
  })
  //res.status(200).json(res.advancedResults);
});

// @desc      Get single Version
// @route     GET /api/v1/auth/Versions/:id
// @access    Private/Admin
exports.getVersion = asyncHandler(async (req, res, next) => {
  const row = await Version.findById(req.params.id);

  res.status(200).json({
    success: true,
    data: row
  });
});

// @desc      Create Version
// @route     POST /api/v1/auth/Versions
// @access    Private/Admin
exports.createVersion = asyncHandler(async (req, res, next) => {
  const row = await Version.create(req.body);

  res.status(201).json({
    success: true,
    data: row
  });
});

// @desc      Update Version
// @route     PUT /api/v1/auth/Versions/:id
// @access    Private/Admin
exports.updateVersion = asyncHandler(async (req, res, next) => {
  let {appLink, versionControle}=req.body
  let row = await Version.findById(req.params.id);
  if (!row) {
    return next(
      new ErrorResponse(`Version  not found`)
    );
  }
  let fieldsToUpdate= {appLink, versionControle}
   
  row = await Version.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

   //Version.isNew = false;
 // await Version.save();
  res.status(200).json({
    success: true,
    data: row
  });
});

// @desc      Delete Version
// @route     DELETE /api/v1/auth/Versions/:id
// @access    Private/Admin
exports.deleteVersion = asyncHandler(async (req, res, next) => {
  const row = await Version.findById(req.params.id);
 await Version.findByIdAndDelete(req.params.id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

