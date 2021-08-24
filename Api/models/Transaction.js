const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables');
const Player = require('../models/Player');

const TransactionsSchema = new mongoose.Schema({
    playerId: {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: 'Players'
    },
    gameId: {
        type: String,
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    paymentGateway: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',

    },
    transactionType: {
        type: String,
        enum: ['credit', 'debit'],
        required: true,
    },
    createdByName: {
        type: String
    },
    note: {
        type: String,
        required: true
    },
    prevBalance: {
        type: Number,
        required: true
    },
    paymentId: {
        type: String,
    },
    gateWayResponse: {
        type: Map
    },
    withdrawTo: {
        type: String,
        enum: ['BANK', 'WALLET', 'UPI', 'LOCALWALLET'],
        default: 'PROCESSING'
    },
    withdrawDetail: {
        type: String,
        enum: ['PROCESSING', 'FAILED', 'SUCCESS', 'DECLINED'],
        default: 'PROCESSING'
    },
    paymentStatus: {
        type: String,
        enum: ['PROCESSING', 'FAILED', 'SUCCESS', 'DECLINED'],
        default: 'PROCESSING'
    },
    adminCommision: {
        type: Number,
    },
    gateWayCommision: {
        type: Number,
    },
    logType: {
        type: String,
        enum: ['withdraw', 'payment', 'game', 'join', 'won', 'fees', 'bounus', 'adjustment'],
        required: true,
        default: 'game'
    },
    status: {
        type: String,
        enum: ['log', 'complete'],
        default: 'log'
    }

}, {
    timestamps: true,
});


// Generate and hash password token
TransactionsSchema.methods.debitPlayer = async function (amount) {
    return await Player.findByIdAndUpdate(this.playerId, { $inc: { balance: -amount } }, {
        new: true,
        runValidators: true
    });
};

// Generate and hash password token
TransactionsSchema.methods.creditPlayer = async function (amount) {
    return await Player.findByIdAndUpdate(this.playerId, { $inc: { balance: amount } }, {
        new: true,
        runValidators: true
    });

};
TransactionsSchema.plugin(dataTables);
module.exports = mongoose.model('Transactions', TransactionsSchema);