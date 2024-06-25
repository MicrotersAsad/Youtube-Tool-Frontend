import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { emails, subject, message } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0 || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    // Configure the email transport using the default SMTP transport and a Gmail account.
    let transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.NEXT_PUBLIC_EMAIL_USER, // your Gmail account
        pass: process.env.NEXT_PUBLIC_EMAIL_PASS, // your Gmail password
      },
    });

    // Send mail to each recipient
    const sendEmailPromises = emails.map((email) =>
      transporter.sendMail({
        from: `"YtTools" <${process.env.NEXT_PUBLIC_EMAIL_USER}>`, // sender address
        to: email, // recipient address
        subject: subject, // Subject line
        text: message, // plain text body
      })
    );

    // Await all email sending promises
    await Promise.all(sendEmailPromises);

    res.status(200).json({ success: true, message: 'Emails sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
}
