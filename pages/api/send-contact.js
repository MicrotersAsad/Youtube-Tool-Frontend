// Importing the nodemailer module to handle email sending
import nodemailer from 'nodemailer';

// Defining the handler function to process the incoming HTTP requests
export default async function handler(req, res) {
  // Checking if the request method is POST
  if (req.method === 'POST') {
    // Extracting the name, email, subject, and message from the request body
    const { name, email, subject, message } = req.body;

    // Configuring the nodemailer transporter using Gmail as the service
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // Using Gmail service for sending emails
      auth: {
        user: process.env.NEXT_PUBLIC_EMAIL_USER, // Email user from environment variables
        pass: process.env.NEXT_PUBLIC_EMAIL_PASS, // Email password from environment variables
      },
    });

    // Configuring the email options for sending the email to the admin
    const mailOptionsAdmin = {
      from: process.env.NEXT_PUBLIC_EMAIL_USER, // Sender email address
      to: process.env.NEXT_PUBLIC_EMAIL_USER, // Admin email address (recipient)
      subject: `New Contact Form Submission: ${subject}`, // Subject of the email
      text: `You have a new contact form submission from:
      
      Name: ${name}
      Email: ${email}
      Message: ${message}`, // Content of the email
    };

    // Configuring the email options for sending the thank you email to the user
    const mailOptionsUser = {
      from: process.env.NEXT_PUBLIC_EMAIL_USER, // Sender email address
      to: email, // User email address (recipient)
      subject: 'Thank you for contacting us!', // Subject of the thank you email
      text: `Hello ${name},
      
      Thank you for reaching out. We have received your message and will get back to you shortly.
      
      Best regards,
      YT Tools`, // Content of the thank you email
    };

    try {
      // Sending the email to the admin
      await transporter.sendMail(mailOptionsAdmin);
      // Sending the thank you email to the user
      await transporter.sendMail(mailOptionsUser);
      
      // Sending a success response back to the client
      res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
      // Logging the error if email sending fails
      console.error('Error sending email:', error);
      // Sending an error response back to the client
      res.status(500).json({ error: 'Error sending email' });
    }
  } else {
    // Sending a 405 Method Not Allowed response if the request method is not POST
    res.status(405).json({ error: 'Method not allowed' });
  }
}