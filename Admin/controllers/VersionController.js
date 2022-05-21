const asyncHandler = require('../middleware/async');
const { callApi, api_url, redirect } = require('../helper/common');
var apiUrl = api_url + '/versions/';


exports.listVersion = asyncHandler(async (req, res, next) => {
      res.locals = { title: ' Version  Controle' };
      res.render('Version/list');
});


exports.getVersion = asyncHandler(async (req, res, next) => {
      res.locals = { title: ' Version  Controle' };
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {

                  res.locals = { title: 'Version-edit' };
                  res.render('Version/edit', { row: r.data.data });
            })
            .catch(error => {

            })
});


exports.updateVersion = asyncHandler(async (req, res, next) => {

      res.locals = { title: ' Version  Controle' };
      callApi(req).post(apiUrl + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Version-edit' };
                  req.flash('error', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/admin/Version');


            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});


exports.deleteVersion = asyncHandler(async (req, res, next) => {
      callApi(req).delete(apiUrl + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Version' };
                  req.flash('success', 'Deleted');
                  // res.render('Players/List',{row:r.data.data}); 

            }).catch(error => { req.flash('error', 'Data not updated'); })

      res.status(200).json({
            success: true,
            data: {}
      });
});




exports.getVersions = asyncHandler(async (req, res, next) => {

      callApi(req).post(apiUrl, { ...req.body })
            .then(r => {
                  // Assign value in session


                  res.status(200).json(r.data);



            })
            .catch(error => {


                  //   req.flash('error', 'Incorrect email or password!');

            })

});


exports.addVersion = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Version' };

      res.render('Version/add', { row: {} });
});


exports.createVersions = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Version-add' };
      callApi(req).post(apiUrl + 'add', req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Version-edit' };
                  req.flash('message', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/admin/Version');

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});

exports.showVersion = asyncHandler(async (req, res, next) => {
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                  // Assign value in session

                  res.locals = { title: 'Version-edit' };
                  res.render('Version/view', { row: r.data.data });


            })
            .catch(error => {


                  //   req.flash('error', 'Incorrect email or password!');

            })
});
