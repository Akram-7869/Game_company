const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables');
 
const CommissionSchema = new mongoose.Schema({
    gameId: {
        type: String,
    },
    franchiseId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Franchise'
    },
    influencerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Influencer'
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