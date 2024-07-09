const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables');
const Player = require('../models/Player');
const moment = require('moment');

const TransactionsSchema = new mongoose.Schema({
    playerId: {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: 'Players'
    },
    referer_playerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Players'
    },
    couponId: {
        type: String,
    },
    membershipId: {
        type: String,
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
    taxableAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    tds: {
        type: Number,
        default: 0
    },
    gst: {
        type: Number,
        default: 0
    },
    stateCode: {
        type: String
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
    gateWayResponse: [],
    withdrawTo: {
        type: String,

    },

    paymentStatus: {
        type: String,
        default: 'PROCESSING'
    },
    adminCommision: {
        type: Number,
    },
    betNo: {
        type: Number,
        required: true,
        default: 0
    },
    gateWayCommision: {
        type: Number,
    },
    gateWayCommision: {
        type: Number,
    },
    logType: {
        type: String,
        enum: ['join', 'deposit', 'withdraw', 'game', 'won', 'bonus', 'payment', 'fees', 'adjustment', 'membership', 'reverse', 'refer_bonus'],
        required: true,
        default: 'game'
    },
    imageUrl: {
        type: String
    },
    withdraw: { type: Map },
    status: {
        type: String,
        enum: ['log', 'complete'],
        default: 'log'
    }

}, {
    timestamps: true,
});
//   winning
TransactionsSchema.methods.debitPlayerWinings = async function (amount) {
    return await Player.findByIdAndUpdate(this.playerId, { $inc: {balance: -amount,  winings: -amount } }, {
        new: true,
        runValidators: true
    });
};
TransactionsSchema.methods.creditPlayerWinings = async function (amount) {
    return await Player.findByIdAndUpdate(this.playerId, { $inc: { balance: amount, winings: amount } }, {
        new: true,
        runValidators: true
    });

};
//   Bonus
TransactionsSchema.methods.debitPlayerBonus = async function (amount) {
    return await Player.findByIdAndUpdate(this.playerId, { $inc: { bonus: -amount } }, {
        new: true,
        runValidators: true
    });
};
TransactionsSchema.methods.creditPlayerBonus = async function (amount) {
    return await Player.findByIdAndUpdate(this.playerId, { $inc: { bonus: amount } }, {
        new: true,
        runValidators: true
    });

};
// debit deposit
TransactionsSchema.methods.debitPlayerDeposit = async function (amount) {
    return await Player.findByIdAndUpdate(this.playerId, { $inc: { balance: -amount, deposit: -amount } }, {
        new: true,
        runValidators: true
    });
};
TransactionsSchema.methods.creditPlayerDeposit = async function (amount) {
    return await Player.findByIdAndUpdate(this.playerId, { $inc: { balance: amount,deposit: amount, totalDeposit: amount } }, {
        new: true,
        runValidators: true
    });

}; 

// withdraw player
TransactionsSchema.methods.declineWithDrawPlayer = async function (amount) {
    return await Player.findByIdAndUpdate(this.playerId, { $inc: {  winings: amount, 'totalTaxableAmount': -this.taxableAmount, 'totalTds': -this.tds, 'totalWithdraw': -amount } }, {
        new: true,
        runValidators: true
    })
};

TransactionsSchema.methods.memberShip = async function () {
    let fieldsToUpdate = {}
    if (this.membershipId === 'month') {
        var futureMonth = moment().add(1, 'M');
        fieldsToUpdate = { membership: 'vip', membership_expire: futureMonth, membership_amount: this.amount }
        return await Player.findByIdAndUpdate(this.playerId, fieldsToUpdate, {
            new: true,
            runValidators: true
        });
    } else if (this.membershipId === 'year') {

        var futureYear = moment().add(1, 'Y');
        fieldsToUpdate = { membership: 'vip', membership_expire: futureYear, membership_amount: this.amount }
        return await Player.findByIdAndUpdate(this.playerId, fieldsToUpdate, {
            new: true,
            runValidators: true
        });
    }

    return false;

};
TransactionsSchema.plugin(dataTables);
module.exports = mongoose.model('Transactions', TransactionsSchema);
