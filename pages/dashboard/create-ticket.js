import React from 'react';
import TicketForm from '../../components/TicketForm';
import Layout from './layout';
import { useAuth } from '../../contexts/AuthContext'; // Make sure you have useAuth imported

/**
 * User page to create a new ticket.
 */
const CreateTicketPage = () => {
  const { user } = useAuth(); // Extract the current logged-in user from context


  const handleTicketSubmit = async (ticketData) => {
    if (!user) {
      alert("You must be logged in to create a ticket.");
      return;
    }

    try {
      // Attach userId to the ticket data
      const response = await fetch('/api/tickets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...ticketData,
          userId: user.id, // Pass the user's ID from the authenticated context
          userName: user.username, // Pass the user's username from the authenticated context
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Ticket created successfully');

        // Send a notification to the admin
        await fetch('/api/send-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientUserId: 'admin', // Special identifier for admin notifications
            type: 'ticket_created',
            message: `${user.username} created a new ticket with subject: "${ticketData.subject}".`,
            ticketId: result.ticket.ticketId, // Include the created ticket ID
          }),
        });

        alert('Notification sent to the admin!');
      } else {
        alert('Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('An error occurred while creating the ticket.');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto mt-8">
        <TicketForm onSubmit={handleTicketSubmit} />
      </div>
    </Layout>
  );
};

export default CreateTicketPage;
