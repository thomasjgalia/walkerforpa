const { Resend } = require('resend');
const { sendToHub } = require('./_ingest');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, mobile, street, city, state, zip } = req.body || {};

  if (!firstName || !lastName || !email || !street || !city || !zip) {
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
        <p><strong>Mobile:</strong> ${mobile || 'Not provided'}</p>
        <p><strong>Address:</strong> ${street}, ${city}, ${state || 'PA'} ${zip}</p>
        <hr>
        <p style="color:#666;font-size:12px">Submitted via walkerforpa.com yard sign request form</p>
      `,
    });
  } catch (emailErr) {
    console.error('Resend error:', emailErr);
    return res.status(500).json({ error: 'Failed to send email' });
  }

  await sendToHub('yard_sign', {
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
