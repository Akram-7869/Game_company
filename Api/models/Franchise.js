const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var dataTables = require('mongoose-datatables')

const FranchiseSchema = new mongoose.Schema({
  firstName: {
    type: String,

  },
  lastName: {
    type: String,

  },
  phone: {
    type: String,

  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  status: {
    type: String,
    enum: ['notverified', 'active', 'inactive', 'deleted'],
    default: 'notverified'
  },
  role: {
    type: String,
    enum: ['franchise'],
    default: 'franchise'
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  countryCode: {
    type: String,
  },
  totalBalance: {
    type: Number,
    default: 0
  },
  totalCommissions: {
    type: Number,
    default: 0
  },
  commissionPending: {
    type: Number,
    default: 0
  },
  stateCode: {
    type: String,
    required: true,
  },

  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
FranchiseSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
FranchiseSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
FranchiseSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
FranchiseSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};




FranchiseSchema.plugin(dataTables);

module.exports = mongoose.model('Franchise', FranchiseSchema);
