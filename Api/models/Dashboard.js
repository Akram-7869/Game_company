const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const DashboardSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
    default: 'dashboard'
  },
  totalPlayers: {
    type: Number,
    default: 0,
  },
  totalIncome: {
    type: Number,
    default: 0,
  },
  grossIncome: {
    type: Number,
    default: 0,
  },
  totalPayoutRequest: {
    type: Number,
    default: 0,
  },
  livePlayers: {
    type: Number,
    default: 0,
  },
  totalSupportTicket: {
    type: Number,
    default: 0,
  },
  chartType: {
    type: String,
    default: 'daily_game'
  },
  chartData: [
    { lables: '', data: '', key: '' }
  ],


  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  active: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true,
});

DashboardSchema.statics.totalIncome = async function (amount) {
  return await this.findOneAndUpdate({ type: 'dashboard' }, { $inc: { totalIncome: amount } }, {
    new: true,
    runValidators: true
  });
};

DashboardSchema.plugin(dataTables);

module.exports = mongoose.model('Dashboards', DashboardSchema);