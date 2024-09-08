const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const DashboardSchema = new mongoose.Schema({
  type: { type: String, enum: ['franchise', 'influencer', 'admin'], required: true },
  totalBetAmount: { type: Number, default: 0 },
  totalWinningAmount: { type: Number, default: 0 },
  totalCommission: { type: Number, default: 0 },
   
 

}, {
  timestamps: true,
});

DashboardSchema.statics.totalIncome = async function (totalBetAmount, totalWinningAmount, totalCommission) {
  return await this.findOneAndUpdate({ type: 'admin' }, { $inc: {totalCommission, totalWinningAmount , totalBetAmount } });
};

DashboardSchema.plugin(dataTables);

module.exports = mongoose.model('Dashboards', DashboardSchema);