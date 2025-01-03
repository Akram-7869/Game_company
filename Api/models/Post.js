const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const PostSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, required: true },
   
  userType: {
    type: String,
    enum: ['player', 'admin', 'influencer'],
    default: 'player'
  },

    displayName:{type: String},
    profileImage:{type: String},
    imageId: {type: String},
    description: { type: String },
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
module.exports = mongoose.model('Posts', PostSchema);