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

  },
  gameType: {
    type: String,
    default: 'paid',
    enum: ['free', 'paid']
  },
  gameStatus: {
    type: String,
    default: 'lost',
    enum: ['won', 'lost']
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  amountWon: {
    type: Number,
    default: 0,
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

  gameOnline: {
    type: Boolean,
    default: true
  },
  isBot: {
    type: Boolean,
    default: false
  },
  opponentName: {
    type: String,
    default: ''

  },

  players: {
    type: String,
  }

}, {
  timestamps: true,
});

PlayerGameSchema.plugin(dataTables)
module.exports = mongoose.model('PlayerGames', PlayerGameSchema);