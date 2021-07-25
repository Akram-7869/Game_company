//const ErrorResponse = require('../utils/errorResponse');
 const asyncHandler = require('../middleware/async');
// const {Players} = require('../models/Players');
// const {User} = require('../models/User');
var axios = require("axios");

// @desc      Get all Players
// @route     GET /api/v1/Players
// @access    Private/Admin
exports.dashBoardView = asyncHandler(async (req, res, next) => {
    res.locals = { title: 'Datatables' };
    res.render('Dashboard/index')
    // axios.get('http://localhost:3000/api/v1/players')
    //       .then(r => {
    //             // Assign value in session
    //             res.render('Players/list', {list:r.data})
    //       })
    //       .catch(error => {
    //             

    //          //   req.flash('error', 'Incorrect email or password!');
    //          
    //       })
});
 