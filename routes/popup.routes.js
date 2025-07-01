const express = require("express");
const router = express.Router();
const Lead = require("../models/Lead");
const sendWhatsAppMessage = require("../utils/sendWhatsAppMessage");
const sendEmail = require("../utils/sendEmail");

// POST /api/popup-lead
router.post("/popup-lead", async (req, res) => {
  const { fullName, phone, marketSegment, email } = req.body;

  if (!fullName || !phone || !marketSegment || !email) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const lead = new Lead({ fullName, phone, marketSegment, email });
    await lead.save();
    // ✅ Send WhatsApp Template
    await sendWhatsAppMessage(phone);
    await sendEmail({
      to: email,
      subject: "Welcome to Close Friends Traders!",
      text: `Welcome to Close Friends Traders, ${fullName}! Your account is now verified.`,
      html: `<p>Hi ${fullName},</p><p>Welcome aboard! Your account has been successfully verified.</p><p>Let's start your trading journey!</p>`,
    });

    res.status(201).json({
      message: "Your request has been received. We’ll contact you shortly.",
    });
  } catch (error) {
    console.error("Error saving lead:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// GET /api/popup-lead
router.get("/popup-lead", async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

module.exports = router;
