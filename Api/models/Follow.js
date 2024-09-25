const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

 
const FollowSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Players',
    required:true
  },
  influencerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Influencer',
    required:true
  },
  
 
});

FollowSchema.plugin(dataTables)
module.exports = mongoose.model('PlayerInfluencer', FollowSchema);