const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables');
const Player = require('../models/Player');

const TransactionsSchema = new mongoose.Schema({
    playerId: {
        type: mongoose.Schema.ObjectId,
        required: true,
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

    },
    withdrawDetail: {
        type: String,
        enum: ['PROCESSING', 'FAILED', 'SUCCESS', 'DECLINED'],
        default: 'PROCESSING'
    },
    paymentStatus: {
        type: String,

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
        enum: ['deposit', 'withdraw', 'game', 'won', 'bonus', 'payment', 'fees', 'adjustment', 'membership'],
        required: true,
        default: 'game'
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
// debit player
TransactionsSchema.methods.debitPlayerWinings = async function (amount) {
    return await Player.findByIdAndUpdate(this.playerId, { $inc: { balance: -amount, winings: -amount } }, {
        new: true,
        runValidators: true
    });
};
// debit player
TransactionsSchema.methods.debitPlayerBonus = async function (amount) {
    return await Player.findByIdAndUpdate(this.playerId, { $inc: { balance: -amount, bonus: -amount } }, {
        new: true,
        runValidators: true
    });
};
// debit player
TransactionsSchema.methods.debitPlayerDeposit = async function (amount) {
    return await Player.findByIdAndUpdate(this.playerId, { $inc: { balance: -amount, deposit: -amount } }, {
        new: true,
        runValidators: true
    });
};

// debit player
TransactionsSchema.methods.debitPlayer = async function (amount) {
    return await Player.findByIdAndUpdate(this.playerId, { $inc: { balance: -amount } }, {
        new: true,
        runValidators: true
    });
};

// cedit player
TransactionsSchema.methods.creditPlayer = async function (amount) {
    return await Player.findByIdAndUpdate(this.playerId, { $inc: { balance: amount } }, {
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
TransactionsSchema.methods.creditPlayerBonus = async function (amount) {
    return await Player.findByIdAndUpdate(this.playerId, { $inc: { bonus: amount, balance: amount, } }, {
        new: true,
        runValidators: true
    });

};
TransactionsSchema.methods.creditPlayerDeposit = async function (amount) {
    return await Player.findByIdAndUpdate(this.playerId, { $inc: { balance: amount, deposit: amount } }, {
        new: true,
        runValidators: true
    });

};
TransactionsSchema.methods.memberShip = async function () {
    let fieldsToUpdate = {}
    if (tran.membershipId === 'month') {
        var futureMonth = moment().add(1, 'M');
        fieldsToUpdate = { membership: 'vip', membership_expire: futureMonth }
        return await Player.findByIdAndUpdate(this.playerId, fieldsToUpdate, {
            new: true,
            runValidators: true
        });
    } else if (tran.membershipId === 'year') {

        var futureYear = moment().add(1, 'Y');
        fieldsToUpdate = { membership: 'vip', membership_expire: futureYear }
        return await Player.findByIdAndUpdate(this.playerId, fieldsToUpdate, {
            new: true,
            runValidators: true
        });
    }

    return false;

};
TransactionsSchema.plugin(dataTables);
module.exports = mongoose.model('Transactions', TransactionsSchema);
