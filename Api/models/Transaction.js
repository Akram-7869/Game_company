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
    currency:{
        type:String,
        default:'INR'
    },
    paymentGateway:{
        type:String
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
        type: String, 
    },
    gateWayResponse:{
        type:Map 
    },
    paymentStatus:{
        type: String,
        enum: ['PROCESSING','FAILED','SUCCESS','DECLINED'],   
        default:'PROCESSING'
    },
    logType:{
        type: String,
          enum: ['withdraw','payment', 'game'],
          required:true,
          default:'game'
    },
    status:{
        type:String,
        enum:['log','complete'],
        default:'log'
    }

}, {
    timestamps: true,
});

 
TransactionsSchema.plugin(dataTables)
module.exports = mongoose.model('Transactions', TransactionsSchema);