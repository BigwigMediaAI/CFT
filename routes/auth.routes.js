const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const sendWelcomeMessage = require("../utils/sendWhatsAppMessage");

const router = express.Router();
const JWT_SECRET = "your_secret_key"; // Use env variable in production

// Utility to generate OTP
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const otpStore = new Map(); // Temporary in-memory store for OTPs

router.post("/send-otp", async (req, res) => {
  const { email, Phone, fullName } = req.body;

  if (!email || !Phone || !fullName)
    return res
      .status(400)
      .json({ error: "Full name, email, and phone are required." });

  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.isVerified) {
    return res.status(400).json({ error: "Email already in use." });
  }

  const otp = generateOtp();

  // Store in memory (or use Redis for production)
  otpStore.set(email, { otp, fullName, Phone });

  // Send OTP via email
  await sendEmail({
    to: email,
    subject: "Email Verification - Close Friends Traders",
    text: `Your OTP is: ${otp}`,
    html: `<p>Hi ${fullName},</p><p>Your OTP is: <strong>${otp}</strong></p><p>Use this to complete your signup.</p>`,
  });

  res.json({ message: "OTP sent to your email." });
});

// ✅ Step 1: Send OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password)
    return res
      .status(400)
      .json({ error: "Email, OTP, and password required." });

  const storedData = otpStore.get(email);
  if (!storedData || storedData.otp !== otp) {
    return res.status(400).json({ error: "Invalid or expired OTP." });
  }

  const { fullName, Phone } = storedData;
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    email,
    Phone,
    fullName,
    password: hashedPassword,
    isVerified: true,
  });

  await newUser.save();
  otpStore.delete(email); // Clear temp store

  await sendWelcomeMessage(Phone);
  await sendEmail({
    to: email,
    subject: "Welcome to Close Friends Traders!",
    text: `Welcome to Close Friends Traders, ${fullName}! Your account is now verified.`,
    html: `<p>Hi ${fullName},</p><p>Welcome aboard! Your account has been successfully verified.</p><p>Let's start your trading journey!</p>`,
  });

  res.status(201).json({ message: "Signup and verification successful." });
});

// ✅ Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required." });

  const user = await User.findOne({ email });

  if (!user || !user.isVerified)
    return res
      .status(401)
      .json({ error: "Account not verified or doesn't exist." });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: "Invalid credentials." });

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1d" });

  res.json({ message: "Login successful", token, user });
});

// ✅ Get All Users
router.get("/allUser", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
