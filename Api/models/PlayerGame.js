const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')
const PlayerGameSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Players'
  },
  gameId: {
    type: String

  },
  tournamentId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tournaments'
  },
  influencerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Influencer'
  },
  franchiseId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Influencer'
  },
  gameType: {
    type: String,
    default: 'paid',
    enum: ['free', 'paid']
  },
  commissionStatus: {
    type: String,
    default: 'processing',
    enum: ['processing', 'processed']
  },
  gameStatus: {
    type: String,
    default: 'lost',
  },
  amountBet: {
    type: Number,
    default: 0,
  },
  amountWon: {
    type: Number,
    default: 0,
  },
  amountReverse: {
    type: Number,
    default: 0
  },
  amountPrize: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number,
    default: 0,
  },
  winner: {
    type: String,
    default: 'winner_1',
  },
  note: {
    type: String,
    default: '',
  },
  isBot: {
    type: Boolean,
    default: false
  },
  opponentName: {
    type: String,
    default: ''
  },
  amountGiven: {
    type: Number,
    default: 0
  },
  players: {},

}, {
  timestamps: true,
});

PlayerGameSchema.plugin(dataTables)
module.exports = mongoose.model('PlayerGames', PlayerGameSchema);