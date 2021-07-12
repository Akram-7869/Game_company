const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const SettingSchema = new mongoose.Schema({
    name: {
        type: String
    },
    many: {
        type: Array,
    },
    one: {},
    type:{
        type: String,
      
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

SettingSchema.plugin(dataTables)

module.exports = mongoose.model('Settings', SettingSchema);