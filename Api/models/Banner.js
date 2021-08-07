const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const BannerSchema = new mongoose.Schema({
    location: {
        type: String
    },
    url: {
        type: String
    },
    imageId: {
         type: mongoose.Schema.ObjectId,
    },
    status:{
        type: String,
        enum: [ 'inactive','active'],
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
let url=process.env.API_URL;
console.log('ggg',url);
BannerSchema.virtual('bannerUrl').get(function() { return process.env.API_URI + '/files/'+this.imageId; })
module.exports = mongoose.model('Banners', BannerSchema);