const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')
const NoticationSchema = new mongoose.Schema({ 
    playerId: {
        type: String,
         required:true
    },  
    bannerId: {
      type: mongoose.Schema.ObjectId,
    },
    read:{
      type:Boolean,
      default:false
    } 
}, {
    timestamps: true,
});

 
NoticationSchema.plugin(dataTables)
module.exports = mongoose.model('Notication', NoticationSchema);