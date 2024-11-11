import nodemailer from 'nodemailer';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  try {
    const { db } = await connectToDatabase();

    if (req.method === 'POST') {
      const { name, email, subject, message, replyToEmail } = req.body;

      // Logging the received data for debugging
      console.log('Received contact form data:', req.body);

      // If `replyToEmail` exists, it's a reply operation
      if (replyToEmail) {
        const emailConfig = await db.collection('emailConfig').findOne();
        if (!emailConfig) {
          return res.status(500).json({ error: 'Email configuration not found' });
        }

        console.log('Email config for reply:', emailConfig);

        const transporter = nodemailer.createTransport({
          host: emailConfig.smtpHost,
          port: emailConfig.smtpPort,
          auth: {
            user: emailConfig.user,
            pass: emailConfig.pass,
          },
        });

        const replyOptions = {
          from: `${emailConfig.fromName} <${emailConfig.user}>`,
          to: replyToEmail,
          subject: 'Reply to Your Contact Submission',
          text: message,
        };

        await transporter.sendMail(replyOptions);
        return res.status(200).json({ message: 'Reply sent successfully!' });
      }

      // Save contact form data to the contact-form collection
      await db.collection('contact-form').insertOne({
        name,
        email,
        subject,
        message,
        createdAt: new Date(),
      });

      // Retrieve email configuration
      const emailConfig = await db.collection('emailConfig').findOne();
      if (!emailConfig) {
        return res.status(500).json({ error: 'Email configuration not found' });
      }

      console.log('Email config for sending notifications:', emailConfig);

      const transporter = nodemailer.createTransport({
        host: emailConfig.smtpHost,
        port: emailConfig.smtpPort,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.pass,
        },
      });

      const mailOptionsAdmin = {
        from: `${emailConfig.fromName} <${emailConfig.user}>`,
        to: emailConfig.user,
        subject: `New Contact Form Submission: ${subject}`,
        text: `You have a new contact form submission from:
          Name: ${name}
          Email: ${email}
          Message: ${message}`,
      };

      const mailOptionsUser = {
        from: `${emailConfig.fromName} <${emailConfig.user}>`,
        to: email,
        subject: 'Thank you for contacting us!',
        text: `Hello ${name},
        Thank you for reaching out. We have received your message and will get back to you shortly.`,
      };

      try {
        await transporter.sendMail(mailOptionsAdmin);
        await transporter.sendMail(mailOptionsUser);
        return res.status(200).json({ message: 'Form data saved and emails sent successfully' });
      } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: 'Error sending email' });
      }

    } else if (req.method === 'GET') {
      const contacts = await db.collection('contact-form').find().toArray();
      return res.status(200).json({ success: true, data: contacts });

    } else if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id || !ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID provided' });
      }

      const result = await db.collection('contact-form').deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 1) {
        return res.status(200).json({ message: 'Contact form submission deleted successfully' });
      } else {
        return res.status(404).json({ error: 'Contact form submission not found' });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error processing the request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
