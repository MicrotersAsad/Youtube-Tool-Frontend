// /pages/user/create-ticket.js
import React from 'react';
import TicketForm from '../../components/TicketForm';
import Layout from './layout';
import { useAuth } from '../../contexts/AuthContext'; // Make sure you have useAuth imported

/**
 * User page to create a new ticket.
 */
const CreateTicketPage = () => {
  const { user } = useAuth(); // Extract the current logged-in user from context
console.log(user);

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
        }),
      });

      const result = await response.json();
      console.log(result);
      
      if (result.success) {
        alert('Ticket created successfully');
      } else {
        alert('Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
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
