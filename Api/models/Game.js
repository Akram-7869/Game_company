const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const GameSchema = new mongoose.Schema({
    name: {
        type: String
    },
    version: {
        type: String
    },
    imageId: {
        type: String
    },
    packageId: {
        type: String
    },
    status: {
        type: String,
        enum: ['inactive', 'active'],
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

GameSchema.plugin(dataTables);
GameSchema.virtual('imageUrl').get(function () { return process.env.IMAGE_URL + this.imageId; })
GameSchema.virtual('packageUrl').get(function () { return process.env.IMAGE_URL  + this.packageId; })

module.exports = mongoose.model('GameManager', GameSchema);