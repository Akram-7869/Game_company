const asyncHandler = require('../middleware/async');
let axios = require("axios");
const { callApi, api_url, redirect } = require('../helper/common');
let apiUrl = api_url + '/notifications/';
let apiFile = api_url + '/files/';
console.log('apiUrl', apiUrl)

exports.notificationList = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Notification', apiUrl, apiFile };
      res.render('Notification/list')
});


exports.getNotification = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Notification', apiUrl, apiFile };

      axios.get(apiUrl + req.params.id)
            .then(r => {
                  res.render('Notification/edit', { row: r.data.data });
            })
            .catch(error => {

            })
});

exports.getPlayerList = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Selection Player for Notification', apiUrl, apiFile, nid: req.params.id };
      res.render('Notification/playerlist');
});
exports.addPlayerList = asyncHandler(async (req, res, next) => {
      //res.locals = { title: 'Selection Player for Notification',apiUrl, apiFile };

      axios.post(apiUrl + 'player/' + req.params.nid + '/' + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Notification' };
                  req.flash('error', 'Data save');

                  res.render('Notification/edit', { row: r.data.data });
            })
            .catch(error => { req.flash('error', 'Data not updated'); });
      res.status(200).json({
            success: true,
            data: {}
      });
});
exports.removePlayerList = asyncHandler(async (req, res, next) => {
      // res.locals = { title: 'Selection Player for Notification',apiUrl, apiFile };
      callApi(req).delete(apiUrl + 'player/' + req.params.nid + '/' + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  req.flash('success', 'Deleted');
                  // res.render('Players/List',{row:r.data.data}); 

            }).catch(error => { req.flash('error', 'Data not updated'); })
      res.status(200).json({
            success: true,
            data: {}
      });
});


exports.updateNotification = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Notification' };
      axios.post(apiUrl + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Notification' };
                  req.flash('success', 'Data save');

                  res.render('Notification/edit', { row: r.data.data });
            })
            .catch(error => {

                  req.flash('error', 'Data not updated');

            })
});
exports.editNotification = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Notification', apiUrl };
      axios.get(apiUrl + req.params.id, req.body)
            .then(r => {
                  // Assign value in session

                  req.flash('success', 'Data save');

                  res.render('Notification/edit', { row: r.data.data });
            })
            .catch(error => {

                  req.flash('error', 'Data not updated');

            })
});

exports.deleteNotification = asyncHandler(async (req, res, next) => {
      callApi(req).delete(apiUrl + req.params.id, req.body)
            .then(r => {
                  // Assign value in session

                  //req.flash('success', 'Deleted');
                  // res.render('Players/List',{row:r.data.data}); 

            }).catch(error => { req.flash('error', 'Data not updated'); })
      res.status(200).json({
            success: true,
            data: {}
      });
});

exports.getNotifications = asyncHandler(async (req, res, next) => {
      callApi(req).post(apiUrl, { ...req.body })
            .then(r => {
                  res.status(200).json(r.data);
            })
            .catch(error => {
                  //   req.flash('error', 'Incorrect email or password!');
            })
});


exports.notificationAdd = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Notification', 'apiUrl': apiUrl, apiFile };

      res.render('Notification/add', { row: {} });
});


exports.createNotifications = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Notification' };
      console.log('sending', req.body)

      req.body['status'] = 'inactive';
      callApi(req).post(apiUrl + "add", req.body)
            .then(r => {
                  // Assign value in session
                  req.locals = { title: 'Notification' };
                  req.flash('success', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/admin/notication');

            })
            .catch(error => {
                  //   
                  // console.error('errorr');
                  req.flash('error', 'Data not updated');

            })
      // res.render('Notification/list',{row:{}});
});

exports.sentoAll = asyncHandler(async (req, res, next) => {
      axios.post(apiUrl + 'player/all/' + req.params.id)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Notification' };
                  req.flash('error', 'Data save');
                  res.render('Notification/edit', { row: r.data.data });
            })
            .catch(error => { req.flash('error', 'Data not updated'); });
      res.status(200).json({
            success: true,
            data: {}
      });
});

