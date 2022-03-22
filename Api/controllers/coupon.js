const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Coupon = require('../models/Coupon');
const File = require('../models/File');

// @desc      Get all Coupons
// @route     GET /api/v1/auth/Coupons
// @access    Private/Admin
exports.getCoupons = asyncHandler(async (req, res, next) => {

    Coupon.dataTables({
        limit: req.body.length,
        skip: req.body.start,
        // select: { 'CouponControle': 1, 'appLink': 1, 'createdAt': 1 },
        search: {
            value: req.body.search ? req.body.search.value : '',
            fields: ['_id']

        },
        sort: {
            _id: -1
        }
    }).then(function (table) {
        res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
    })
    //res.status(200).json(res.advancedResults);
});

// @desc      Get single Coupon
// @route     GET /api/v1/auth/Coupons/:id
// @access    Private/Admin
exports.getCoupon = asyncHandler(async (req, res, next) => {
    const row = await Coupon.findById(req.params.id);

    res.status(200).json({
        success: true,
        data: row
    });
});

// @desc      Create Coupon
// @route     POST /api/v1/auth/Coupons
// @access    Private/Admin
exports.createCoupon = asyncHandler(async (req, res, next) => {

    if (req.files) {
        let dataSave = {
            // createdBy: req.user.id,
            data: req.files.file.data,
            contentType: req.files.file.mimetype,
            size: req.files.file.size,
        }
        const newfile = await File.create(dataSave);
        req.body['couponImage'] = newfile._id;

    }

    const row = await Coupon.create(req.body);

    res.status(201).json({
        success: true,
        data: row
    });
});

// @desc      Update Coupon
// @route     PUT /api/v1/auth/Coupons/:id
// @access    Private/Admin
exports.updateCoupon = asyncHandler(async (req, res, next) => {

    let row = await Coupon.findById(req.params.id);
    if (!row) {
        return next(
            new ErrorResponse(`Coupon  not found`)
        );
    }
    if (req.files) {
        let dataSave = {
            // createdBy: req.user.id,
            data: req.files.file.data,
            contentType: req.files.file.mimetype,
            size: req.files.file.size,
        }
        await File.findByIdAndUpdate(row.couponImage, dataSave, {
            new: true,
            runValidators: true
        });
    }

    row = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    //Coupon.isNew = false;
    // await Coupon.save();
    res.status(200).json({
        success: true,
        data: row
    });
});

// @desc      Delete Coupon
// @route     DELETE /api/v1/auth/Coupons/:id
// @access    Private/Admin
exports.deleteCoupon = asyncHandler(async (req, res, next) => {
    const row = await Coupon.findById(req.params.id);
    await Coupon.findByIdAndDelete(req.params.id);
    await File.findByIdAndDelete(row.couponImage);

    res.status(200).json({
        success: true,
        data: {}
    });
});

