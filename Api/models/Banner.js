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
});

BannerSchema.plugin(dataTables)

module.exports = mongoose.model('Banners', BannerSchema);