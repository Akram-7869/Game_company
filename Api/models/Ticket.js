const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const TicketSchema = new mongoose.Schema({
    playerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Players'
    },
    name: {
        type: String
    },
    email: {
        type: String
    },
    phone: {
        type: String
    },
    subject: {
        type: String
    },
    description: {
        type: String
    },
    history: [{ reply: '', from: '', dated: { type: Date, default: mongoose.now } }],
    status: {
        type: String,
        default: 'open',
        enum: ['close', 'open', 'pending']
    },
    ticketImage: {
        type: mongoose.Schema.ObjectId,
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    }

}, {
    timestamps: true,
});

TicketSchema.plugin(dataTables)

module.exports = mongoose.model('Tickets', TicketSchema);