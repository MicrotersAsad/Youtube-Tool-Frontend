import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import TicketDetails from '../../../components/TicketDetails';
import Layout from '../layout';
import { useAuth } from '../../../contexts/AuthContext';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
/**
 * Page to show the details of a single support ticket.
 */
const TicketDetailsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { ticketId } = router.query;
  const [ticket, setTicket] = useState(null);
  const [usersMap, setUsersMap] = useState({}); // Map of userId to userName

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`);
      const result = await response.json();
      if (result.success) {
        const fetchedTicket = result.ticket;
        setTicket(fetchedTicket);
      } else {
        toast.error('Failed to fetch ticket details');
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
    }
  };

  const handleCommentSubmit = async (comment) => {
    try {
      const recipientUserId = user.role === 'admin' ? ticket.userId : 'admin'; // Admin replies to the user, User notifies Admin
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment,
          userId: user.id, // Pass the user's ID from the authenticated context
          userName: user.username,
          recipientUserId, // Notification recipient
        }),
      });

      const result = await response.json();
      if (result.success) {
        fetchTicket(); // Refresh ticket details after adding a comment
        toast.success('Ticket Replied successfully ');
      } else {
        toast.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          recipientUserId: ticket.userId, // Notify the ticket owner about status updates
        }),
      });

      const result = await response.json();
      if (result.success) {
        fetchTicket(); // Refresh ticket details after updating the status
      } else {
        alert('Failed to update ticket status');
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        fetchTicket(); // Refresh ticket details after deleting a comment
      } else {
        alert('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto mt-8">
        {ticket ? (
          <TicketDetails
            ticket={ticket}
            usersMap={usersMap} // Pass the user map to the component
            onCommentSubmit={handleCommentSubmit}
            onUpdateStatus={handleStatusUpdate}
            onDeleteComment={handleDeleteComment} // Pass the delete function to the component
          />
        ) : (
          <p>Loading ticket details...</p>
        )}
      </div>
    </Layout>
  );
};

export default TicketDetailsPage;
