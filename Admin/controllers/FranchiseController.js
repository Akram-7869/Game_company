const asyncHandler = require('../middleware/async');
const { callApi, api_url, stateList } = require('../helper/common');
var apiUrl = api_url + '/franchises/';


exports.listfranchise = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'franchise' };
      res.render('Franchise/list', { 'message': req.flash('message'), 'error': req.flash('error') });
});


exports.getfranchise = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'franchise' };
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {

                  res.locals = { title: 'franchise' };
                  res.render('Franchise/edit', { row: r.data.data, stateList });
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
                  if (req.role === 'admin') {
                        res.redirect(process.env.ADMIN_URL + '/admin/franchise');
                  } else {
                        res.redirect(process.env.ADMIN_URL + '/franchise/dashboard');
                  }
            })
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
      res.render('Franchise/add', { row: {}, stateList });
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
                  res.render('Franchise/view', { row: r.data.data });


            })
            .catch(error => {


                  //   req.flash('error', 'Incorrect email or password!');

            })
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'franchise' };
      res.render('Franchise/resetpassword');
});

exports.updatePassword = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'franchise' };
      callApi(req).post(apiUrl + 'resetpassword', req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'franchise' };
                  req.flash('message', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/Franchise/dashboard');

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});

let handleIndexUrl = (req) => {
      if (req.role === 'influencer') {
            return process.env.ADMIN_URL + '/franchise/profile';
      } else {
            return process.env.ADMIN_URL + '/admin/franchise'
      }
}

exports.profile = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Post', apiUrl, indexUrl: handleIndexUrl(req), originalUrl: req.originalUrl };
      callApi(req).get(apiUrl + req.userId)
            .then(r => {

                  res.render('Franchise/edit', { row: r.data.data, stateList });
            })
            .catch(error => {

            })
});


exports.updateInfluencer = asyncHandler(async (req, res, next) => {
      let { description, imageId } = req.body;
      res.locals = { title: 'Datatables' };
      callApi(req).put(apiUrl + req.params.id, { ...req.body })
            .then(r => {
                  if (r.data.success) {
                        // Assign value in session
                        req.flash('message', 'Data save');
                  } else {
                        req.flash('error', r.data.error);
                  }
                  if (req.role === 'admin') {
                        res.redirect(process.env.ADMIN_URL + '/admin/franchise');
                  } else {
                        res.redirect(process.env.ADMIN_URL + '/franchise/profile');
                  }
            })
            .catch(error => {
                  req.flash('error', 'Data not updated');
            })
});

exports.withdraw = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Influencer' };
      callApi(req).get(apiUrl + req.userId)
            .then(r => {

                  res.locals = { title: 'Influencer' };
                  res.render('Franchise/withdraw', { row: r.data.data });
            })
            .catch(error => {

            })

});

exports.postwithdraw = asyncHandler(async (req, res, next) => {

      // res.locals = { title: 'Datatables' };
      callApi(req).post(apiUrl + 'withdraw', req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Influencer' };
                  req.flash('message', 'With draw request success');
                  res.redirect(process.env.ADMIN_URL + '/franchise/dashboard');

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});

exports.addBank = asyncHandler(async (req, res, next) => {
      callApi(req).post(apiUrl + 'bank', req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Influencer' };
                  req.flash('message', 'With draw request success');
                  res.redirect(process.env.ADMIN_URL + '/franchise/profile');

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});
exports.addUpi = asyncHandler(async (req, res, next) => {

      callApi(req).post(apiUrl + 'upi', req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Influencer' };
                  req.flash('message', 'With draw request success');
                  res.redirect(process.env.ADMIN_URL + '/franchise/dashboard');

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});

exports.addUsdt = asyncHandler(async (req, res, next) => {
      callApi(req).post(apiUrl + 'usdt', req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Influencer' };
                  req.flash('message', 'With draw request success');
                  res.redirect(process.env.ADMIN_URL + '/franchise/dashboard');

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});
