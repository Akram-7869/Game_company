const asyncHandler = require('../middleware/async');
const { callApi, api_url, redirect } = require('../helper/common');
var apiUrl = api_url + '/coupon/';

exports.listCoupon = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Coupon' };
    res.render('Coupon/list');
});
exports.getCoupons = asyncHandler(async (req, res, next) => {
    callApi(req).post(apiUrl, { ...req.body })
        .then(r => {
            // Assign value in session
            res.status(200).json(r.data);
        })
        .catch(error => {
            //   req.flash('error', 'Incorrect email or password!');
        })

});


exports.getCoupon = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Coupon', apiUrl, api_url, indexUrl: process.env.ADMIN_URL + '/admin/coupon' };

    callApi(req).get(apiUrl + req.params.id)
        .then(r => {
            res.render('Coupon/edit', { row: r.data.data });
        })
        .catch(error => {

        })
});

exports.updateCoupon = asyncHandler(async (req, res, next) => {

    callApi(req).post(apiUrl + req.params.id, req.body)
        .then(r => {
            // Assign value in session
            res.locals = { title: 'Coupon-edit' };
            req.flash('error', 'Data save');
            res.redirect(process.env.ADMIN_URL + '/admin/Coupon');
        })
        .catch(error => {
            req.flash('error', 'Data not updated');
        })
});

exports.deleteCoupon = asyncHandler(async (req, res, next) => {
    callApi(req).delete(apiUrl + req.params.id, req.body)
        .then(r => {
            // Assign value in session
            res.locals = { title: 'Coupon' };
            req.flash('success', 'Deleted');
        }).catch(error => { req.flash('error', 'Data not updated'); })

    res.status(200).json({
        success: true,
        data: {}
    });
});


exports.addCoupon = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Coupon', apiUrl, indexUrl: process.env.ADMIN_URL + '/admin/coupon' };

    res.render('Coupon/add', { row: {} });
});


exports.createCoupons = asyncHandler(async (req, res, next) => {
    //console.log(req.session);
    res.locals = { title: 'Coupon-add' };
    callApi(req).post(apiUrl + 'add', req.body)
        .then(r => {
            // Assign value in session
            req.flash('message', 'Data save');
            res.redirect(process.env.ADMIN_URL + '/admin/Coupon');

        })
        .catch(error => {


            req.flash('error', 'Data not updated');

        })

});

exports.showCoupon = asyncHandler(async (req, res, next) => {
    callApi(req).get(apiUrl + req.params.id)
        .then(r => {
            // Assign value in session

            res.locals = { title: 'Coupon-edit' };
            res.render('Coupon/view', { row: r.data.data });


        })
        .catch(error => {


            //   req.flash('error', 'Incorrect email or password!');

        })
});
