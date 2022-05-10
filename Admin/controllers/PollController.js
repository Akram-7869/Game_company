const asyncHandler = require('../middleware/async');
let axios = require("axios");
const { callApi, api_url } = require('../helper/common');
let apiUrl = api_url + '/polls/';

exports.pollList = asyncHandler(async (req, res, next) => {
  res.locals = { title: 'Poll', apiUrl };
  res.render('Poll/list')
});
exports.getPoll = asyncHandler(async (req, res, next) => {
  res.locals = { title: 'Poll', apiUrl };
  axios.get(apiUrl + req.params.id)
    .then(r => {
      res.locals = { title: 'Poll' };
      res.render('Poll/edit', { row: r.data.data });
    })
    .catch(error => {

    })
});


exports.updatePoll = asyncHandler(async (req, res, next) => {
  res.locals = { title: 'Poll' };
  axios.post(apiUrl + req.params.id, req.body)
    .then(r => {
      // Assign value in session
      req.flash('message', 'Data save');
      res.redirect(process.env.ADMIN_URL + '/admin/poll');
    })
    .catch(error => { req.flash('error', 'Data not updated'); })
});
exports.editPoll = asyncHandler(async (req, res, next) => {
  res.locals = { title: 'Poll', apiUrl, indexUrl: process.env.ADMIN_URL + '/admin/poll' };
  axios.get(apiUrl + req.params.id, req.body)
    .then(r => {
      // Assign value in session

      req.flash('message', 'Data save');

      res.render('Poll/edit', { row: r.data.data });
    })
    .catch(error => {

      req.flash('error', 'Data not updated');

    })
});

exports.deletePoll = asyncHandler(async (req, res, next) => {
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




exports.getPolls = asyncHandler(async (req, res, next) => {

  axios.post(apiUrl, { ...req.body })
    .then(r => {
      // Assign value in session

      res.status(200).json(r.data);


    })
    .catch(error => {

      //   req.flash('error', 'Incorrect email or password!');

    })

});


exports.pollAdd = asyncHandler(async (req, res, next) => {
  res.locals = { title: 'Poll', 'apiUrl': apiUrl, indexUrl: process.env.ADMIN_URL + '/admin/poll' };

  res.render('Poll/add', { row: {} });
});


exports.createPolls = asyncHandler(async (req, res, next) => {
  res.locals = { title: 'Poll' };
  //console.log('creating-image', req.files);

  axios.post(apiUrl, { body: req.body, file: req.files })
    .then(r => {
      // Assign value in session
      res.locals = { title: 'Poll' };
      req.flash('success', 'Data save');
      res.redirect(process.env.ADMIN_URL + '/admin/poll');


    })
    .catch(error => {
      //   

      req.flash('error', 'Data not updated');

    })
  res.render('Poll/list', { row: {} });
});

// exports.showPlayerView = asyncHandler(async (req, res, next) => {
//       axios.get(apiUrl + req.params.id)
//             .then(r => {
//                   // Assign value in session
//
//                   res.locals = { title: 'Poll' };
//                   res.render('Poll/view',{row:r.data.data});
//

//             })
//             .catch(error => {
//

//                //   req.flash('error', 'Incorrect email or password!');
//
//             })
// });
