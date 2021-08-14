const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')
const PlayerGameSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Player'
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
    default: 'playing',
    enum: ['playing','won','lost']
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  amountWon: {
    type: Number,
    default: 0,
  },
  online: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true,
});

PlayerGameSchema.plugin(dataTables)
module.exports = mongoose.model('PlayerGames', PlayerGameSchema);