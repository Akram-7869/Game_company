const mongoose = require('mongoose');

const FilesSchema = new mongoose.Schema({
  data: Buffer, contentType: String,
  size: String,
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'

  },
  createdByName: {
    type: String
  },
  tag:{
     type: String
   },
   
  createdAt: {
    type: Date,
    default: Date.now
  }
},{timestamps: true});

module.exports = mongoose.model('Files', FilesSchema);