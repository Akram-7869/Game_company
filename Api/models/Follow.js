const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

 
const FollowSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Players'
  },
  influencerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Influencer'
  },
  
 
});

FollowSchema.plugin(dataTables)
module.exports = mongoose.model('PlayerGames', FollowSchema);