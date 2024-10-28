import React from 'react';
import Link from 'next/link';

/**
 * TicketList component to display a list of tickets for users or admins.
 */
const TicketList = ({ tickets }) => {
  // Function to get the time difference from the last comment to the current time
  const getTimeDifference = (lastCommentDate) => {
    if (!lastCommentDate) return 'N/A';

    const commentDate = new Date(lastCommentDate);
    if (isNaN(commentDate.getTime())) return 'Invalid date';

    const now = new Date();
    const diffInMilliseconds = now - commentDate;

    const seconds = Math.floor(diffInMilliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    if (minutes > 0) return `${minutes} minutes ago`;
    return `${seconds} seconds ago`;
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-2xl font-semibold mb-4">Support Tickets</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="py-2 px-4 font-medium text-left">Subject</th>
              <th className="py-2 px-4 font-medium text-left">Submitted By</th>
              <th className="py-2 px-4 font-medium text-left">Status</th>
              <th className="py-2 px-4 font-medium text-left">Priority</th>
              <th className="py-2 px-4 font-medium text-left">Last Reply</th>
              <th className="py-2 px-4 font-medium text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => {
              // Fetch the last comment's createdAt date if comments exist
              const lastComment =
                ticket.comments && ticket.comments.length > 0
                  ? ticket.comments[ticket.comments.length - 1]
                  : null;
              const lastReplyTime = lastComment
                ? getTimeDifference(lastComment.createdAt)
                : 'N/A';

              return (
                <tr key={ticket.ticketId} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">
                    <Link href={`tickets/${ticket.ticketId}`}>
                      <p className="text-blue-600 font-medium hover:underline">
                        [Ticket#{ticket.ticketId}] {ticket.subject}
                      </p>
                    </Link>
                  </td>
                  <td className="py-2 px-4 font-medium text-gray-700">
                    {ticket.submittedBy || 'Anonymous'}
                  </td>
                  <td className="py-2 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        ticket.status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : ticket.status === 'answered'
                          ? 'bg-blue-100 text-blue-800'
                          : ticket.status === 'in-progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {ticket.status.charAt(0).toUpperCase() +
                        ticket.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        ticket.priority === 'high'
                          ? 'bg-red-100 text-red-800'
                          : ticket.priority === 'medium'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {ticket.priority.charAt(0).toUpperCase() +
                        ticket.priority.slice(1)}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-gray-700">{lastReplyTime}</td>
                  <td className="py-2 px-4">
                    <Link href={`tickets/${ticket.ticketId}`}>
                      <button className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200">
                        <span className="mr-2">📝</span>
                        Details
                      </button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .ticket-container {
          background-color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          padding: 16px;
          margin-top: 24px;
        }

        .ticket-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .search-bar {
          margin-bottom: 16px;
        }

        .search-bar input {
          padding: 8px 16px;
          width: 100%;
          max-width: 300px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .ticket-table-container {
          overflow-x: auto;
        }

        .ticket-table {
          width: 100%;
          border-collapse: collapse;
        }

        .ticket-table th,
        .ticket-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #eee;
        }

        .ticket-table th {
          background-color: #4634ff;
          color: white;
          text-align: left;
        }

        .ticket-link {
          color: #1a73e8;
          cursor: pointer;
          text-decoration: none;
        }

        .ticket-link:hover {
          text-decoration: underline;
        }

        .status-badge,
        .priority-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          color: white;
        }

        .status-badge.open {
          background-color: #28a745;
        }

        .status-badge.answered {
          background-color: #17a2b8;
        }

        .status-badge.customer-reply {
          background-color: #ffc107;
          color: #856404;
        }

        .status-badge.closed {
          background-color: #6c757d;
          color: white;
        }

        .status-badge.in-progress {
          background-color: #007bff;
        }

        .priority-badge.high {
          background-color: #dc3545;
        }

        .priority-badge.medium {
          background-color: #fd7e14;
        }

        .priority-badge.low {
          background-color: #6c757d;
        }

        .priority-badge.urgent {
          background-color: #ff5722;
        }

        .details-button {
          background-color: #007bff;
          color: white;
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .details-button:hover {
          background-color: #0056b3;
        }
      `}</style>
    </div>
  );
};

export default TicketList;
