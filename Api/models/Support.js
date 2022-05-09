const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const SupportSchema = new mongoose.Schema({
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

SupportSchema.plugin(dataTables)
module.exports = mongoose.model('Supports', SupportSchema);