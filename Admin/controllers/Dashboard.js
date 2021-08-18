//const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
// const {Players} = require('../models/Players');
// const {User} = require('../models/User');
let axios = require("axios");
const { callApi } = require('../helper/common');
let apiUrl = 'http://localhost:3000/api/v1/dashboards/';

// @desc      Get all Players
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.dashBoardView = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Dashboard' };
    callApi(req).get(apiUrl + 'filter/dashboard')
        .then(r => {
            console.log(r.data)
            res.render('Dashboard/index', { list: r.data.data })
        })
        .catch(error => { req.flash('error', 'Incorrect email or password!'); })
});
