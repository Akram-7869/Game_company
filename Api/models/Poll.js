const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const PollSchema = new mongoose.Schema({
    location: {
        type: String
    },
    url: {
        type: String
    },
    message: {
        type: String
    },
    imageId: {
        type: String
    },
    status: {
        type: String,
        enum: ['inactive', 'active'],
    },

    poll: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },


}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

PollSchema.plugin(dataTables);
PollSchema.virtual('PollUrl').get(function () { return process.env.API_URI + '/files/' + this.imageId; })
module.exports = mongoose.model('Polls', PollSchema);