const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, phone, address, city, zip } = req.body || {};

  if (!firstName || !lastName || !email || !address || !city || !zip) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await resend.emails.send({
      from: 'Walker for PA <noreply@walkerforpa.com>',
      to: ['walkerforpa166@gmail.com', 'tom.galia@outlook.com'],
      replyTo: email,
      subject: `Yard Sign Request: ${firstName} ${lastName}`,
      html: `
        <h2>New Yard Sign Request</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Address:</strong> ${address}, ${city}, PA ${zip}</p>
        <hr>
        <p style="color:#666;font-size:12px">Submitted via walkerforpa.com yard sign request form</p>
      `,
    });
  } catch (emailErr) {
    console.error('Resend error:', emailErr);
    return res.status(500).json({ error: 'Failed to send email' });
  }

  return res.status(200).json({ success: true });
};
