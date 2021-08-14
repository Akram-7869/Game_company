const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Ticket = require('../models/Ticket');

// @desc      Get all Tickets
// @route     GET /api/v1/auth/Tickets
// @access    Private/Admin
exports.getTickets = asyncHandler(async (req, res, next) => {
   Ticket.dataTables({
    limit: req.body.length,
    skip: req.body.start,
    select:{ 'PlayerId':1, 'complexity':1, 'status':1, 'createdAt':1},
    search: {
      value: req.body.search?  req.body.search.value:'',
      fields: ['complexity']
    },
    sort: {
      _id: 1
    },
    populate:'PlayerId'
  }).then(function (table) {
    res.json({data: table.data, recordsTotal:table.total,recordsFiltered:table.total, draw:req.body.draw}); // table.total, table.data
  })
  //res.status(200).json(res.advancedResults);
});

// @desc      Get single Ticket
// @route     GET /api/v1/auth/Tickets/:id
// @access    Private/Admin
exports.getTicket = asyncHandler(async (req, res, next) => {
  const row = await Ticket.findById(req.params.id);

  res.status(200).json({
    success: true,
    data: row
  });
});

// @desc      Create Ticket
// @route     POST /api/v1/auth/Tickets
// @access    Private/Admin
exports.createTicket = asyncHandler(async (req, res, next) => {

  const row = await Ticket.create(req.body);

  res.status(201).json({
    success: true,
    data: row
  });
});

// @desc      Update Ticket
// @route     PUT /api/v1/auth/Tickets/:id
// @access    Private/Admin
exports.updateTicket = asyncHandler(async (req, res, next) => {
  if(!req.staff){
    return next(
      new ErrorResponse(`Please Login`)
    );
  }
  let row = await Ticket.findById(req.params.id).populate('playerId');
  if (!row) {
    return next(
      new ErrorResponse(`Ticket  not found`)
    );
  }
  let reply = {'reply':req.body.history,from:req.staff.firstName}
  let fieldsToUpdate= {status:req.body.status, $addToSet: { 'history':reply } };
   
  row = await Ticket.findByIdAndUpdate(req.params.id,  fieldsToUpdate, {
    new: true,
    runValidators: true
  });

   //Ticket.isNew = false;
 // await Ticket.save();
  res.status(200).json({
    success: true,
    data: row
  });
});

// @desc      Delete Ticket
// @route     DELETE /api/v1/auth/Tickets/:id
// @access    Private/Admin
exports.deleteTicket = asyncHandler(async (req, res, next) => {
  const row = await Ticket.findById(req.params.id);
 // await Ticket.findByIdAndDelete(req.params.id);
  res.status(200).json({
    success: true,
    data: {}
  });
});

