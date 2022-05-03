const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')
const NoticationSchema = new mongoose.Schema({
    title: {
        type: String
    },

    url: {
        type: String
    },
    message: {
        type: String
    },
    imageId: {
        type: mongoose.Schema.ObjectId,
    },
    status: {
        type: String,
        enum: ['inactive', 'active', 'processed'],
    },
    sendTo: {
        type: String,
        enum: ['all', 'player'],
    },

    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    }
}, {
    timestamps: true,
});

NoticationSchema.plugin(dataTables)
module.exports = mongoose.model('Notication', NoticationSchema);
