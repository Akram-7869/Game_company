const asyncHandler = require('../middleware/async');
const { callApi, api_url, stateList } = require('../helper/common');
var apiUrl = api_url + '/frenchises/';


exports.listFrenchise = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Frenchise' };
      res.render('Frenchise/list', { 'message': req.flash('message'), 'error': req.flash('error') });
});


exports.getFrenchise = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Frenchise' };
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {

                  res.locals = { title: 'Frenchise' };
                  res.render('Frenchise/edit', { row: r.data.data ,stateList});
            })
            .catch(error => {

            })
});


exports.updateFrenchise = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Frenchise' };
      callApi(req).put(apiUrl + req.params.id, req.body)
            .then(r => {
                  if (r.data.success) {
                        // Assign value in session
                        req.flash('message', 'Data save');
                  } else {
                        req.flash('error', r.data.error);
                  }
                  res.redirect(process.env.ADMIN_URL + '/admin/manager');
            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});


exports.deleteFrenchise = asyncHandler(async (req, res, next) => {
      callApi(req).delete(apiUrl + req.params.id)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Frenchise' };
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




exports.getFrenchises = asyncHandler(async (req, res, next) => {

      callApi(req).post(apiUrl, { ...req.body })
            .then(r => {
                  // Assign value in session                
                  res.status(200).json(r.data);

            })
            .catch(error => {


                  //   req.flash('error', 'Incorrect email or password!');

            })

});


exports.addFrenchise = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Frenchise' };
      res.render('Frenchise/add', { row: {},stateList });
});


exports.createFrenchises = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Frenchise' };
      callApi(req).post(apiUrl + 'add', req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Frenchise-edit' };
                  req.flash('message', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/admin/frechise');

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});

exports.showFrenchise = asyncHandler(async (req, res, next) => {
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                  // Assign value in session

                  res.locals = { title: 'Frenchise' };
                  res.render('Frenchise/view', { row: r.data.data });


            })
            .catch(error => {


                  //   req.flash('error', 'Incorrect email or password!');

            })
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Frenchise' };
      res.render('Frenchise/resetpassword');
});

exports.updatePassword = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Frenchise' };
      callApi(req).post(apiUrl + 'resetpassword', req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Frenchise' };
                  req.flash('message', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/admin/manager');

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});