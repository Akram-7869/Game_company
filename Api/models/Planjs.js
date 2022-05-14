const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const PlanSchema = new mongoose.Schema({
  name: {
    type: String
  },
  planType: {
    type: String,
    enum: ['month', 'year', 'day']
  },
  plan: {
    type: number

  },
  description: {
    type: String
  },
  planAmount: {
    type: Number
  },

  planImage: {
    type: mongoose.Schema.ObjectId,
  },
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

PlanSchema.plugin(dataTables)

module.exports = mongoose.model('Plans', PlanSchema);