const asyncHandler = require('../middleware/async');
const { callApi, api_url, redirect } = require('../helper/common');
var apiUrl = api_url + '/bots/';


exports.listBot = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Bot Controle' };
      res.render('Bot/list');
});


exports.getBot = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Bot Controle' };
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {

                  res.locals = { title: 'Bot' };
                  res.render('Bot/edit', { row: r.data.data });
            })
            .catch(error => {

            })
});


exports.updateBot = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Bot Controle' };
      callApi(req).post(apiUrl + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Bot' };
                  req.flash('error', 'Data save');
                  //res.render('Bot/edit', { row: r.data.data });
                  res.redirect(process.env.ADMIN_URL + '/admin/bot');

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});


exports.deleteBot = asyncHandler(async (req, res, next) => {
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




exports.getBots = asyncHandler(async (req, res, next) => {

      callApi(req).post(apiUrl, { ...req.body })
            .then(r => {
                  // Assign value in session


                  res.status(200).json(r.data);



            })
            .catch(error => {


                  //   req.flash('error', 'Incorrect email or password!');

            })

});


exports.addBot = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Bot' };

      res.render('Bot/add', { row: {} });
});


exports.createBots = asyncHandler(async (req, res, next) => {
      callApi(req).post(apiUrl + 'add', req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Bot' };
                  req.flash('success', 'Data save');
                  // res.render('Bot/edit', { row: r.data.data });
                  res.redirect(process.env.ADMIN_URL + '/admin/bot');

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })

});

exports.showBotView = asyncHandler(async (req, res, next) => {
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                  // Assign value in session

                  res.locals = { title: 'Bot' };
                  res.render('Bot/view', { row: r.data.data });


            })
            .catch(error => {


                  //   req.flash('error', 'Incorrect email or password!');

            })
});
