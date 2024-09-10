const asyncHandler = require('../middleware/async');
const { callApi, api_url, stateList } = require('../helper/common');
var apiUrl = api_url + '/franchises/';


exports.listfranchise = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'franchise' };
      res.render('franchise/list', { 'message': req.flash('message'), 'error': req.flash('error') });
});


exports.getfranchise = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'franchise' };
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {

                  res.locals = { title: 'franchise' };
                  res.render('franchise/edit', { row: r.data.data ,stateList});
            })
            .catch(error => {

            })
});


exports.updatefranchise = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'franchise' };
      callApi(req).put(apiUrl + req.params.id, req.body)
            .then(r => {
                  if (r.data.success) {
                        // Assign value in session
                        req.flash('message', 'Data save');
                  } else {
                        req.flash('error', r.data.error);
                  }
                  if(req.role ==='admin'){
                        res.redirect(process.env.ADMIN_URL + '/admin/influencer');
                  }else{
                        res.redirect(process.env.ADMIN_URL + '/influencer/dashboard');
                  }            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});


exports.deletefranchise = asyncHandler(async (req, res, next) => {
      callApi(req).delete(apiUrl + req.params.id)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'franchise' };
                  req.flash('message', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/admin/manager');

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
      res.status(200).json({
            success: true,
            data: {}
      });
});




exports.getfranchises = asyncHandler(async (req, res, next) => {

      callApi(req).post(apiUrl, { ...req.body })
            .then(r => {
                  // Assign value in session                
                  res.status(200).json(r.data);

            })
            .catch(error => {


                  //   req.flash('error', 'Incorrect email or password!');

            })

});


exports.addfranchise = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'franchise' };
      res.render('franchise/add', { row: {},stateList });
});


exports.createfranchises = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'franchise' };
      callApi(req).post(apiUrl + 'add', req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'franchise-edit' };
                  req.flash('message', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/admin/frechise');

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});

exports.showfranchise = asyncHandler(async (req, res, next) => {
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                  // Assign value in session

                  res.locals = { title: 'franchise' };
                  res.render('franchise/view', { row: r.data.data });


            })
            .catch(error => {


                  //   req.flash('error', 'Incorrect email or password!');

            })
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'franchise' };
      res.render('franchise/resetpassword');
});

exports.updatePassword = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'franchise' };
      callApi(req).post(apiUrl + 'resetpassword', req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'franchise' };
                  req.flash('message', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/franchise/dashboard');

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});