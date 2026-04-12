const { Resend } = require('resend');
const { google } = require('googleapis');
const { sendToHub } = require('./_ingest');

const resend = new Resend(process.env.RESEND_API_KEY);

async function appendToSheet(values) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Contact!A:D',
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, mobile, street, city, state, zip, message } = req.body || {};

  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const fullName = `${firstName} ${lastName}`;

  try {
    await resend.emails.send({
      from: 'Walker for PA <noreply@walkerforpa.com>',
      to: ['walkerforpa166@gmail.com', 'tom.galia@outlook.com'],
      replyTo: email,
      subject: `New Contact Message from ${fullName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Mobile:</strong> ${mobile || 'Not provided'}</p>
        <p><strong>Address:</strong> ${[street, city, state, zip].filter(Boolean).join(', ') || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p style="color:#666;font-size:12px">Submitted via walkerforpa.com contact form</p>
      `,
    });
  } catch (emailErr) {
    console.error('Resend error:', emailErr);
    return res.status(500).json({ error: 'Failed to send email' });
  }

  try {
    const timestamp = new Date().toISOString();
    await appendToSheet([timestamp, fullName, email, message]);
  } catch (sheetErr) {
    console.error('Google Sheets error:', sheetErr);
  }

  await sendToHub('contact', {
    first_name: firstName,
    last_name:  lastName,
    email,
    mobile,
    street,
    city,
    state: state || 'PA',
    zip,
  });

  return res.status(200).json({ success: true });
};
