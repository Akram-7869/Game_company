const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Banner = require('../models/Banner');

// @desc      Get all Banners
// @route     GET /api/v1/auth/Banners
// @access    Private/Admin
exports.getBanners = asyncHandler(async (req, res, next) => {
  ;
  Banner.dataTables({
    limit: req.body.length,
    skip: req.body.start,
   // select:{'amount':1,'rowType':1, 'note':1, 'createdAt':1},
    search: {
      value: req.body.search?  req.body.search.value:'',
      fields: ['playerId']
    },
    sort: {
      _id: 1
    }
  }).then(function (table) {
    res.json({data: table.data, recordsTotal:table.total,recordsFiltered:table.total, draw:req.body.draw}); // table.total, table.data
  })
  //res.status(200).json(res.advancedResults);
});

// @desc      Get single Banner
// @route     GET /api/v1/auth/Banners/:id
// @access    Private/Admin
exports.getBanner = asyncHandler(async (req, res, next) => {
  const row = await Banner.findById(req.params.id);

  res.status(200).json({
    success: true,
    data: row
  });
});

// @desc      Create Banner
// @route     POST /api/v1/auth/Banners
// @access    Private/Admin
exports.createBanner = asyncHandler(async (req, res, next) => {

  
  const row = await Banner.create(req.body);

  res.status(201).json({
    success: true,
    data: row
  });
});

// @desc      Update Banner
// @route     PUT /api/v1/auth/Banners/:id
// @access    Private/Admin
exports.updateBanner = asyncHandler(async (req, res, next) => {
  let {one, many}=req.body
  let row = await Banner.findById(req.params.id);
  if (!row) {
    return next(
      new ErrorResponse(`Banner  not found`, 404)
    );
  }
  let fieldsToUpdate= {one, many}
   
  row = await Banner.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
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

// @desc      Delete Banner
// @route     DELETE /api/v1/auth/Banners/:id
// @access    Private/Admin
exports.deleteBanner = asyncHandler(async (req, res, next) => {
  const row = await Banner.findById(req.params.id);
 // await Banner.findByIdAndDelete(req.params.id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

exports.uploadFile = asyncHandler(async (req, res, next) => {
console.log(req.body, req.files);
    // if (!req.file) {
    //     return next(new ErrorResponse(`Please upload a file`, 400));
    // }

    const file = req.files.file;
    const split = file.split(',');
    const base64string = split[1];
    const buffer = new Buffer.from(base64string, 'base64');
    let n = base64string.length;
    let y = 2;
    let size = (n * (3/4)) - y
    console.log('size',size);
    // console.log(req.files, req.body);
    // Make sure the image is a photo
    if (!split[0].includes('image')) {
        return next(new ErrorResponse(`Please upload an image file`, 400));
    }
   // ${process.env.MAX_FILE_UPLOAD}
    // Check filesize
    if (size > process.env.MAX_FILE_UPLOAD) {
        return next(
            new ErrorResponse(
                `Please upload an image less than 256k`,
                400
            )
        );
    }
    let dataSave = {
        createdBy: req.user.id,
        data: buffer,
     // contentType: req.files.file.mimetype,
      //  size: req.files.file.size,
    }
    
    const newfile = await Files.create(dataSave);
    res.status(200).json({
        success: true,
        data: { _id: newfile._id }
    });

});