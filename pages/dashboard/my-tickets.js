import React, { useEffect, useState } from 'react';
import Layout from './layout'; // Assuming you have a common layout
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns'; // Importing date-fns to format the time difference

const MyTicketsPage = () => {
  const { user } = useAuth(); // Get the logged-in user's information
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch tickets for the logged-in user
    if (user && user.id) {
      fetchUserTickets(user.id);
    }
  }, [user]);

  const fetchUserTickets = async (userId) => {
    try {
      const response = await fetch(`/api/tickets?userId=${userId}`);
      const result = await response.json();

      if (result.success) {
        setTickets(result.tickets);
      } else {
        console.error('Failed to fetch tickets:', result.message);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const getLastReplyTime = (comments) => {
    if (!comments || comments.length === 0) return 'N/A';
    const lastCommentTime = new Date(comments[comments.length - 1].createdAt);
    return formatDistanceToNow(lastCommentTime, { addSuffix: true });
  };

  const filteredTickets = tickets.filter((ticket) =>
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="ticket-container">
        <h1 className="title">My Tickets</h1>
        <input
          type="text"
          placeholder="Search tickets..."
          className="search-bar"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {loading ? (
          <p>Loading tickets...</p>
        ) : filteredTickets.length > 0 ? (
          <table className="ticket-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Last Reply</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket._id}>
                  <td>
                    <Link href={`/dashboard/tickets/${ticket.ticketId}`}>
                      <span className="ticket-link">
                        [Ticket#{ticket.ticketId}] {ticket.subject}
                      </span>
                    </Link>
                  </td>
                  <td>
                    <span className={`status ${ticket.status}`}>
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span className={`priority ${ticket.priority}`}>
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </span>
                  </td>
                  <td>{getLastReplyTime(ticket.comments)}</td>
                  <td>
                    <Link href={`/dashboard/tickets/${ticket.ticketId}`}>
                      <button className="details-button">Details</button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Data not found.</p>
        )}
      </div>
      <style jsx>{`
       
        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 16px;
          color: #333;
        }
        .search-bar {
          width: 40%;
          padding: 10px;
          margin-bottom: 20px;
          border: 1px solid #ccc;
          border-radius: 8px;
        }
        .ticket-table {
          width: 100%;
          border-collapse: collapse;
        }
        .ticket-table thead th {
          background-color: #004085;
          color: #fff;
          padding: 12px;
          text-align: left;
        }
        .ticket-table tbody tr {
          transition: background 0.3s;
        }
        .ticket-table tbody tr:hover {
          background-color: #f8f9fa;
        }
        .ticket-table td {
          padding: 12px;
          border-bottom: 1px solid #ddd;
        }
        .ticket-link {
          color: #0056b3;
          text-decoration: none;
          font-weight: bold;
        }
        .ticket-link:hover {
          text-decoration: underline;
        }
        .status,
        .priority {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: bold;
        }
        .status.open {
          background-color: #d4edda;
          color: #155724;
        }
        .status['in-progress'] {
          background-color: #fff3cd;
          color: #856404;
        }
        .status.closed {
          background-color: #f8d7da;
          color: #721c24;
        }
        .priority.high {
          background-color: #f8d7da;
          color: #721c24;
        }
        .priority.medium {
          background-color: #ffeeba;
          color: #856404;
        }
        .details-button {
          background-color: #007bff;
          color: #fff;
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.3s;
        }
        .details-button:hover {
          background-color: #0056b3;
        }
      `}</style>
    </Layout>
  );
};

export default MyTicketsPage;
