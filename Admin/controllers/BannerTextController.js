const asyncHandler = require('../middleware/async');
const { callApi, api_url, redirect } = require('../helper/common');
var apiUrl = api_url + '/bannertext/';

exports.listBannertext = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Bannertext' };
    res.render('Bannertext/list');
});
exports.getBannertexts = asyncHandler(async (req, res, next) => {
    callApi(req).post(apiUrl, { ...req.body })
        .then(r => {
            // Assign value in session
            res.status(200).json(r.data);
        })
        .catch(error => {
            //   req.flash('error', 'Incorrect email or password!');
        })

});


exports.getBannertext = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Bannertext', apiUrl, api_url, indexUrl: process.env.ADMIN_URL + '/admin/bannertext' };

    callApi(req).get(apiUrl + req.params.id)
        .then(r => {
            res.render('Bannertext/edit', { row: r.data.data });
        })
        .catch(error => {

        })
});

exports.updateBannertext = asyncHandler(async (req, res, next) => {

    callApi(req).post(apiUrl + req.params.id, req.body)
        .then(r => {
            // Assign value in session
            res.locals = { title: 'Bannertext-edit' };
            req.flash('message', 'Data save');
            res.redirect(process.env.ADMIN_URL + '/admin/Bannertext');
        })
        .catch(error => {
            req.flash('error', 'Data not updated');
        })
});

exports.deleteBannertext = asyncHandler(async (req, res, next) => {
    callApi(req).delete(apiUrl + req.params.id, req.body)
        .then(r => {
            // Assign value in session
            res.locals = { title: 'Bannertext' };
            req.flash('message', 'Deleted');
        }).catch(error => { req.flash('error', 'Data not updated'); })

    res.status(200).json({
        success: true,
        data: {}
    });
});


exports.addBannertext = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Bannertext', apiUrl, indexUrl: process.env.ADMIN_URL + '/admin/bannertext' };

    res.render('Bannertext/add', { row: {} });
});


exports.createBannertexts = asyncHandler(async (req, res, next) => {
    //console.log(req.session);
    res.locals = { title: 'Bannertext-add' };
    callApi(req).post(apiUrl + 'add', req.body)
        .then(r => {
            // Assign value in session
            req.flash('message', 'Data save');
            res.redirect(process.env.ADMIN_URL + '/admin/Bannertext');

        })
        .catch(error => {


            req.flash('error', 'Data not updated');

        })

});

exports.showBannertext = asyncHandler(async (req, res, next) => {
    callApi(req).get(apiUrl + req.params.id)
        .then(r => {
            // Assign value in session

            res.locals = { title: 'Bannertext-edit' };
            res.render('Bannertext/view', { row: r.data.data });


        })
        .catch(error => {


            //   req.flash('error', 'Incorrect email or password!');

        })
});
