const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')
const PlayerStatSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Player',

  },
  dailyWon: {
    type: Number,
    default: 0,
  },
  dailyPlayed: {
    type: Number,
    default: 0,
  },
  dailyRelaod: {
    type: Number,
    default: 0,
  }




}, {
  timestamps: true,
});

PlayerStatSchema.plugin(dataTables)
module.exports = mongoose.model('PlayerSats', PlayerStatSchema);