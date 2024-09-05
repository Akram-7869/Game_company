const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const DashboardSchema = new mongoose.Schema({
  userType: { type: String, enum: ['franchise', 'influencer', 'admin'], required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'userType', required: true }, // Dynamic reference
  stateCode: { type: String }, // Required for franchises
  totalBetAmount: { type: Number, default: 0 },
  totalWinningAmount: { type: Number, default: 0 },
  totalCommission: { type: Number, default: 0 },
  startDate: { type: Date, required: true }, // Start date of the aggregation period
  endDate: { type: Date, required: true }, // End date of the aggregation period
  lastUpdated: { type: Date, default: Date.now } // Track when the document was last updated

}, {
  timestamps: true,
});

DashboardSchema.statics.totalIncome = async function (betAmount, winAmount, commision) {
  return await this.findOneAndUpdate({ type: 'dashboard' }, { $inc: { totalIncome: commision, winAmount, betAmount } }, {
    new: true,
    runValidators: true
  });
};

DashboardSchema.plugin(dataTables);

module.exports = mongoose.model('Dashboards', DashboardSchema);