const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  email: { type: String, required: true },
  marketSegment: { type: String, required: true },
  otp: { type: String, default: null }, // ✅ Store OTP
  isVerified: { type: Boolean, default: false }, // ✅ Track verification
  isChecked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Lead", leadSchema);
