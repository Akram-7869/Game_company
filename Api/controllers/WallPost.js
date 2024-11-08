const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

const File = require('../models/File');
// const PlayerPoll = require('../models/PlayerPoll');
var path = require('path');
const fs = require('fs');
const { uploadFile, deletDiskFile } = require('../utils/utils');
const WallPost = require('../models/WallPost');


// @desc      Get all WallPost
// @route     GET /api/v1/auth/WallPost
// @access    Private/Admin
exports.getWallpost = asyncHandler(async (req, res, next) => {
    
    WallPost.dataTables({
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

// @desc      Get single WallPost
// @route     GET /api/v1/auth/WallPost/:id
// @access    Private/Admin
exports.getWallpost = asyncHandler(async (req, res, next) => {
    const row = await WallPost.findById(req.params.id);

    res.status(200).json({
        success: true,
        data: row
    });
});

// @desc      Create WallPost
// @route     POST /api/v1/auth/WallPost
// @access    Private/Admin
exports.createWallpost = asyncHandler(async (req, res, next) => {
    console.log(req.body);
    if (!req.files) {

    }
    let filename;
    if (req.files) {
        filename = '/img/banner/' + req.files.file.name;
        uploadFile(req, filename, res);
    }



    let wallPostRow = {
        location: req.body.location,
        status: 'active',
        imageId: filename,
        url: req.body.url,
    }

    const row = await WallPost.create(wallPostRow);

    res.status(201).json({
        success: true,
        data: row
    });
});

// @desc      Update WallPost
// @route     PUT /api/v1/auth/WallPost/:id
// @access    Private/Admin
exports.updateWallpost = asyncHandler(async (req, res, next) => {
    //console.log('sdsdsssdsdsdsd',req.body,req.files, req.query);
    let row = await WallPost.findById(req.params.id);

    if (!row) {
        return next(
            new ErrorResponse(`WallPost  not found`)
        );
    }

    let filename;
    let fieldsToUpdate = { url: req.body.url, location: req.body.location, status: req.body.status };
    if (req.files) {
        filename = '/img/wallPost/' + req.files.file.name;
        let filePath = path.resolve(__dirname, '../../assets/' + row.imageId);
        deletDiskFile(filePath);
        uploadFile(req, filename, res);
        fieldsToUpdate['imageId'] = filename;
    }
    row = await WallPost.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });

    //WallPost.isNew = false;
    // await WallPost.save();
    res.status(200).json({
        success: true,
        data: row
    });
});

// @desc      Delete WallPost
// @route     DELETE /api/v1/auth/WallPost/:id
// @access    Private/Admin
exports.deleteWallpost = asyncHandler(async (req, res, next) => {
    const row = await WallPost.findById(req.params.id);
    await WallPost.findByIdAndDelete(req.params.id);
    //await File.findByIdAndDelete(row.imageId);
    let filePath = path.resolve(__dirname, '../../assets/' + row.imageId);
    deletDiskFile(filePath);
    // await PlayerPoll.deleteMany({ PollId: req.params.id });

    res.status(200).json({
        success: true,
        data: {}
    });
});

// exports.uploadFile = asyncHandler(async (req, res, next) => {
//     console.log(req.body, req.files);
    
//     let dataSave = {
//         // createdBy: req.user.id,
//         data: req.files.file.data,
//         contentType: req.files.file.mimetype,
//         size: req.files.file.size,
//     }
//     // console.log(dataSave);
//     const newfile = await File.create(dataSave);
//     res.status(200).json({
//         success: true,
//         data: { _id: newfile._id }
//     });

// });

exports.uploadFile = asyncHandler(async (req, res, next) => {
    console.log(req.body, req.files);

    // Check if a file already exists and delete it if found
    let existingFile = await File.findOne({});
    if (existingFile) {
        await File.deleteOne({ _id: existingFile._id });
        console.log(`Old file with ID ${existingFile._id} deleted`);
    }

    // Prepare the new file data
    let dataSave = {
        data: req.files.file.data,
        contentType: req.files.file.mimetype,
        size: req.files.file.size,
    };

    // Create and save the new file
    const newFile = await File.create(dataSave);
    res.status(200).json({
        success: true,
        message: "New file uploaded successfully, old file deleted",
        data: { _id: newFile._id }
    });
});



// @desc      Update WallPost
// @route     PUT /api/v1/auth/WallPost/:id
// @access    Private/Admin
exports.getFile = asyncHandler(async (req, res, next) => {

    let rec = await File.findById(req.params.id);
    res.contentType('image/png');
    res.send(rec.data);

});