const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const File = require('../models/File');

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
    //  console.log('req.params.id', req.params.id);
    const user = await File.findById(req.params.id);
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
    const user = await File.create(req.body);

    res.status(201).json({
        success: true,
        data: user
    });
});

// @desc      Update user
// @route     PUT /api/v1/auth/users/:id
// @access    Private/Admin
exports.updateFile = asyncHandler(async (req, res, next) => {
    const user = await File.findByIdAndUpdate(req.params.id, req.body, {
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
    await File.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        data: {}
    });
});

exports.uploadFile = asyncHandler(async (req, res, next) => {
    console.log(req.files);
    if (!req.files) {
        return next(new ErrorResponse(`Please upload a file`));
    }

    let dataSave = {
        // createdBy: req.user.id,
        data: req.files.data,
        contentType: req.files.mimetype,
        size: req.files.size,
    }
    // ${process.env.MAX_FILE_UPLOAD}
    // Check filesize
    if (dataSave.size > process.env.MAX_FILE_UPLOAD) {
        return next(
            new ErrorResponse(
                `Please upload an image less than 256k`
            )
        );
    }

    const newfile = await File.create(dataSave);

    res.status(200).json({
        success: true,
        data: { _id: newfile._id }
    });

});
