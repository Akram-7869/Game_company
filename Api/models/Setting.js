const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const SettingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    many: {
        type: Array,
    },
    bank: {},
    upi: {},
    siteLogo: {
        type: String,

    },
    favicon: {
        type: String,
    },
    one: {},
    commission: {
        type: Number,
        default: 0,
    },
    tds: {
        type: Number,
        default: 0,
    },
    gst: {
        type: Number,
        default: 0,
    },
    type: {
        type: String,
        required: true

    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    active: {
        type: Boolean,
        default: true
    },
    referral_commission: {
        type: Number,
        default: 0
    },
    admin_referral_commission: {
        type: Number,
        default: 0
    },
    lvl1_commission: {
        type: Number,
        default: 0
    },
    lvl2_commission: {
        type: Number,
        default: 0
    }, monthly_plan: {
        type: Number,
        default: 0
    }, yearly_plan: {
        type: Number,
        default: 0
    }, currency_symbol: {
        type: String,
        default: 'INR'
    }, minwithdraw: {
        type: Number,
        default: 0
    },mindeposit:{
        type: Number,
        default: 0
    }

}, {
    timestamps: true,
});

SettingSchema.plugin(dataTables)

module.exports = mongoose.model('Settings', SettingSchema);