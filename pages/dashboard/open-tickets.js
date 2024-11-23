import React, { useEffect, useState } from 'react';
import Layout from './layout';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { FaSearch } from 'react-icons/fa';

const ITEMS_PER_PAGE = 10;

const OpenTicketsPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user && user.id) {
      fetchOpenTickets();
    }
  }, [user]);

  const fetchOpenTickets = async () => {
    try {
      const response = await fetch('/api/tickets/create');
      const result = await response.json();

      if (result.success) {
        const openTickets = result.tickets.filter(ticket => ticket.status === 'open');
        setTickets(openTickets);
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
    setCurrentPage(1);
  };

  const getLastReplyTime = (comments) => {
    if (!comments || comments.length === 0) return 'N/A';
    const lastCommentTime = new Date(comments[comments.length - 1].createdAt);
    return formatDistanceToNow(lastCommentTime, { addSuffix: true });
  };

  const getFilteredTickets = () => {
    if (!searchTerm) return tickets;
    return tickets.filter((ticket) =>
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const paginatedTickets = getFilteredTickets().slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(getFilteredTickets().length / ITEMS_PER_PAGE);

  return (
    <Layout>
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center ms-4 mb-4 space-y-4 md:space-y-0">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 text-center md:text-left">
            Open Tickets
          </h2>

          <div className="flex border border-gray-300 rounded-md overflow-hidden md:me-5 w-full md:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="UserName"
              className="py-2 px-3 flex-grow focus:outline-none placeholder-gray-400 text-sm"
            />
            <button className="bg-[#071251] p-2 flex items-center justify-center">
              <FaSearch className="text-white" />
            </button>
          </div>
        </div>
        {loading ? (
          <Skeleton count={5} height={40} className="skeleton-row" />
        ) : paginatedTickets.length > 0 ? (
          <>
            <div className="overflow-x-auto">
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
                  {paginatedTickets.map((ticket) => (
                    <tr key={ticket._id} className="table-row">
                      <td className="table-cell">
                        <Link href={`/dashboard/tickets/${ticket.ticketId}`}>
                          <span className="subject-link">
                            [Ticket#{ticket.ticketId}] {ticket.subject}
                          </span>
                        </Link>
                      </td>
                      <td className="table-cell">{ticket.userName || 'Anonymous'}</td>
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
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center mt-6 space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                  currentPage === 1
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-3 py-1 rounded ${
                    currentPage === index + 1
                      ? 'bg-blue-500 text-white font-bold'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <p className="no-data-text">Data not found.</p>
        )}
      </div>

      <style jsx global>{`
        .container {
          padding: 20px;
          background-color: #f9f9f9;
        }
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
          background-color: #071251;
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
          padding: 4px 8px;
          border-radius: 4px;
        }
        .priority-label.medium {
          background-color: #ffe9b3;
          color: #d88600;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .priority-label.low {
          background-color: #e2e2e2;
          color: #555;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .status-label.closed {
          background-color: #ffdddd;
          color: #d80000;
          padding: 4px 8px;
          border-radius: 4px;
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
        .skeleton-row {
          margin-bottom: 10px;
          border-radius: 4px;
        }
        @media (max-width: 768px) {
          .tickets-table {
            display: block;
            overflow-x: auto;
            white-space: nowrap;
          }
          .table-header-cell, .table-cell {
            padding: 10px;
            font-size: 0.875rem;
          }
          .details-button {
            padding: 5px 10px;
            font-size: 0.875rem;
          }
        }
        @media (max-width: 480px) {
          .container {
            padding: 10px;
          }
          .table-header-cell, .table-cell {
            padding: 8px;
            font-size: 0.8rem;
          }
          .details-button {
            padding: 4px 8px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </Layout>
  );
};

export default OpenTicketsPage;
