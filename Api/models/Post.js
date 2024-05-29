const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const PostSchema = new mongoose.Schema({
    player: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    imageId: {type: String},
    caption: { type: String },
    status: { type: String },

    likes: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

PostSchema.plugin(dataTables);
PostSchema.virtual('postUrl').get(function () { return process.env.API_URI  + this.imageId; });
module.exports = mongoose.model('Posts', PostSchema);