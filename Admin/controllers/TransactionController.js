const asyncHandler = require('../middleware/async');
const { callApi, api_url, redirect, stateList } = require('../helper/common');
var apiUrl = api_url + '/transactions/';


exports.transcationList = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables', stateList };
      res.render('Transaction/list');
});


exports.getTransaction = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Datatables' };
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {

                  res.locals = { title: 'Transaction-edit' };
                  res.render('Transaction/edit', { row: r.data.data });
            })
            .catch(error => {

            })
});


exports.updateTransaction = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Datatables' };
      callApi(req).post(apiUrl + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Transaction-edit' };
                  req.flash('error', 'Data save');
                  res.render('Transaction/edit', { row: r.data.data });

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});


exports.deleteTransaction = asyncHandler(async (req, res, next) => {
      callApi(req).delete(apiUrl + req.params.id, req.body)
            .then(r => {
                  req.flash('success', 'Deleted');

            }).catch(error => { req.flash('error', 'Data not updated'); })
      res.status(200).json({
            success: true,
            data: {}
      });
});




exports.getTranscations = asyncHandler(async (req, res, next) => {

      callApi(req).post(apiUrl, { ...req.body }, { params: req.query })
            .then(r => {
                  // Assign value in session
                  res.status(200).json(r.data);
            })
            .catch(error => {
                  //   req.flash('error', 'Incorrect email or password!');
            })

});


exports.getAddForm = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Transaction-edit' };

      res.render('Transaction/edit', { row: {} });
});

exports.createTransaction = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Transaction-edit' };
      callApi(req).post(apiUrl + 'add/player/' + req.params.id, req.body)
            .then(r => {
                  // redirect 
                  res.redirect(process.env.ADMIN_URL + '/admin/player/' + req.params.id);

            })
            .catch(error => {
                  req.flash('error', 'Data not updated');
            })
});

exports.showTransactionView = asyncHandler(async (req, res, next) => {
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                  // Assign value in session

                  res.locals = { title: 'Transaction-edit' };
                  res.render('Transaction/view', { row: r.data.data });


            })
            .catch(error => {


                  //   req.flash('error', 'Incorrect email or password!');

            })
});
