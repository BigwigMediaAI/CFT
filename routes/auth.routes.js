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
      subject: "Your Trading Journey Begins — Let’s Maximize Your Profits! 🚀",
      text: "Welcome to Close Friends Traders! You've taken the first step toward smarter trading. Log in and start trading today!",
      html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <p>Hello ${fullName},</p>
              <p>
                Welcome to <strong>Close Friends Traders</strong>! 🎯<br/>
                You've just taken the first step toward smarter, more profitable trading. 💹
              </p>
              <ul>
                      <li>✅ Real-time market insights</li>
                      <li>✅ Expert trading strategies</li>
                      <li>✅ Exclusive tools to spot opportunities</li>
                      <li>✅ Fast & secure transactions</li>
              </ul>             
                <p>
        💡 <strong>Start exploring today and unlock your trading potential!</strong>
                </p>              
                <p>
        👉 <a href="https://trading-two-kappa.vercel.app/login" style="color: #1d4ed8; text-decoration: underline;">Log In & Start Trading Now</a>
                </p>   
                <p>
        Need help getting started? Our team is here to guide you every step of the way. 📞📩
      </p>        
            <p style="margin-top: 30px;">Let’s grow your portfolio together! 🌱📊</p>
                
            <div style="margin-top: 40px; text-align: center;">
        <img src="https://closefriendstraders.com/wp-content/uploads/2024/09/logo-01.svg" alt="CFT Logo" width="150" style="margin-bottom: 10px;" />
        <p style="font-size: 14px; color: #888;">Team<br/>Close Friends Traders<br/>Your trusted trading partner</p>
      </div>
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
