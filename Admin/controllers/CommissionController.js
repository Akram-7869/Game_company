const { api_url ,callApi} = require('../helper/common');
const asyncHandler = require('../middleware/async');
var axios = require("axios");
var apiUrl = api_url + '/commissions/';


exports.commissionList = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Commission' };
      res.render('Commission/list')
});


exports.getCommission = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Commission' };
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {

                  res.locals = { title: 'Player-edit' };
                  res.render('Players/edit', { row: r.data.data });
            })
            .catch(error => {

            })
});
exports.getCommissions = asyncHandler(async (req, res, next) => {

    callApi(req).post(apiUrl, { ...req.body })
            .then(r => {
                  // Assign value in session
                  res.status(200).json(r.data);
            })
            .catch(error => {
                  //   req.flash('error', 'Incorrect email or password!');
            })

});


exports.getAddForm = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Player-edit' };
      res.render('Commission/add', { row: {} });
});


exports.createCommissions = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Player-edit' };
      axios.post(apiUrl, req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Player-edit' };
                  req.flash('message', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/commision');


            })
            .catch(error => {
                  req.flash('error', 'Data not updated');
            })

});

exports.showPlayerView = asyncHandler(async (req, res, next) => {
      axios.get(apiUrl + req.params.id)
            .then(r => {
                  // Assign value in session

                  res.locals = { title: 'Player-edit' };
                  res.render('Commission/view', { row: r.data.data });


            })
            .catch(error => { })
});

