const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const CouponSchema = new mongoose.Schema({
    name: {
        type: String
    },
    couponType: {
        type: String,
        enum: ['bonus', 'upi']
    },
    calculateType: {
        type: String,
        enum: ['fixed', 'percentage']
    },
    description: {
        type: String
    },
    minAmount: {
        type: Number,
        default: 0

    },
    maxAmount: {
        type: Number,
        default: 0

    },
    couponAmount: {
        type: Number,
        default: 0
    },

    couponImage: {
        type: mongoose.Schema.ObjectId,
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    active: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true,
});

CouponSchema.plugin(dataTables)

module.exports = mongoose.model('Coupons', CouponSchema);