const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Transaction = require('../models/Transaction');

// @desc      Get all Transactions
// @route     GET /api/v1/auth/Transactions
// @access    Private/Admin
exports.getTransactions = asyncHandler(async (req, res, next) => {
  ;
  Transaction.dataTables({
    limit: req.body.length,
    skip: req.body.start,
    select:{'amount':1,'transactionType':1, 'note':1, 'createdAt':1},
    search: {
      value: req.body.search?  req.body.search.value:'',
      fields: ['playerId']
    },
    sort: {
      _id: 1
    }
  }).then(function (table) {
    res.json({data: table.data, recordsTotal:table.total,recordsFiltered:table.total, draw:req.body.draw}); // table.total, table.data
  })
  //res.status(200).json(res.advancedResults);
});

// @desc      Get single Transaction
// @route     GET /api/v1/auth/Transactions/:id
// @access    Private/Admin
exports.getTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);

  res.status(200).json({
    success: true,
    data: transaction
  });
});

// @desc      Create Transaction
// @route     POST /api/v1/auth/Transactions
// @access    Private/Admin
exports.createTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.create(req.body);

  res.status(201).json({
    success: true,
    data: transaction
  });
});

// @desc      Update Transaction
// @route     PUT /api/v1/auth/Transactions/:id
// @access    Private/Admin
exports.updateTransaction = asyncHandler(async (req, res, next) => {
  let {one, many}=req.body
  let transaction = await Transaction.findById(req.params.id);
  if (!transaction) {
    return next(
      new ErrorResponse(`Transaction  not found`, 404)
    );
  }
  let fieldsToUpdate= {one, many}
   
  transaction = await Transaction.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

   //Transaction.isNew = false;
 // await Transaction.save();
  res.status(200).json({
    success: true,
    data: transaction
  });
});

// @desc      Delete Transaction
// @route     DELETE /api/v1/auth/Transactions/:id
// @access    Private/Admin
exports.deleteTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);
 // await Transaction.findByIdAndDelete(req.params.id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

