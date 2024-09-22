const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var dataTables = require('mongoose-datatables')

const InfluencerSchema = new mongoose.Schema({
  displayName: {
    type: String,

  },
  firstName: {
    type: String,

  },
  lastName: {
    type: String,

  },
  googleid: {
    type: String,

  },

  phone: {
    type: String,

  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    
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
    enum: ['influencer'],
    default: 'influencer'
  },
  password: {
    type: String,
    minlength: 6,
    select: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  totalBalance: {
    type: Number,
    default: 0,
    required:true

  },
  totalGifts: {
    type: Number,
    default: 0,
    required:true

  },
  totalCommissions: {
    type: Number,
    default: 0,
    required:true
  },
  totalWithdrawals: {
    type: Number,
    default: 0,
    required:true

  },
  totalBetAmount: {
    type: Number,
    default: 0,
    required:true

  },
  bank: {
    select: false,
    type: Map,
  },
  upi: {
    select: false,
    type: Map,
  },
  followCount: { type: Number, default: 0 }, // Optional Field
  profilePic: { type: String, default: '' }, // Optional Field
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
InfluencerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
InfluencerSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
InfluencerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
InfluencerSchema.methods.getResetPasswordToken = function () {
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




InfluencerSchema.plugin(dataTables);

module.exports = mongoose.model('Influencer', InfluencerSchema);
