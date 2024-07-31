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
    minBet: {
        type: Number
    },
    maxBet: {
        type: Number
    },
    tournamentType: {
        type: String,
        default: 'admin' //influencer,private ,
    },
    room: {
        type: String,
    },
    maxPayout: {
        type: Number
    },
    challLimit: {
        type: Number
    },
    potLimit: {
        type: Number
    },
    influencerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Influencer',
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