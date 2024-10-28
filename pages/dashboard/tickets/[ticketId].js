import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import TicketDetails from '../../../components/TicketDetails';
import Layout from '../layout';

/**
 * Page to show the details of a single support ticket.
 */
const TicketDetailsPage = () => {
  const router = useRouter();
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
        await fetchUserDetails(fetchedTicket.comments); // Fetch user details for comments
        setTicket(fetchedTicket);
      } else {
        alert('Failed to fetch ticket details');
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
    }
  };

  const fetchUserDetails = async (comments) => {
    // Extract unique userIds from comments
    const userIds = [...new Set(comments.map(comment => comment.userId).filter(id => id))];

    // Fetch user details for each userId and map them
    const userMap = {};
    try {
      for (let userId of userIds) {
        const response = await fetch(`/api/users/${userId}`); // Assume there's an API endpoint for users
        const result = await response.json();
        if (result.success && result.user) {
          userMap[userId] = result.user.name; // Store user name in map
        }
      }
      setUsersMap(userMap); // Update the map state
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleCommentSubmit = async (comment) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      });

      const result = await response.json();
      if (result.success) {
        fetchTicket(); // Refresh ticket details after adding a comment
      } else {
        alert('Failed to add comment');
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
        body: JSON.stringify({ status }),
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
