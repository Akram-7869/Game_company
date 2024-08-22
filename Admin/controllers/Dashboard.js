//const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
// const {Players} = require('../models/Players');
// const {User} = require('../models/User');
let axios = require("axios");
const { callApi, api_url, redirect } = require('../helper/common');
let apiUrl = api_url + '/dashboards/';

// @desc      Get all Players
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.dashBoardView = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Dashboard' };
    callApi(req).post(apiUrl + 'filter/dashboard', { s_date: '2021-08-01', e_date: '2021-09-01', logType: 'game' })
        .then(r => {

            
            res.render('Dashboard/influencer', r.data)
        })
        .catch(error => { req.flash('error', 'Incorrect email or password!'); })
});
exports.franchiseIncome = asyncHandler(async (req, res, next) => {
    callApi(req).post(apiUrl + 'franchise-income', req.body)
        .then(r => {
            res.status(200).json(r.data)
        })
        .catch(error => { res.status(400).json(error); })
});
// @desc      Get all Players
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.totalIncome = asyncHandler(async (req, res, next) => {
    callApi(req).post(apiUrl + 'total-income', req.body)
        .then(r => {
            res.status(200).json(r.data)
        })
        .catch(error => { res.status(400).json(error); })
});
// @desc      Get all Players
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.getChartData = asyncHandler(async (req, res, next) => {
    var start = new Date();
    var now = new Date();
    start.setDate(now.getDate() - 30);

    req.body.Form || start.toISOString().split('T')[0];
    if (!req.body.s_date) {
        req.body.s_date = start.toISOString().split('T')[0];
    }
    if (!req.body.e_date) {
        req.body.e_date = now.toISOString().split('T')[0];
    }

    let filter = { s_date: req.body.s_date, e_date: req.body.e_date, logType: req.body.logType };
    //console.log(filter, req.body);
    callApi(req).post(apiUrl + 'chart/data', filter)
        .then(r => {
            let lableDb = r.data.data.graph.map(d => {
                return d._id
            });
            let sumDb = r.data.data.graph.map(d => {
                return d.totalAmount
            });
            res.status(200).json({ lableDb, sumDb });
        })
        .catch(error => { req.flash('error', 'Incorrect email or password!'); })
});

// @desc      Get all Players
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.dashBoardInfluncerView = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Dashboard' };
    callApi(req).post(apiUrl + 'filter/influencer', { s_date: '2021-08-01', e_date: '2021-09-01', logType: 'game' })
        .then(r => {
            res.render('Dashboard/influencer',  r.data )
        })
        .catch(error => { req.flash('error', 'Incorrect email or password!'); })
});
// @desc      Get all Players
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.influencerIncome = asyncHandler(async (req, res, next) => {
    callApi(req).post(apiUrl + 'influencer-income', req.body)
        .then(r => {
            res.status(200).json(r.data)
        })
        .catch(error => { res.status(400).json(error); })
});

// @desc      Get all Players
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.totalIncome = asyncHandler(async (req, res, next) => {
    callApi(req).post(apiUrl + 'total-income', req.body)
        .then(r => {
            res.status(200).json(r.data)
        })
        .catch(error => { res.status(400).json(error); })
});


// @desc      Get all Players
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.dashBoardfranchiseView = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Dashboard' };
    callApi(req).post(apiUrl + 'filter/franchise', { s_date: '2021-08-01', e_date: '2021-09-01', logType: 'game' })
        .then(r => {
            res.render('Dashboard/franchise', r.data)
        })
        .catch(error => { req.flash('error', 'Incorrect email or password!'); })
});

// @desc      Get all Players
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.totalIncome = asyncHandler(async (req, res, next) => {
    callApi(req).post(apiUrl + 'total-income', req.body)
        .then(r => {
            res.status(200).json(r.data)
        })
        .catch(error => { res.status(400).json(error); })
});