const express = require("express");
const router = express.Router();
const Lead = require("../models/Lead");
const sendWhatsAppOTP = require("../utils/sendWhatsAppOTP");
const sendEmail = require("../utils/sendEmail");
const sendWhatsAppMessage = require("../utils/sendWhatsAppOTP");

// POST /api/popup-lead/send-otp
router.post("/send-otp", async (req, res) => {
  const { fullName, phone, city, email, marketSegment } = req.body;
  if (!fullName || !phone || !city || !email || !marketSegment) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

  try {
    let lead = await Lead.findOne({ email });

    if (lead) {
      lead.fullName = fullName;
      lead.phone = phone;
      lead.city = city;
      lead.marketSegment = marketSegment;
      lead.otp = otp;
      lead.isVerified = false;
    } else {
      lead = new Lead({ fullName, phone, city, email, marketSegment, otp });
    }

    await lead.save();

    const waResult = await sendWhatsAppOTP(phone, otp);

    if (!waResult.success) {
      console.warn("WhatsApp OTP failed:", waResult.error || waResult.details);
    }

    res.status(200).json({ message: "OTP sent to your email and WhatsApp." });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP." });
  }
});

// POST /api/popup-lead/verify-otp
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required." });
  }

  try {
    const lead = await Lead.findOne({ email });
    if (!lead || lead.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP or email." });
    }

    lead.otp = null;
    lead.isVerified = true;
    await lead.save();
    await sendWhatsAppMessage(lead.phone);

    // Send welcome email
    await sendEmail({
      to: email,
      subject: "You’re In! Start Trading Smarter with Close Friends Traders",
      html: `
        <p>Hi ${lead.fullName},</p>
        <p>Welcome to <strong>Close Friends Traders</strong>!</p>
        <p>Your account is now verified. Here’s what’s next:</p>
        <ul>
          <li>Zero commission trading</li>
          <li>Advanced tools & real-time insights</li>
          <li>Fast deposits and withdrawals</li>
        </ul>
        <p>
          <a href="https://closefriendstraders.com/" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Start Trading Now</a>
        </p>
        <p>Need help? We’re available 24/7 at support@closefriendstraders.com</p>
        <p>– The Close Friends Traders Team</p>
      `,
    });

    res.status(201).json({
      message: "Your request has been received. We’ll contact you shortly.",
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ error: "Failed to verify OTP." });
  }
});

// GET /api/popup-lead
router.get("/popup-lead", async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// GET /api/popup-lead-graph
router.get("/popup-lead-graph", async (req, res) => {
  try {
    const data = await Lead.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }, // Group by date string
          },
          count: { $sum: 1 }, // Count number of leads per day
        },
      },
      { $sort: { _id: 1 } }, // Sort by date ascending
    ]);

    res.status(200).json(data); // Returns array of { _id: "YYYY-MM-DD", count: Number }
  } catch (error) {
    console.error("Error fetching lead graph data:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// PATCH /api/popup-lead/:id/check
router.patch("/popup-lead/:id/check", async (req, res) => {
  try {
    const { id } = req.params;
    const { isChecked } = req.body;

    const lead = await Lead.findByIdAndUpdate(id, { isChecked }, { new: true });

    if (!lead) {
      return res.status(404).json({ error: "Lead not found." });
    }

    res.status(200).json({
      message: `Lead marked as ${isChecked ? "checked" : "unchecked"}.`,
      lead,
    });
  } catch (error) {
    console.error("Error updating lead check status:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// DELETE /api/popup-lead/:id
router.delete("/popup-lead/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findByIdAndDelete(id);

    if (!lead) {
      return res.status(404).json({ error: "Lead not found." });
    }

    res.status(200).json({ message: "Lead deleted successfully.", lead });
  } catch (error) {
    console.error("Error deleting lead:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

module.exports = router;
