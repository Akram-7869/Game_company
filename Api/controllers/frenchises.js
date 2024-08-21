const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Franchise = require('../models/Franchise');

// @desc      Get all users
// @route     GET /api/v1/auth/users
// @access    Private/Admin
exports.getFranchises = asyncHandler(async (req, res, next) => {
  Franchise.dataTables({
    limit: req.body.length,
    skip: req.body.start,
    select: { 'firstName': 1, 'phone': 1, 'email': 1, 'status': 1, 'createdAt': 1, 'role': 1 },
    search: {
      value: req.body.search ? req.body.search.value : '',
      fields: ['email']
    },
    sort: {
      _id: 1
    }
  }).then(function (table) {
    res.json({ data: table.data, recordsTotal: table.total, recordsFiltered: table.total, draw: req.body.draw }); // table.total, table.data
  })
});

// @desc      Get single user
// @route     GET /api/v1/auth/users/:id
// @access    Private/Admin
exports.getFranchise = asyncHandler(async (req, res, next) => {
  const user = await Franchise.findById(req.params.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc      Create user
// @route     POST /api/v1/auth/users
// @access    Private/Admin
exports.createFranchise = asyncHandler(async (req, res, next) => {
  if (req.body.role === 'superadmin') {
    return next(
      new ErrorResponse(
        `Franchise ${req.user.id} is not authorized to update provider ${provider._id}`)
    );
  }
  console.log(req.body)
  const user = await Franchise.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc      Update user
// @route     PUT /api/v1/auth/users/:id
// @access    Private/Admin
exports.updateFranchise = asyncHandler(async (req, res, next) => {
  const user = await Franchise.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorResponse(`Franchise  not found`)
    );
  }
  //  Make sure user is provider owner
  if (req.staff.role == 'superadmin') {
    if (req.staff.role == user.role && user.id !== req.staff.id) {
      return next(
        new ErrorResponse(
          `Franchise  is not authorized to update`)
      );
    }

  } else if (req.staff.role == 'admin') {
    if (user.role == 'superadmin') {
      return next(
        new ErrorResponse(
          `Franchise  is not authorized to update`)
      );
    }

  } else if (user.id !== req.staff.id) {
    return next(
      new ErrorResponse(
        `Franchise  is not authorized to update`)
    );
  }

  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.status = req.body.status;
  user.phone = req.body.phone;

  //user.isNew = false;
  await user.save();
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc      Delete user
// @route     DELETE /api/v1/auth/users/:id
// @access    Private/Admin
exports.deleteFranchise = asyncHandler(async (req, res, next) => {
  const user = await Franchise.findById(req.params.id);

  // Make sure user is provider owner
  if (user.role === 'superadmin') {
    return next(
      new ErrorResponse(
        `Franchise is not authorized`)
    );
  }
  await Franchise.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});
// @desc      Update user
// @route     PUT /api/v1/auth/users/:id
// @access    Private/Admin
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { code, password, oldpass } = req.body;
  let user = req.staff;
  if (!user) {
    return next(
      new ErrorResponse(`Franchise  not found`)
    );
  }
  //  Make sure user is provider owner
  if (user.role === 'superadmin') {

    if (user.resetPasswordToken !== code) {
      return next(
        new ErrorResponse(`Invalid code`)
      );
    };

    user.password = req.body.password;


  } else {
    // Check for user
    user = await Franchise.findById(user._id).select('+password');

    if (!user) {
      return next(new ErrorResponse('Franchise not found'));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(oldpass);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials'));
    }

    user.password = req.body.password;

  }
  await user.save();
  res.status(200).json({
    success: true,
    data: user
  });
});