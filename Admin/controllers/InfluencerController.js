const asyncHandler = require('../middleware/async');
const { callApi, api_url, redirect } = require('../helper/common');
var apiUrl = api_url + '/influencers/';


exports.listInfluencer = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      res.render('Influencer/list', { 'message': req.flash('message'), 'error': req.flash('error') });
});


exports.getInfluencer = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {

                  res.locals = { title: 'Influencer' };
                  res.render('Influencer/edit', { row: r.data.data });
            })
            .catch(error => {

            })
});


exports.updateInfluencer = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Datatables' };
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


exports.deleteInfluencer = asyncHandler(async (req, res, next) => {
      callApi(req).delete(apiUrl + req.params.id)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Influencer' };
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




exports.getInfluencers = asyncHandler(async (req, res, next) => {

      callApi(req).post(apiUrl, { ...req.body })
            .then(r => {
                  // Assign value in session                
                  res.status(200).json(r.data);

            })
            .catch(error => {


                  //   req.flash('error', 'Incorrect email or password!');

            })

});


exports.addInfluencer = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Influencer' };
      res.render('Influencer/add', { row: {} });
});


exports.createInfluencers = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Influencer' };
      callApi(req).post(apiUrl + 'add', req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Influencer-edit' };
                  req.flash('message', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/admin/manager');

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});

exports.showInfluencer = asyncHandler(async (req, res, next) => {
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                  // Assign value in session

                  res.locals = { title: 'Influencer' };
                  res.render('Influencer/view', { row: r.data.data });


            })
            .catch(error => {


                  //   req.flash('error', 'Incorrect email or password!');

            })
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Influencer' };
      res.render('Influencer/resetpassword');
});

exports.updatePassword = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Datatables' };
      callApi(req).post(apiUrl + 'resetpassword', req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Influencer' };
                  req.flash('message', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/admin/manager');

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});