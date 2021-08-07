const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')
const NoticationSchema = new mongoose.Schema({ 
    playerId: {
        type: String,
         required:true
    },
    text: {
      type: String,
       required:true
    },
    imageId: {
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