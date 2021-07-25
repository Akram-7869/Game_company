const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const BannerSchema = new mongoose.Schema({
    category: {
        type: String
    },
    image: {
        type: Array,
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