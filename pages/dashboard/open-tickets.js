import React, { useEffect, useState } from 'react';
import Layout from './layout';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const ClosedTicketsPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user && user.id) {
      fetchClosedTickets();
    }
  }, [user]);

  const fetchClosedTickets = async () => {
    try {
      const response = await fetch('/api/tickets/create');
      const result = await response.json();

      if (result.success) {
        const closedTickets = result.tickets.filter(ticket => ticket.status === 'open');
        setTickets(closedTickets);
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
      <div className="container">
        <h1 className="heading">Closed Tickets</h1>
        <input
          type="text"
          placeholder="Search tickets..."
          className="search-input"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {loading ? (
          <p className="loading-text">Loading tickets...</p>
        ) : filteredTickets.length > 0 ? (
          <table className="tickets-table">
            <thead>
              <tr className="table-header bg-[#4634ff] text-white">
                <th className="table-header-cell">Subject</th>
                <th className="table-header-cell">Submitted By</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Priority</th>
                <th className="table-header-cell">Last Reply</th>
                <th className="table-header-cell">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket._id} className="table-row">
                  <td className="table-cell">
                    <Link href={`/dashboard/tickets/${ticket.ticketId}`}>
                      <span className="subject-link">
                        [Ticket#{ticket.ticketId}] {ticket.subject}
                      </span>
                    </Link>
                  </td>
                  <td className="table-cell">{ticket.submittedBy || 'Anonymous'}</td>
                  <td className="table-cell">
                    <span className={`status-label closed`}>
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`priority-label ${ticket.priority}`}>
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </span>
                  </td>
                  <td className="table-cell">{getLastReplyTime(ticket.comments)}</td>
                  <td className="table-cell">
                    <Link href={`/dashboard/tickets/${ticket.ticketId}`}>
                      <button className="details-button">Details</button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data-text">Data not found.</p>
        )}
      </div>

      <style jsx global>{`
      
        .heading {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 20px;
          color: #333;
        }
        .search-input {
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-bottom: 20px;
          width: 30%;
        }
        .loading-text,
        .no-data-text {
          text-align: center;
          color: #777;
          margin-top: 30px;
        }
        .tickets-table {
          width: 100%;
          border-collapse: collapse;
          background-color: #fff;
          border-radius: 8px;
          overflow: hidden;
        }
        .table-header {
          background-color: #3b5998;
          color: white;
        }
        .table-header-cell {
          padding: 15px;
          font-weight: bold;
          text-align: left;
        }
        .table-row {
          border-bottom: 1px solid #e1e1e1;
        }
        .table-cell {
          padding: 15px;
          text-align: left;
          color: #333;
        }
        .subject-link {
          color: #007bff;
          font-weight: bold;
          text-decoration: none;
        }
        .subject-link:hover {
          text-decoration: underline;
        }
        .status-label {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        .priority-label.high {
          background-color: #ffdddd;
          color: #d80000;
        }
        .priority-label.medium {
          background-color: #ffe9b3;
          color: #d88600;
        }
        .priority-label.low {
          background-color: #e2e2e2;
          color: #555;
        }
        .status-label.closed {
          background-color: #ffdddd;
          color: #d80000;
        }
        .details-button {
          background-color: #007bff;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .details-button:hover {
          background-color: #0056b3;
        }
      `}</style>
    </Layout>
  );
};

export default ClosedTicketsPage;
