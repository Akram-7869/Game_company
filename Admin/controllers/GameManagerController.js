const asyncHandler = require('../middleware/async');
let axios = require("axios");
const { callApi, api_url } = require('../helper/common');
let apiUrl = api_url + '/gamemanager/';

exports.gameList = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Game', apiUrl, image_url: process.env.IMAGE_URL };
      res.render('GameManager/list')
});
exports.getgame= asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Game', apiUrl, image_url: process.env.IMAGE_URL };
      axios.get(apiUrl + req.params.id)
            .then(r => {
                  res.locals = { title: 'Game' };
                  res.render('GameManager/edit', { row: r.data.data });
            })
            .catch(error => {

            })
});


exports.updategame = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Game' };
      axios.post(apiUrl + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  req.flash('message', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/admin/gamemanager');
            })
            .catch(error => { req.flash('error', 'Data not updated'); })
});
exports.editgame = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Game', apiUrl, indexUrl: process.env.ADMIN_URL + '/admin/gamemanager' };
      axios.get(apiUrl + req.params.id, req.body)
            .then(r => {
                   res.render('GameManager/edit', { row: r.data.data });
            })
            .catch(error => {
                  req.flash('error', 'Data not updated');
            })
});

exports.delgame = asyncHandler(async (req, res, next) => {
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




exports.getgamedata= asyncHandler(async (req, res, next) => {

      axios.post(apiUrl, { ...req.body })
            .then(r => {
                  // Assign value in session
                  res.status(200).json(r.data);
            })
            .catch(error => {
                  //   req.flash('error', 'Incorrect email or password!');
            })

});


exports.gameAdd = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Game', 'apiUrl': apiUrl, indexUrl: process.env.ADMIN_URL + '/admin/gamemanager', image_url: process.env.IMAGE_URL };

      res.render('GameManager/add', { row: {} });
});


exports.gameCreate = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Game' };
 
      axios.post(apiUrl+'add',  req.body)
            .then(r => {
                  // Assign value in session
                   req.flash('message', 'Data save');
                   console.log(r.data);
                  res.redirect(process.env.ADMIN_URL + '/admin/gamemanager/'+r.data.data._id);


            })
            .catch(error => {
                  //   

                  req.flash('error', 'Data not updated');
 

            })
});


exports.updatePackage = asyncHandler(async (req, res, next) => {

      console.log('ree', req.url);
      callApi(req).post(apiUrl  + 'upload/' + req.params.id, req.body)
            .then(r => {
                  res.locals = { title: 'Site' };
                  req.flash('success', 'Updated');
                  res.redirect(process.env.ADMIN_URL + '/admin/gamemanager/');
                  return;
            }).catch(error => { })
});