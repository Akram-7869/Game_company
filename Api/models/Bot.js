const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const BotSchema = new mongoose.Schema({
    complexity: {
        type: String
    },

    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    status: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true,
});

BotSchema.plugin(dataTables)

module.exports = mongoose.model('Bots', BotSchema);