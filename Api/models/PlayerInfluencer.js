const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

 
const PlayerInfluencerSchema = new mongoose.Schema({
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

PlayerInfluencerSchema.plugin(dataTables)
module.exports = mongoose.model('PlayerInfluencer', PlayerInfluencerSchema);