const mongoose = require("mongoose");

const guardSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
  },
  phone: {
    cell: String,
    home: String,
  },
  ssn: {
    type: Number,
    required: true,
    unique: true,
  },
  birthDate: { type: Date, default: Date.now },
  startDate: { type: Date, default: Date.now },
  dLicense: {
    blueCard: { type: Boolean, default: false },
    number: String,
    exp: { type: Date, default: Date.now },
  },
  gLicense: {
    acitveLicense: { type: Boolean, default: false },
    number: String,
    exp: { type: Date, default: Date.now },
  },
  ccw: {
    acitveLicense: { type: Boolean, default: false },
    number: String,
    exp: { type: Date, default: Date.now },
  },
  uniform: {
    polo: {
      hasIssued: {
        type: Boolean,
        default: true,
      },
      size: String,
    },
    jacket: {
      hasIssued: {
        type: Boolean,
        default: true,
      },
      size: String,
    },
  },
  badge: {
    hasIssued: { type: Boolean, default: false },
    barcode: String,
  },
  position: String,
  rating: String,
  shiftPref: {
    startTime: {
      type: Number,
      min: 0000,
      max: 2400,
    },
    endTime: {
      type: Number,
      min: 0000,
      max: 2400,
    },
  },
});

module.exports = mongoose.model("Guard", guardSchema);
