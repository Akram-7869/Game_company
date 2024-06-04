const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const BannertextSchema = new mongoose.Schema({
    location: {
        type: String
    },
    title: {
        type: String
    },
    status: {
        type: String,
        enum: ['inactive', 'active'],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

BannertextSchema.plugin(dataTables);
module.exports = mongoose.model('Bannertexts', BannertextSchema);