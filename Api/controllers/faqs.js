const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Faq = require('../models/Faq');
var path = require('path');
const { uploadFile, deletDiskFile } = require('../utils/utils');
const { options } = require('../routes');


// @desc      Get all Faqs
// @route     GET /api/v1/auth/Faqs
// @access    Private/Admin
exports.getFaqs = asyncHandler(async (req, res, next) => {

  Faq.dataTables({
    limit: req.body.length,
    skip: req.body.start,
    //   select:{'postUrl':1, 'createdAt':1},
    search: {
      value: req.body.search ? req.body.search.value : '',
      fields: ['status']
    },
    sort: {
      _id: -1
    }
  }).then(function (table) {
    res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
  })
  //res.status(200).json(res.advancedResults);
});
// @desc      Get all Faqs
// @route     GET /api/v1/auth/Faqs
// @access    Private/Admin
exports.getFaqList = asyncHandler(async (req, res, next) => {

  const posts = await Faq.find({status:'active'}); 
  res.status(200).json({
    success: true,
    data: posts
  });
});
exports.getFaqLikes = asyncHandler(async (req, res, next) => {

  const posts = await Faq.findOne({status:'active'}).populate('likes', 'firstName').populate('player', 'firstName');
 
  res.status(200).json({
    success: true,
    data: posts
  });
});
 
// @desc      Get single Faq
// @route     GET /api/v1/auth/Faqs/:id
// @access    Private/Admin
exports.getFaq = asyncHandler(async (req, res, next) => {
  const row = await Faq.findById(req.params.id);

  res.status(200).json({
    success: true,
    data: row
  });
});

// @desc      Create Faq
// @route     POST /api/v1/auth/Faqs
// @access    Private/Admin
exports.createFaq = asyncHandler(async (req, res, next) => {
  if (!req.files) {}
  let filename;
  if (req.files) {
    filename = '/img/post/' + req.files.file.name;
    uploadFile(req, filename, res);
  }

  let data = {
    options: req.body.options,
    status: req.body.status,
    topic: req.body.topic,
    gamename: req.body.gamename,
    explaination:req.body.explaination
  }
  const row = await Faq.create(data);

  res.status(201).json({
    success: true,
    data: row
  });
});

// @desc      Update Faq
// @route     PUT /api/v1/auth/Faqs/:id
// @access    Private/Admin
exports.updateFaq = asyncHandler(async (req, res, next) => {
  //console.log('sdsdsssdsdsdsd',req.body,req.files, req.query);
  let row = await Faq.findById(req.params.id);

  if (!row) {
    return next(
      new ErrorResponse(`Faq  not found`)
    );
  }


  let filename;
  let fieldsToUpdate =   {
    options: req.body.options,
    status: req.body.status,
    topic: req.body.topic,
    gamename: req.body.gamename,
    explaination:req.body.explaination
  }
  if (req.files) {
    filename = '/img/post/' + req.files.file.name;
    let filePath = path.resolve(__dirname, '../../assets/' + row.imageId);
    deletDiskFile(filePath);
    uploadFile(req, filename, res);
    fieldsToUpdate['imageId'] = filename;
  }

  row = await Faq.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: row
  });
});


// @desc      Delete Faq
// @route     DELETE /api/v1/auth/Faqs/:id
// @access    Private/Admin
exports.deleteFaq = asyncHandler(async (req, res, next) => {
  const row = await Faq.findById(req.params.id);
  await Faq.findByIdAndDelete(req.params.id);
  let filePath = path.resolve(__dirname, '../../assets/' + row.imageId);
  deletDiskFile(filePath);

  res.status(200).json({
    success: true,
    data: {}
  });
});
