const asyncHandler = require('../middleware/async');
let axios = require("axios");
const { callApi, api_url } = require('../helper/common');
let apiUrl = api_url + '/wallPost/';

exports.wallPostList = asyncHandler(async (req, res, next) => {
  res.locals = { title: 'wallPost', apiUrl };
  res.render('WallPost/list', { originalUrl: req.originalUrl })
});
exports.getwallPost = asyncHandler(async (req, res, next) => {
  res.locals = { title: 'wallPost', apiUrl };
  axios.get(apiUrl + req.params.id)
    .then(r => {
      res.locals = { title: 'wallPost' };
      res.render('WallPost/edit', { row: r.data.data });
    })
    .catch(error => {

    })
});


exports.updatewallPost = asyncHandler(async (req, res, next) => {
  res.locals = { title: 'wallPost' };
  axios.post(apiUrl + req.params.id, req.body)
    .then(r => {
      // Assign value in session
      req.flash('message', 'Data save');
      res.redirect(process.env.ADMIN_URL + '/admin/wallPost');
    })
    .catch(error => { req.flash('error', 'Data not updated'); })
});
exports.editwallPost = asyncHandler(async (req, res, next) => {
  res.locals = { title: 'wallPost', apiUrl, indexUrl: process.env.ADMIN_URL + '/admin/wallPost' };
  axios.get(apiUrl + req.params.id, req.body)
    .then(r => {
      // Assign value in session

      req.flash('message', 'Data save');

      res.render('WallPost/edit', { row: r.data.data });
    })
    .catch(error => {

      req.flash('error', 'Data not updated');

    })
});

exports.deletewallPost = asyncHandler(async (req, res, next) => {
  callApi(req).delete(apiUrl + req.params.id, req.body)
    .then(r => {
      // Assign value in session
      res.locals = { title: 'Player-edit' };
      req.flash('success', 'Deleted');
      // res.render('Players/List',{row:r.data.data}); 

    }).catch(error => { req.flash('error', 'Data not updated'); })
  res.status(200).json({
    success: true,
    data: {}
  });
});




exports.getwallPosts = asyncHandler(async (req, res, next) => {

  axios.post(apiUrl, { ...req.body })
    .then(r => {
      // Assign value in session

      res.status(200).json(r.data);


    })
    .catch(error => {

      //   req.flash('error', 'Incorrect email or password!');

    })

});


exports.wallPostAdd = asyncHandler(async (req, res, next) => {
  res.locals = { title: 'wallPost', 'apiUrl': apiUrl, indexUrl: process.env.ADMIN_URL + '/admin/wallPost' };

  res.render('WallPost/add', { row: {} });
});


exports.createwallPosts = asyncHandler(async (req, res, next) => {
  res.locals = { title: 'wallPost' };
  //console.log('creating-image', req.files);

  axios.post(apiUrl, { body: req.body, file: req.files })
    .then(r => {
      // Assign value in session
      res.locals = { title: 'wallPost' };
      req.flash('message', 'Data save');
      res.redirect(process.env.ADMIN_URL + '/admin/wallPost');


    })
    .catch(error => {
      //   

      req.flash('error', 'Data not updated');

    })
  res.render('WallPost/list', { row: {} });
});

// exports.showPlayerView = asyncHandler(async (req, res, next) => {
//       axios.get(apiUrl + req.params.id)
//             .then(r => {
//                   // Assign value in session
//
//                   res.locals = { title: 'wallPost' };
//                   res.render('WallPost/view',{row:r.data.data});
//

//             })
//             .catch(error => {
//

//                //   req.flash('error', 'Incorrect email or password!');
//
//             })
// });
