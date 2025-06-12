const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    Phone: { type: Number, required: true },
    otp: { type: String }, // Optional: stores current OTP
    isVerified: { type: Boolean, default: false }, // Tracks verification status
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
