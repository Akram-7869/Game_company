const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const TicketSchema = new mongoose.Schema({
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
history: {
    type: String
},
status: {
    type: String
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