import nodemailer from 'nodemailer';

export async function sendBanEmail(email, username, reason) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // Use your email provider or a custom SMTP server
      auth: {
        user: process.env.NEXT_PUBLIC_EMAIL_USER, // Your email address
        pass: process.env.NEXT_PUBLIC_EMAIL_PASS, // Your email password
      },
    });

    const mailOptions = {
      from: process.env.NEXT_PUBLIC_EMAIL_USER,
      to: email,
      subject: 'Account Ban Notification',
      html: `
        <h3>Dear ${username},</h3>
        <p>We regret to inform you that your account has been banned due to the following reason:</p>
        <blockquote style="font-style: italic; color: #555;">${reason}</blockquote>
        <p>If you believe this was a mistake, please contact our support team.</p>
        <p>Best regards,<br/>Your Admin Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Ban email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send ban email:', error);
    throw new Error('Failed to send ban email');
  }
}
