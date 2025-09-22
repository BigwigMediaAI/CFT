// sendWhatsAppMessage.js
const axios = require("axios");
require("dotenv").config();

async function sendWhatsAppMessage(phoneNumber) {
  const url =
    `https://dash.teleobi.com/api/v1/whatsapp/send/template?` +
    `apiToken=${process.env.TELEOBI_API_TOKEN}` +
    `&phone_number_id=${process.env.TELEOBO_NUMBER_ID}` +
    `&template_id=194036` +
    `&template_header_media_url=https%3A%2F%2Fbot-data.s3.ap-southeast-1.wasabisys.com%2Fupload%2F2025%2F6%2Fflowbuilder%2Fflowbuilder-131168-1751101602.jpeg` +
    `&template_quick_reply_button_values=%5B%22IrnmUbsThewnnzI%22%2C%22bqxfB46dIvDzOdE%22%2C%22zYhlMBonu2QYd4-%22%5D` +
    `&phone_number=${encodeURIComponent(phoneNumber)}`;

  try {
    const response = await axios.get(url);
    console.log("✅ WhatsApp template message sent:", response.data);
  } catch (error) {
    console.error(
      "❌ Failed to send WhatsApp message:",
      error.response?.data || error.message
    );
  }
}

module.exports = sendWhatsAppMessage;
