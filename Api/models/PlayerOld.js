const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var dataTables = require('mongoose-datatables')

const PlayerOldSchema = new mongoose.Schema({

    firstName: {
        type: String,

    },
    lastName: {
        type: String,
    },
    gender: {
        type: String,

    },
    profilePic: {
        type: mongoose.Schema.ObjectId,
    },
    picture: {
        type: String,
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
        default: 'email'
    },
    phone: {
        type: String,
        minLength: 8,
        trim: true,

    },
    email: {
        type: String,
        trim: true,
        required: [true, 'Please add an email'],
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

    refrer_player_id: {
        type: mongoose.Schema.ObjectId,
    },
    refer_code: {
        type: String,
        select: false
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
    membership_amount: {
        type: Number


    },
    membership_expire: {
        type: Date,
    },
    state: {
        type: String, default: ''
    },
    refer_count: {
        type: Number,
        default: 0,
        min: 0
    },
    refer_lvl1_count: {
        type: Number,
        default: 0,
        min: 0
    },
    refer_lvl2_count: {
        type: Number,
        default: 0,
        min: 0
    },
    refer_lvl1_total: {
        type: Number,
        default: 0,
        min: 0
    },
    refer_lvl2_total: {
        type: Number,
        default: 0,
        min: 0
    },
    refrer_level: {
        type: Number,
        default: 0,
        min: 0
    },
    refrer_amount_total: { type: Number, default: 0, min: 0 },
    refer_deposit_count: { type: Number, default: 0, min: 0 },
    refer_vip_count: { type: Number, default: 0, min: 0 },
});

PlayerOldSchema.plugin(dataTables)
module.exports = mongoose.model('Players2', PlayerOldSchema);
