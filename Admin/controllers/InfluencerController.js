const asyncHandler = require('../middleware/async');
const { callApi, api_url, redirect, uploadFile, deletDiskFile } = require('../helper/common');
const path = require('path');
var apiUrl = api_url + '/influencers/';


exports.listInfluencer = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      res.render('Influencer/list', { 'message': req.flash('message'), 'error': req.flash('error') });
});
let handleIndexUrl = (req) => {
      if (req.role === 'influencer') {
            return process.env.ADMIN_URL + '/influencer/profile';
      } else {
            return process.env.ADMIN_URL + '/admin/influencer'
      }
}

exports.getInfluencer = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Post', apiUrl, indexUrl: handleIndexUrl(req), originalUrl: req.originalUrl };

      callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                  res.render('Influencer/edit', { row: r.data.data });
            })
            .catch(error => {

            })
});

exports.profile = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Post', apiUrl, indexUrl: handleIndexUrl(req), originalUrl: req.originalUrl };
      callApi(req).get(apiUrl + req.userId)
            .then(r => {

                  res.render('Influencer/edit', { row: r.data.data });
            })
            .catch(error => {

            })
});


exports.updateInfluencer = asyncHandler(async (req, res, next) => {
      let { description, imageId } = req.body;
      res.locals = { title: 'Datatables' };
      callApi(req).put(apiUrl + req.userId, { ...req.body })
            .then(r => {
                  if (r.data.success) {
                        // Assign value in session
                        req.flash('message', 'Data save');
                  } else {
                        req.flash('error', r.data.error);
                  }
                  if (req.role === 'admin') {
                        res.redirect(process.env.ADMIN_URL + '/admin/influencer');
                  } else {
                        res.redirect(process.env.ADMIN_URL + '/influencer/dashboard');
                  }
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
                  res.redirect(process.env.ADMIN_URL + '/influencer/dashboard');

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
                  res.render('Influencer/withdraw', { row: r.data.data });
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
                  res.redirect(process.env.ADMIN_URL + '/influencer/dashboard');

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
                  res.redirect(process.env.ADMIN_URL + '/influencer/dashboard');

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
                  res.redirect(process.env.ADMIN_URL + '/influencer/dashboard');

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});
exports.gameList = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Game List' };
      res.render('Influencer/leaderboard')
});
exports.gameData = asyncHandler(async (req, res, next) => {
      callApi(req).post(apiUrlGame, { ...req.body }, { params: req.query })
            .then(r => {
                  res.status(200).json(r.data);
            })
            .catch(error => {//   req.flash('error', 'Incorrect email or password!');})
            });
});