const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables');
 
const CommissionSchema = new mongoose.Schema({
    franchiseId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Franchise'
    },
    influencerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Influencer'
    },
    
    playerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Players'
    },
    
    adminCommission: {
        type: Number,
        default:0
    },
    giftRecevied: {
        type: Number,
        default:0
    },
    influencerCommission: {
        type: Number,
        default:0
    },
    franchiseCommission: {
        type: Number,
        default:0
    },
     
    gameId: {
        type: String,
    },
    betTotal: {
        type: Number,
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: [ 'complete','processing'],
        default: 'processing'
    }

}, {
    timestamps: true,
});
 
CommissionSchema.plugin(dataTables);
module.exports = mongoose.model('commission', CommissionSchema);