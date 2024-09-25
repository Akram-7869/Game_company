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
  game: {
    type: Number,
    default: 0
  },
  
  influencerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Influencer'
  },
  stateCode: {
    type: String,
    default: ''
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
  amountGift: {
    type: Number,
    default: 0
  },
  adminGiftCommision: {
    type: Number,
    default: 0
  },
  winner: {
    type: String,
    default: 'winner_1',
  }
}, {
  timestamps: true,
});

PlayerGameSchema.plugin(dataTables)
module.exports = mongoose.model('PlayerGames', PlayerGameSchema);