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
    callApi(req).post(apiUrl + 'filter/dashboard', { s_date: '2021-08-01', e_date: '2021-09-01', logType: 'game' })
        .then(r => {

            let lableDb = r.data.data.graph.map(d => {
                return d._id
            });
            let sumDb = r.data.data.graph.map(d => {
                return d.totalAmount
            });

            console.log(lableDb, sumDb);
            res.render('Dashboard/index', { list: r.data.data.row, lableDb, sumDb })
        })
        .catch(error => { req.flash('error', 'Incorrect email or password!'); })
});
