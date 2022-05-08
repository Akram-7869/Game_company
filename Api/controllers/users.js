const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');

// @desc      Get all users
// @route     GET /api/v1/auth/users
// @access    Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  User.dataTables({
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
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc      Create user
// @route     POST /api/v1/auth/users
// @access    Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  if (req.body.role === 'superadmin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update provider ${provider._id}`)
    );
  }
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc      Update user
// @route     PUT /api/v1/auth/users/:id
// @access    Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorResponse(`User  not found`)
    );
  }
  //  Make sure user is provider owner
  if (req.staff.role == 'superadmin') {
    if (req.staff.role == user.role && user.id !== req.staff.id) {
      return next(
        new ErrorResponse(
          `User  is not authorized to update`)
      );
    }

  } else if (req.staff.role == 'admin') {
    if (user.role == 'superadmin') {
      return next(
        new ErrorResponse(
          `User  is not authorized to update`)
      );
    }

  } else if (user.id !== req.staff.id) {
    return next(
      new ErrorResponse(
        `User  is not authorized to update`)
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
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  // Make sure user is provider owner
  if (user.role === 'superadmin') {
    return next(
      new ErrorResponse(
        `User is not authorized`)
    );
  }
  await User.findByIdAndDelete(req.params.id);

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
  const user = req.staff;
  if (!user) {
    return next(
      new ErrorResponse(`User  not found`)
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
    const user = await User.findById(user._id).select('+password');

    if (!user) {
      return next(new ErrorResponse('User not found'));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(oldpass);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials'));
    }

    user.password = req.body.password;

  }


  //user.isNew = false;
  await user.save();
  res.status(200).json({
    success: true,
    data: user
  });
});