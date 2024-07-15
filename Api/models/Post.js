const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const PostSchema = new mongoose.Schema({
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Players', required: true },
    imageId: {type: String},
    caption: { type: String },
    status: { type: String },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Players' }],
    comments: [{ player: { type: mongoose.Schema.Types.ObjectId, ref: 'Players' }, content: String, createdAt: { type: Date, default: Date.now } }],
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

PostSchema.plugin(dataTables);
PostSchema.virtual('postUrl').get(function () { return process.env.API_URI  + this.imageId; });
PostSchema.virtual('likeCount').get(function() {
    return this.likes.length;
  });
  
  PostSchema.virtual('commentCount').get(function() {
    return this.comments.length;
  });
module.exports = mongoose.model('Posts', PostSchema);