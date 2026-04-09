const { Resend } = require('resend');
const { google } = require('googleapis');

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
    range: 'Volunteers!A:J',
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, phone, address, city, state, zip, interests } = req.body || {};

  if (!firstName || !lastName || !email || !zip) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await resend.emails.send({
      from: 'Walker for PA <noreply@walkerforpa.com>',
      to: ['walkerforpa166@gmail.com', 'tom.galia@outlook.com'],
      replyTo: email,
      subject: `New Volunteer Sign-Up: ${firstName} ${lastName}`,
      html: `
        <h2>New Volunteer Sign-Up</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Address:</strong> ${address || 'Not provided'}</p>
        <p><strong>City, State Zip:</strong> ${[city, state, zip].filter(Boolean).join(', ')}</p>
        <p><strong>Interests:</strong> ${interests && interests.length ? interests.map(i => `<br>&bull; ${i}`).join('') : 'None selected'}</p>
        <hr>
        <p style="color:#666;font-size:12px">Submitted via walkerforpa.com volunteer form</p>
      `,
    });
  } catch (emailErr) {
    console.error('Resend error:', emailErr);
    return res.status(500).json({ error: 'Failed to send email' });
  }

  try {
    const timestamp = new Date().toISOString();
    await appendToSheet([timestamp, firstName, lastName, email, phone || '', address || '', city || '', state || '', zip]);
  } catch (sheetErr) {
    // Log but don't fail the request — email already sent
    console.error('Google Sheets error:', sheetErr);
  }

  return res.status(200).json({ success: true });
};
