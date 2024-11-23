import nodemailer from 'nodemailer';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req, res) {
  try {
    const { db } = await connectToDatabase();

    if (req.method === 'POST') {
      const { name, email, subject, message, replyToEmail } = req.body;

      console.log('Received contact form data:', req.body);

      // Reply to a user
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
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  background-color: #f9f9f9;
                  margin: 0;
                  padding: 0;
                  color: #333;
                }
                .container {
                  max-width: 600px;
                  margin: 40px auto;
                  background: #ffffff;
                  border-radius: 8px;
                  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
                  overflow: hidden;
                }
                .header {
                  background-color: #007bff;
                  color: white;
                  text-align: center;
                  padding: 20px;
                  font-size: 24px;
                  font-weight: bold;
                }
                .content {
                  padding: 20px;
                  line-height: 1.6;
                }
                .button {
                  display: inline-block;
                  padding: 10px 20px;
                  background-color: #007bff;
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
                  font-size: 16px;
                  margin-top: 20px;
                }
                .footer {
                  background: #f9f9f9;
                  text-align: center;
                  padding: 10px;
                  font-size: 12px;
                  color: #777;
                  border-top: 1px solid #ddd;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  ${emailConfig.fromName}
                </div>
                <div class="content">
                  <p>Dear User,</p>
                  <p>${message}</p>
                  <p>Best regards,</p>
                  <p>${emailConfig.fromName}</p>
                </div>
                <div class="footer">
                  &copy; ${new Date().getFullYear()} ${emailConfig.fromName}. All Rights Reserved.
                </div>
              </div>
            </body>
            </html>
          `,
        };

        await transporter.sendMail(replyOptions);
        return res.status(200).json({ message: 'Reply sent successfully!' });
      }

      // Save contact form data to the database
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

      // Admin notification email
      const mailOptionsAdmin = {
        from: `${emailConfig.fromName} <${emailConfig.user}>`,
        to: emailConfig.user,
        subject: `New Contact Form Submission: ${subject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f9f9f9;
                margin: 0;
                padding: 0;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 40px auto;
                background: #ffffff;
                border-radius: 8px;
                box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
                overflow: hidden;
              }
              .header {
                background-color: #007bff;
                color: white;
                text-align: center;
                padding: 20px;
                font-size: 24px;
                font-weight: bold;
              }
              .content {
                padding: 20px;
                line-height: 1.6;
              }
              .footer {
                background: #f9f9f9;
                text-align: center;
                padding: 10px;
                font-size: 12px;
                color: #777;
                border-top: 1px solid #ddd;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                ${emailConfig.fromName}
              </div>
              <div class="content">
                <h3>New Contact Form Submission</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} ${emailConfig.fromName}. All Rights Reserved.
              </div>
            </div>
          </body>
          </html>
        `,
      };

      // User acknowledgment email
      const mailOptionsUser = {
        from: `${emailConfig.fromName} <${emailConfig.user}>`,
        to: email,
        subject: 'Thank you for contacting us!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f9f9f9;
                margin: 0;
                padding: 0;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 40px auto;
                background: #ffffff;
                border-radius: 8px;
                box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
                overflow: hidden;
              }
              .header {
                background-color: #007bff;
                color: white;
                text-align: center;
                padding: 20px;
                font-size: 24px;
                font-weight: bold;
              }
              .content {
                padding: 20px;
                line-height: 1.6;
              }
              .footer {
                background: #f9f9f9;
                text-align: center;
                padding: 10px;
                font-size: 12px;
                color: #777;
                border-top: 1px solid #ddd;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                ${emailConfig.fromName}
              </div>
              <div class="content">
                <h3>Thank you for contacting us!</h3>
                <p>Dear ${name},</p>
                <p>We have received your message and will get back to you shortly.</p>
                <p>Your message:</p>
                <blockquote>${message}</blockquote>
              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} ${emailConfig.fromName}. All Rights Reserved.
              </div>
            </div>
          </body>
          </html>
        `,
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
