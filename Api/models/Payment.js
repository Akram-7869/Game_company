const mongoose = require('mongoose');
const PaymentsSchema = new mongoose.Schema({ 
    orderCurrency:{
         type: String,
                enum: ['INR'],
         default:'gettoken'
    },
    token:{
           type: String
    },
    playerId: {
        type: String,
         required:true
    },
    orderAmount: {
        type: Number,
         required:true
    },

    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      
    },
    gatewayStatus:{
        type: String,
        enum: ['gettoken','debit'],
        default:'gettoken'
   },
    status:{
         type: String,
         enum: ['gettoken','debit'],
         default:'gettoken'
    },
    createdByName: {
        type: String
    },
    note: {
        type: String,
        required:true
    },
     
}, {
    timestamps: true,
});

 
PaymentsSchema.plugin(dataTables);
module.exports = mongoose.model('Payments', PaymentsSchema);