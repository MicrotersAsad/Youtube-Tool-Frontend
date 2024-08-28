import nodemailer from 'nodemailer';
import { connectToDatabase } from '../../utils/mongodb'; // Assuming you have a MongoDB utility for connecting

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, email, subject, message } = req.body;

    try {
      // Connect to the database and retrieve the email configuration
      const { db } = await connectToDatabase();
      const emailConfig = await db.collection('emailConfig').findOne();

      if (!emailConfig) {
        return res.status(500).json({ error: 'Email configuration not found' });
      }

      // Configure the nodemailer transporter using dynamic SMTP settings
      const transporter = nodemailer.createTransport({
        host: emailConfig.smtpHost,
        port: emailConfig.smtpPort,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.pass,
        },
      });
console.log(transporter);

      // Admin email
      const mailOptionsAdmin = {
        from: `${emailConfig.fromName} <${emailConfig.user}>`,
        to: emailConfig.user,
        subject: `New Contact Form Submission: ${subject}`,
        text: `You have a new contact form submission from:
        
        Name: ${name}
        Email: ${email}
        Message: ${message}`,
      };

      // User thank you email
      const mailOptionsUser = {
        from: `${emailConfig.fromName} <${emailConfig.user}>`,
        to: email,
        subject: 'Thank you for contacting us!',
        text: `Hello ${name},
        
        Thank you for reaching out. We have received your message and will get back to you shortly.
        
        Best regards,
        YT Tools`,
      };

      // Send the emails
      await transporter.sendMail(mailOptionsAdmin);
      await transporter.sendMail(mailOptionsUser);

      res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Error sending email' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
