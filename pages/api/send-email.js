import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { emails, subject, message } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0 || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  // Validate environment variables
  const { NEXT_PUBLIC_EMAIL_USER, NEXT_PUBLIC_EMAIL_PASS } = process.env;
  if (!NEXT_PUBLIC_EMAIL_USER || !NEXT_PUBLIC_EMAIL_PASS) {
    return res
      .status(500)
      .json({ success: false, message: 'Email configuration is missing in environment variables' });
  }

  try {
    // Configure the email transport using SMTP
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: NEXT_PUBLIC_EMAIL_USER, // Gmail account
        pass: NEXT_PUBLIC_EMAIL_PASS, // Gmail password
      },
    });

    // HTML Email Template
    const generateHTML = (recipient) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            background-color: #ffffff;
            margin: 50px auto;
            padding: 20px;
            width: 80%;
            border: 1px solid #ddd;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #ff0001;
            color: #ffffff;
            padding: 10px;
            text-align: center;
          }
          .content {
            padding: 20px;
          }
          .footer {
            background-color: #f4f4f4;
            color: #333;
            text-align: center;
            padding: 10px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${subject}</h1>
          </div>
          <div class="content">
            <p>Dear ${recipient},</p>
            <p>${message}</p>
            <p>Best regards,</p>
            <p><strong>YtTools Team</strong></p>
          </div>
          <div class="footer">
            &copy; 2024 YtTools. All Rights Reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to each recipient
    const sendEmailPromises = emails.map((email) =>
      transporter.sendMail({
        from: `"YTubeTools" <${NEXT_PUBLIC_EMAIL_USER}>`, // Sender
        to: email, // Recipient
        subject, // Subject line
        html: generateHTML(email), // HTML body
      })
    );

    // Await all email sending promises
    await Promise.all(sendEmailPromises);

    res.status(200).json({ success: true, message: 'Emails sent successfully' });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send emails. Please try again later.',
      error: error.message,
    });
  }
}
