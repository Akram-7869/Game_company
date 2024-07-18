const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
 const File = require('../models/File');
const Bannertext = require('../models/Bannertext');
var path = require('path');
const fs = require('fs');
const { uploadFile, deletDiskFile } = require('../utils/utils');


// @desc      Get all Bannertexts
// @route     GET /api/v1/auth/Bannertexts
// @access    Private/Admin
exports.getBannertexts = asyncHandler(async (req, res, next) => {
    
    Bannertext.dataTables({
        limit: req.body.length,
        skip: req.body.start,
        //   select:{'BannertextUrl':1, 'createdAt':1},
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

exports.getBannertextList = asyncHandler(async (req, res, next) => {
    
  let row=   Bannertext.find({status:'active'});
    res.status(200).json({
        success: true,
        data: row
    });
});
// @desc      Get single Bannertext
// @route     GET /api/v1/auth/Bannertexts/:id
// @access    Private/Admin
exports.getBannertext = asyncHandler(async (req, res, next) => {
    const row = await Bannertext.findById(req.params.id);

    res.status(200).json({
        success: true,
        data: row
    });
});

// @desc      Create Bannertext
// @route     POST /api/v1/auth/Bannertexts
// @access    Private/Admin
exports.createBannertext = asyncHandler(async (req, res, next) => {
    console.log(req.body); 
    // if (!req.files) {

    // }
    // let filename;
    // if (req.files) {
    //     filename = '/img/banner/' + req.files.file.name;
    //     uploadFile(req, filename, res);
    // }



    let brow = {
        location: req.body.location,
        status: 'active',
        title: req.body.title,
    }

    const row = await Bannertext.create(brow);

    res.status(201).json({
        success: true,
        data: row
    });
});

// @desc      Update Bannertext
// @route     PUT /api/v1/auth/Bannertexts/:id
// @access    Private/Admin
exports.updateBannertext = asyncHandler(async (req, res, next) => {
    //console.log('sdsdsssdsdsdsd',req.body,req.files, req.query);
    let row = await Bannertext.findById(req.params.id);

    if (!row) {
        return next(
            new ErrorResponse(`Bannertext  not found`)
        );
    }

    // let filename;
    let fieldsToUpdate = { title: req.body.title, location: req.body.location, status: req.body.status };
    // if (req.files) {
    //     filename = '/img/poll/' + req.files.file.name;
    //     let filePath = path.resolve(__dirname, '../../assets/' + row.imageId);
    //     deletDiskFile(filePath);
    //     uploadFile(req, filename, res);
    //     fieldsToUpdate['imageId'] = filename;
    // }
    row = await Bannertext.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });

    //Bannertext.isNew = false;
    // await Bannertext.save();
    res.status(200).json({
        success: true,
        data: row
    });
});

// @desc      Delete Bannertext
// @route     DELETE /api/v1/auth/Bannertexts/:id
// @access    Private/Admin
exports.deleteBannertext = asyncHandler(async (req, res, next) => {
    const row = await Bannertext.findById(req.params.id);
    await Bannertext.findByIdAndDelete(req.params.id);
    //await File.findByIdAndDelete(row.imageId);
    // let filePath = path.resolve(__dirname, '../../assets/' + row.imageId);
    // deletDiskFile(filePath);
    await PlayerBannertext.deleteMany({ BannertextId: req.params.id });

    res.status(200).json({
        success: true,
        data: {}
    });
});

 


 