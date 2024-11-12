const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const WallPostSchema = new mongoose.Schema({
    
    url: {
        type: String
    },
    title: {
        type: String
    },
    imageId: {
        type: String
    },
    status: {
        type: String,
        enum: ['inactive', 'active'],
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

WallPostSchema.plugin(dataTables);
WallPostSchema.virtual('WallpostUrl').get(function () { return process.env.API_URI + '/files/' + this.imageId; })
module.exports = mongoose.model('Wallpost', WallPostSchema);