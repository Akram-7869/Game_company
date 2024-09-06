const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables');
const CommissionSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    userType: { type: String, enum: ['franchise', 'influencer', 'admin'], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true }, // FranchiseId, InfluencerId, or 'admin'
    stateCode: { type: String }, // Only for franchises
    totalBetAmount: { type: Number, default: 0 },
    gift: { type: Number, default: 0 },
    totalWinningAmount: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
});

CommissionSchema.plugin(dataTables);
module.exports = mongoose.model('DateWiseReport', CommissionSchema);