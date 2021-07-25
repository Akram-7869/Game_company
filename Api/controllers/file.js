const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const {Files} = require('../models/Files');

// @desc      Get all users
// @route     GET /api/v1/auth/users
// @access    Private/Admin
exports.getFiles = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
});

// @desc      Get single user
// @route     GET /api/v1/auth/users/:id
// @access    Private/Admin
exports.getFile = asyncHandler(async (req, res, next) => {
    console.log('req.params.id',req.params.id);
    const user = await Files.findById(req.params.id);
    // if (err) return next(err);
  //  res.contentType(user.contentType);
    res.contentType('image/png');
    res.send(user.data);
   // res.json(user.data.toString('base64'));
    // res.status(200).json({
    //     success: true,
    //     data: user
    // });
});

// @desc      Create user
// @route     POST /api/v1/auth/users
// @access    Private/Admin
exports.createFile = asyncHandler(async (req, res, next) => {
    const user = await Files.create(req.body);

    res.status(201).json({
        success: true,
        data: user
    });
});

// @desc      Update user
// @route     PUT /api/v1/auth/users/:id
// @access    Private/Admin
exports.updateFile = asyncHandler(async (req, res, next) => {
    const user = await Files.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc      Delete user
// @route     DELETE /api/v1/auth/users/:id
// @access    Private/Admin
exports.deleteFile = asyncHandler(async (req, res, next) => {
    await Files.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        data: {}
    });
});

exports.uploadFile = asyncHandler(async (req, res, next) => {
console.log(req.body);
    // if (!req.file) {
    //     return next(new ErrorResponse(`Please upload a file`, 400));
    // }

    const file = req.body.file;
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