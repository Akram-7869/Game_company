const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')
const PlayerNoticationSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Player',

  },
  notificationId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Notication',

  },

  read: { type: Boolean, default: false },



}, {
  timestamps: true,
});

PlayerNoticationSchema.plugin(dataTables)
module.exports = mongoose.model('PlayerNotication', PlayerNoticationSchema);
