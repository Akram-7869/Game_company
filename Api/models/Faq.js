const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const FaqSchema = new mongoose.Schema({
    options: {type: String},
    gamename: {type: String},

    topic: { type: String },
    explaination: { type: String },
    status: { type: String },
  }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

FaqSchema.plugin(dataTables);
  
module.exports = mongoose.model('Faqs', FaqSchema);