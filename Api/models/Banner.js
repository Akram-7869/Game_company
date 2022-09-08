const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const BannerSchema = new mongoose.Schema({
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
    bannerType: {
        type: String,
        default: 'banner'
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

BannerSchema.plugin(dataTables);
BannerSchema.virtual('bannerUrl').get(function () { return process.env.API_URI + '/files/' + this.imageId; })
module.exports = mongoose.model('Banners', BannerSchema);