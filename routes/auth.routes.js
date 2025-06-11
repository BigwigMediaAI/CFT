const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendWelcomeMessage = require("../utils/sendWhatsAppMessage");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();
const JWT_SECRET = "your_secret_key"; // Replace with env var in production

// Sign Up
router.post("/signup", async (req, res) => {
  const { fullName, email, password, Phone } = req.body;

  if (!fullName || !email || !password || !Phone) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ error: "Email already in use." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ fullName, email, password: hashedPassword, Phone });
    await user.save();
    await sendEmail({
      to: email,
      subject: "🎉 You are subscribed to our Newsletter",
      text: "Thank you for subscribing",
      html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2>✅ Subscription Confirmed</h2>
              <p>Hi there,</p>
              <p>Thank you for subscribing to our newsletter We'll keep you updated with the latest news, offers, and insights.</p>
              <hr style="margin: 20px 0;" />
              <p style="font-size: 14px; color: #888;">If you didn’t subscribe, please ignore this email.</p>
              <p>Best regards,<br>The Team</p>
            </div>
          `,
    });
    await sendWelcomeMessage(Phone);

    res.status(201).json({ message: "Signup successful.", fullName, email });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required." });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials." });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ message: "Login successful", token, user });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

router.get("/allUser", async (req, res) => {
  try {
    const user = await User.find().sort({ createdAt: -1 });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});
module.exports = router;
