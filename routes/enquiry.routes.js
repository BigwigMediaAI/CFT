const express = require("express");
const router = express.Router();
const enquirySchema = require("../models/chatbot.model");
const sendEmail = require("../utils/sendEmail");
const OpenAI = require("openai");
require("dotenv").config();
const authenticateUser = require("../middlewares/authMiddleware"); // add this

const openai = new OpenAI(process.env.OPENAI_API_KEY);

const companyInfo = `
**About Granth Dream Homes**
Granth Dream Homes LLP is a luxury-focused real estate company based in Goa, India. Originating from our successful parent company, Mondus Properties in Dubai (with over $5B in sales), we bring international standards, unmatched expertise, and client-first values to India's property landscape.

**Why Choose Us**
- Trusted expertise from Dubai to India with 7+ years of experience
- Clear, transparent, and ethical real estate processes
- Commitment to excellence in design, location, and quality
- Tailored solutions for every buyer – from homeowners to investors

**Our Services**
1. **Luxury Residential Sales**: Helping clients buy dream homes in Goa’s most desired areas.
2. **Property Management**: Complete maintenance and rental support for your property.
3. **Investment Advisory**: Expert guidance on high-yield real estate investments in Goa.
4. **Vacation Homes & Rentals**: Turn properties into income-generating assets.
5. **Custom Villa Projects**: Build luxurious bespoke villas with top-tier craftsmanship.

**Vision**
To redefine the real estate experience in Goa by delivering luxury, comfort, and trust to every client.

**Target Clients**
- First-time buyers
- NRI investors
- Holiday home seekers
- Institutional investors
`;

// POST /api/prompt/submit
router.post("/enquiry", async (req, res) => {
  const { name, phone, email, message } = req.body;

  if (!name || !phone || !email || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const existing = await enquirySchema.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already exist" });
    }

    const Enquiry = new enquirySchema({ name, phone, email, message });
    await Enquiry.save();
    // Send confirmation email
    await sendEmail({
      to: email,
      subject: "📬 Thank You for Submitting Your Details",
      text: "We've received your information and will get back to you shortly.",
      html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2>✅ Details Received</h2>
      <p>Hi there,</p>
      <p>Thank you for submitting your details. We've received your information successfully.</p>
      <p>Our team will review your query and get in touch with you shortly.</p>
      <hr style="margin: 20px 0;" />
      <p style="font-size: 14px; color: #888;">If you didn't fill out a form recently, you can safely ignore this email.</p>
      <p>Best regards,<br>The Team</p>
    </div>
  `,
    });

    return res.status(200).json({ message: "Form submitted and saved." });
  } catch (error) {
    console.error("Error saving prompt:", error);
    return res.status(500).json({ error: "Failed to save form." });
  }
});

// ChatBot initialization starts here

const ChatbotModel = require("../models/chatbot.model");

router.post("/chatbot", authenticateUser, async (req, res) => {
  const { message } = req.body;
  const user = req.user;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const prompt = `
You are a helpful chatbot for Granth Dream Homes, a luxury real estate company in Goa.

This user is logged in:
- Name: ${user.fullName}
- Email: ${user.email}

Company Info:
${companyInfo}

User Question: ${message}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful real estate assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const reply =
      response.choices[0].message.content.trim() ||
      "Sorry, I couldn’t find an answer.";

    // Save to DB with user info
    await ChatbotModel.create({
      userMessage: message,
      botReply: reply,
    });

    res.json({ reply, userName: user.fullName }); // 👈 send name to frontend
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({ error: "Something went wrong with the chatbot." });
  }
});

router.get("/chatbot", async (req, res) => {
  try {
    const chats = await ChatbotModel.find().sort({ createdAt: -1 }); // latest first
    res.json(chats);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch chat history." });
  }
});

module.exports = router;
