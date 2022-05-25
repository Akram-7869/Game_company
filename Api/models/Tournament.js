const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const TournamentSchema = new mongoose.Schema({
    name: {
        type: String
    },
    mode: {
        type: Number
    },
    betAmount: {
        type: String
    },
    players: {
        type: Number
    },
    winner: {
        type: Number
    },
    winnerRow: {},
    time: {
        type: Number
    },
    bot: {
        type: Boolean,
        default: true
    },
    complexity: {
        type: Number
    },
    interval: {
        type: Number
    },
    bonusAmountDeduction: {
        type: Number,
        default: 0
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

TournamentSchema.plugin(dataTables)

module.exports = mongoose.model('Tournaments', TournamentSchema);