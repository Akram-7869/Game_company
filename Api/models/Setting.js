const mongoose = require("mongoose");
var dataTables = require("mongoose-datatables");

const SettingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    many: {
      type: Array,
    },
    bank: {},
    upi: {},
    siteLogo: {
      type: String,
    },
    favicon: {
      type: String,
    },
    one: {},
    commission: {
      type: Number,
      default: 0,
    },
    games: [{ _id: Number, name: String }],
    tds: {
      type: Number,
      default: 0,
    },
    gst: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    active: {
      type: Boolean,
      default: true,
    },
    referral_commission: {
      type: Number,
      default: 0,
    },
    gift_commission: {
      type: Number,
      default: 50,
    },
    admin_referral_commission: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lvl1_commission: {
      type: Number,
      default: 0,
    },
    lvl2_commission: {
      type: Number,
      default: 0,
    },
    monthly_plan: {
      type: Number,
      default: 0,
    },
    yearly_plan: {
      type: Number,
      default: 0,
    },
    currency_symbol: {
      type: String,
      default: "INR",
    },
    rupees_value: {
      type: String,
    },
    dollor_value: {
      type: String,
    },
    
    minwithdraw: {
      type: Number,
      default: 0,
    },
    maxwithdraw: {
      type: Number,
      default: 500,
    },
    mindeposit: {
      type: Number,
      default: 0,
    },
    registerBonus: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

SettingSchema.plugin(dataTables);

module.exports = mongoose.model("Settings", SettingSchema);
