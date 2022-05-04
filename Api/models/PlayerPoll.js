const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')
const PlayerPollSchema = new mongoose.Schema({

    playerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Player',

    },
    bannerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Banner',

    }



}, {
    timestamps: true,
});

PlayerPollSchema.plugin(dataTables)
module.exports = mongoose.model('PlayerPoll', PlayerPollSchema);
