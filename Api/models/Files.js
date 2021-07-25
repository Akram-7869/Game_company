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
  quizId: {
    type: mongoose.Schema.ObjectId
  },
  groupId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Group',
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
},{timestamps: true});





exports.Files= mongoose.model('Files', FilesSchema);
exports.FilesBackup= mongoose.model('FilesBackup', FilesSchema);
exports.FilesTempBackup= mongoose.model('FilesTempBackup', FilesSchema);