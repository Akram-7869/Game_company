const asyncHandler = require('../middleware/async');
const { callApi, api_url, redirect } = require('../helper/common');
var apiUrl = api_url + '/tickets/';


exports.listTicket = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Tickets' };
      res.render('Ticket/list');
});


exports.getTicket = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Ticket' };
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {

                  res.locals = { title: 'Ticket' };
                  res.render('Ticket/edit', { row: r.data.data });
            })
            .catch(error => {

            })
});


exports.updateTicket = asyncHandler(async (req, res, next) => {

      res.locals = { title: 'Ticket' };
      callApi(req).post(apiUrl + req.params.id, req.body)
            .then(r => {
                  // Assign value in session
                  req.flash('message', 'Data save');
                  res.redirect(process.env.ADMIN_URL + '/admin/ticket');
            })
            .catch(error => {
                  req.flash('error', 'Data not updated');
            })
});

exports.deleteTicket = asyncHandler(async (req, res, next) => {
      res.status(200).json({
            success: true,
            data: {}
      });
});

exports.getTickets = asyncHandler(async (req, res, next) => {

      callApi(req).post(apiUrl, { ...req.body })
            .then(r => {
                  // Assign value in session
                  res.status(200).json(r.data);
            })
            .catch(error => {
                  //   req.flash('error', 'Incorrect email or password!');
            })

});


exports.addTicket = asyncHandler(async (req, res, next) => {
      res.locals = { title: 'Ticket' };
      res.render('Ticket/add', { row: {} });
});


exports.createTickets = asyncHandler(async (req, res, next) => {
      callApi(req).post(apiUrl + 'add', req.body)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Ticket' };
                  req.flash('success', 'Data save');
                  res.render('Ticket/edit', { row: r.data.data });

            })
            .catch(error => {


                  req.flash('error', 'Data not updated');

            })
});

exports.showTicketView = asyncHandler(async (req, res, next) => {
      callApi(req).get(apiUrl + req.params.id)
            .then(r => {
                  // Assign value in session
                  res.locals = { title: 'Ticket' };
                  res.render('Ticket/view', { row: r.data.data });
            })
            .catch(error => {
                  //   req.flash('error', 'Incorrect email or password!');
            })
});
