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
    showToAll: {
        type: Boolean,
        default: true,
        required: [true, 'Please provide showToAll']

    },
    useOnlyOnce: {
        type: Boolean,
        default: false,
        required: [true, 'Please provide useOnlyOnce']

    },
    usageLimit: {
        type: Number,
        default: 0
    },
    expiryDate: {
        type: Date
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