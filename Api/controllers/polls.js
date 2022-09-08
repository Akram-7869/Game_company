const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Poll = require('../models/Poll');
const File = require('../models/File');
const PlayerPoll = require('../models/PlayerPoll');
var path = require('path');
const fs = require('fs');
const { uploadFile, deletDiskFile } = require('../utils/utils');


// @desc      Get all Polls
// @route     GET /api/v1/auth/Polls
// @access    Private/Admin
exports.getPolls = asyncHandler(async (req, res, next) => {
    ;
    Poll.dataTables({
        limit: req.body.length,
        skip: req.body.start,
        //   select:{'PollUrl':1, 'createdAt':1},
        search: {
            value: req.body.search ? req.body.search.value : '',
            fields: ['status', 'location']
        },
        sort: {
            _id: -1
        }
    }).then(function (table) {
        res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
    })
    //res.status(200).json(res.advancedResults);
});

// @desc      Get single Poll
// @route     GET /api/v1/auth/Polls/:id
// @access    Private/Admin
exports.getPoll = asyncHandler(async (req, res, next) => {
    const row = await Poll.findById(req.params.id);

    res.status(200).json({
        success: true,
        data: row
    });
});

// @desc      Create Poll
// @route     POST /api/v1/auth/Polls
// @access    Private/Admin
exports.createPoll = asyncHandler(async (req, res, next) => {
    console.log(req.body);
    if (!req.files) {

    }
    let filename;
    if (req.files) {
        filename = '/img/banner/' + req.files.file.name;
        uploadFile(req, filename, res);
    }



    let pollRow = {
        location: req.body.location,
        status: 'active',
        imageId: filename,
        url: req.body.url,
    }

    const row = await Poll.create(pollRow);

    res.status(201).json({
        success: true,
        data: row
    });
});

// @desc      Update Poll
// @route     PUT /api/v1/auth/Polls/:id
// @access    Private/Admin
exports.updatePoll = asyncHandler(async (req, res, next) => {
    //console.log('sdsdsssdsdsdsd',req.body,req.files, req.query);
    let row = await Poll.findById(req.params.id);

    if (!row) {
        return next(
            new ErrorResponse(`Poll  not found`)
        );
    }

    let filename;
    let fieldsToUpdate = { url: req.body.url, location: req.body.location, status: req.body.status };
    if (req.files) {
        filename = '/img/poll/' + req.files.file.name;
        let filePath = path.resolve(__dirname, '../../assets/' + row.imageId);
        deletDiskFile(filePath);
        uploadFile(req, filename, res);
        fieldsToUpdate['imageId'] = filename;
    }
    row = await Poll.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });

    //Poll.isNew = false;
    // await Poll.save();
    res.status(200).json({
        success: true,
        data: row
    });
});

// @desc      Delete Poll
// @route     DELETE /api/v1/auth/Polls/:id
// @access    Private/Admin
exports.deletePoll = asyncHandler(async (req, res, next) => {
    const row = await Poll.findById(req.params.id);
    await Poll.findByIdAndDelete(req.params.id);
    //await File.findByIdAndDelete(row.imageId);
    let filePath = path.resolve(__dirname, '../../assets/' + row.imageId);
    deletDiskFile(filePath);
    await PlayerPoll.deleteMany({ PollId: req.params.id });

    res.status(200).json({
        success: true,
        data: {}
    });
});

exports.uploadFile = asyncHandler(async (req, res, next) => {
    console.log(req.body, req.files);
    // if (!req.file) {
    //     return next(new ErrorResponse(`Please upload a file`));
    // }

    //  const file = req.files.file;
    //  const split = file.split(',');
    //  const base64string = split[1];
    //  const buffer = new Buffer.from(base64string, 'base64');
    //  let n = base64string.length;
    //  let y = 2;
    //  let size = (n * (3/4)) - y
    //  console.log('size',size);
    //  // console.log(req.files, req.body);
    //  // Make sure the image is a photo
    //  if (!split[0].includes('image')) {
    //      return next(new ErrorResponse(`Please upload an image file`));
    //  }
    // // ${process.env.MAX_FILE_UPLOAD}
    //  // Check filesize
    //  if (size > process.env.MAX_FILE_UPLOAD) {
    //      return next(
    //          new ErrorResponse(
    //              `Please upload an image less than 256k`
    //          )
    //      );
    //  }
    let dataSave = {
        // createdBy: req.user.id,
        data: req.files.file.data,
        contentType: req.files.file.mimetype,
        size: req.files.file.size,
    }
    // console.log(dataSave);
    const newfile = await File.create(dataSave);
    res.status(200).json({
        success: true,
        data: { _id: newfile._id }
    });

});


// @desc      Update Poll
// @route     PUT /api/v1/auth/Polls/:id
// @access    Private/Admin
exports.getFile = asyncHandler(async (req, res, next) => {

    let rec = await File.findById(req.params.id);
    res.contentType('image/png');
    res.send(rec.data);

});