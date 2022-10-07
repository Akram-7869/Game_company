const asyncHandler = require('../middleware/async');
let axios = require("axios");
const { callApi, api_url } = require('../helper/common');
let apiUrl = api_url + '/banners/';

exports.bannerList = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Banner', apiUrl, image_url: process.env.IMAGE_URL };
      res.render('Ads/list')
});
exports.getBanner = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Banner', apiUrl, image_url: process.env.IMAGE_URL };
      axios.get(apiUrl + req.params.id)
            .then(r => {
                  res.locals = { title: 'Banner' };
                  res.render('Ads/edit', { row: r.data.data });
            })
            .catch(error => {

            })
});


exports.updateBanner = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Banner' };
      axios.post(apiUrl + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  req.flash('message', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/admin/banner');
            })
            .catch(error => { req.flash('error', 'Data not updated'); })
});
exports.editBanner = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Banner', apiUrl, indexUrl: process.env.ADMIN_URL + '/admin/banner' };
      axios.get(apiUrl + req.params.id, req.body)
            .then(r => {
                  // Assign value in session

                  req.flash('message', 'Data save');

                  res.render('Ads/edit', { row: r.data.data });
            })
            .catch(error => {

                  req.flash('error', 'Data not updated');

            })
});

exports.deleteBanner = asyncHandler(async (req, res, next) => {
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




exports.getBanners = asyncHandler(async (req, res, next) => {

      axios.post(apiUrl, { ...req.body })
            .then(r => {
                  // Assign value in session

                  res.status(200).json(r.data);


            })
            .catch(error => {

                  //   req.flash('error', 'Incorrect email or password!');

            })

});


exports.bannerAdd = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Banner', 'apiUrl': apiUrl, indexUrl: process.env.ADMIN_URL + '/admin/banner', image_url: process.env.IMAGE_URL };

      res.render('Ads/add', { row: {} });
});


exports.createBanners = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Banner' };
      //console.log('creating-image', req.files);

      axios.post(apiUrl, { body: req.body, file: req.files })
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Banner' };
                  req.flash('message', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/admin/banner');


            })
            .catch(error => {
                  //   

                  req.flash('error', 'Data not updated');

            })
      res.render('Ads/list', { row: {} });
});

// exports.showPlayerView = asyncHandler(async (req, res, next) => {
//       axios.get(apiUrl + req.params.id)
//             .then(r => {
//                   // Assign value in session
//
//                   res.locals = { title: 'Banner' };
//                   res.render('Ads/view',{row:r.data.data});
//

//             })
//             .catch(error => {
//

//                //   req.flash('error', 'Incorrect email or password!');
//
//             })
// });
