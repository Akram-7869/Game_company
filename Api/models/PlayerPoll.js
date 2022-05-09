const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')
const PlayerPollSchema = new mongoose.Schema({

    playerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Player',

    },
    pollId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Poll',

    }



}, {
    timestamps: true,
});

PlayerPollSchema.plugin(dataTables)
module.exports = mongoose.model('PlayerPoll', PlayerPollSchema);
