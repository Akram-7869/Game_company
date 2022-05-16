const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var dataTables = require('mongoose-datatables')

const PlayerSchema = new mongoose.Schema({

  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  profilePic: {
    type: mongoose.Schema.ObjectId,
  },
  countryCode: {
    type: String,
    required: true,
  },
  country: {
    type: String,

  },
  registeredWith: {
    type: String,
    default: 'phone'
  },
  phone: {
    type: String,
    minLength: 8,
    trim: true,
    required: true,

  },
  email: {
    type: String,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ],

  },
  role: {
    type: String,
    enum: ['player'],
    default: 'player'
  },
  deviceType: {
    type: String
  },
  deviceId: {
    type: String
  },
  deviceToken: {
    type: String,
    select: false,
    trim: true,
    required: [true, 'Please provide device id']
  },
  firebaseToken: {
    type: String,
    select: false,
    trim: true,
  },
  firebaseId: {
    type: String,
    select: false,
    trim: true,

  },
  gamecode: {
    type: String
  },
  password: {
    type: String,
    minlength: 4,
    select: false
  },
  status: {
    type: String,
    enum: ['notverified', 'active', 'inactive', 'deleted', 'banned'],
  },
  resetPasswordToken: {
    type: String,
    minlength: 6,
    select: false
  },
  resetPasswordExpire: {
    type: Date,
    select: false
  },
  verifyPhone: {
    type: String,
    minlength: 4,
    select: false
  },
  verifyPhoneExpire: {
    type: Date,
    minlength: 6,
    select: false
  },
  balance: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  notificationRead: {
    type: Date,
    default: ''
  },

  aadharNumber: {
    type: String,
    select: false

  },
  panNumber: {
    type: String,
    select: false

  },
  dob: {
    type: String
  },
  lat: {
    type: String
  },
  long: {
    type: String
  },
  kycStatus: {
    type: String,
    enum: ['verified', 'notverified'],
    default: 'notverified'
  },
  wallet: {
    select: false,
    type: Map,

  },
  bank: {
    select: false,
    type: Map,
  },
  upi: {
    select: false,
    type: Map,
  },
  wonCount: {
    type: Number,
    default: 0

  },
  joinCount: {
    type: Number,
    default: 0

  },
  join_code: {
    type: String
  },
  refer_code: {
    type: String
  },
  level_1: {
    type: String
  },
  level_2: {
    type: String
  },
  deposit: {
    type: Number,
    default: 0,
    min: 0

  },
  winings: {
    type: Number,
    default: 0,
    min: 0

  },
  bonus: {
    type: Number,
    default: 0,
    min: 0

  },
  membership: {
    type: String,
    default: 'free'

  },
  membership_expire: {
    type: Date,
  },
  state: {
    type: String, default: ''
  },
  state: {
    type: Number,
    default: 0,
    min: 0
  },
  refer_count: {
    type: Number,
    default: 0,
    min: 0
  },
  refrer_level: {
    type: Number,
    default: 0,
    min: 0
  },
  refrer_amount_total: {
    type: Number,
    default: 0,
    min: 0
  },
});

// Encrypt password using bcrypt
PlayerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
PlayerSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
PlayerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
PlayerSchema.methods.getResetPasswordToken = function () {
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

PlayerSchema.methods.getPhoneExpire = function () {
  this.verifyPhoneExpire = Date.now() + 10 * 60 * 1000;
  return verifyPhone;
};
PlayerSchema.plugin(dataTables)
module.exports = mongoose.model('Players', PlayerSchema);
