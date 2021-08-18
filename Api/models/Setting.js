const mongoose = require('mongoose');
var dataTables = require('mongoose-datatables')

const SettingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    many: {
        type: Array,
    },
    siteLogo: {
        type: mongoose.Schema.ObjectId,
        ref: 'File',
    },
    favicon: {
        type: mongoose.Schema.ObjectId,
        ref: 'File',
    },
    one: {},
    type: {
        type: String,
        required: true

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