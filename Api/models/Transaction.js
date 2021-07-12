const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')
const TransactionsSchema = new mongoose.Schema({
     
    playerId: {
        type: String,
         required:true
    },
    amount: {
        type: Number,
         required:true
    },

    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      
    },
    transactionType:{
         type: String,
          enum: ['credit','debit'],
          required:true,
    },
    createdByName: {
        type: String
    },
    note: {
        type: String,
        required:true
    },
    prevBalance:{
        type: Number,
        required:true
    },
    paymentId:{
        type: mongoose.Schema.ObjectId,  
    }

}, {
    timestamps: true,
});

 
TransactionsSchema.plugin(dataTables)
module.exports = mongoose.model('Transactions', TransactionsSchema);