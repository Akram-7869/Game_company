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
    commission: {
        type: Number,
        default: 20,


    },
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
    },
    level_1: {
        type: Number,
        default: 5
    }

}, {
    timestamps: true,
});

SettingSchema.plugin(dataTables)

module.exports = mongoose.model('Settings', SettingSchema);