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

  gameOnline: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true,
});

PlayerGameSchema.plugin(dataTables)
module.exports = mongoose.model('PlayerGames', PlayerGameSchema);