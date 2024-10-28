import React, { useState } from 'react';

const TicketDetails = ({ ticket, onCommentSubmit, onUpdateStatus,onDeleteComment,usersMap   }) => {
  const [newComment, setNewComment] = useState('');

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    onCommentSubmit(newComment);
    setNewComment('');
  };

  return (
    <div className="ticket-details-container">
      <div className="ticket-header">
        <span className={`status-label ${ticket.status}`}>{ticket.status}</span>
        <h2 className="ticket-title">
          [Ticket#{ticket.ticketId}] {ticket.subject}
        </h2>
        <button
          onClick={() => onUpdateStatus('closed')}
          className="close-ticket-button"
        >
          Close Ticket
        </button>
      </div>

      <textarea
        className="reply-input"
        placeholder="Enter reply here"
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
      />

      <div className="attachment-section">
        <button className="add-attachment-button">+ Add Attachment</button>
        <p className="attachment-info">
          Max 5 files can be uploaded | Maximum upload size is 256MB | Allowed
          File Extensions: .jpg, .jpeg, .png, .pdf, .doc, .docx
        </p>
      </div>

      <div className="comment-section">
        {ticket.comments.map((comment, index) => (
          <div key={index} className="comment-box">
            <div className="comment-header">
            <span className="font-bold">{usersMap[comment.userId] || 'Anonymous'}</span>
              <span className="comment-timestamp">
                Posted on{' '}
                {new Date(comment.createdAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                @ {new Date(comment.createdAt).toLocaleTimeString()}
              </span>
              <button
                  onClick={() => onDeleteComment(comment._id)}
                  className="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-700"
                >
                  Delete
                </button>
            </div>
            <p className="comment-text">{comment.message}</p>
          </div>
        ))}
      </div>

      <button onClick={handleCommentSubmit} className="reply-button">
        Reply
      </button>

      <style jsx>{`
        .ticket-details-container {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        .ticket-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .status-label {
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: bold;
          color: white;
        }
        .status-label.open {
          background-color: #28a745;
        }
        .status-label['in-progress'] {
          background-color: #ffc107;
        }
        .status-label.closed {
          background-color: #dc3545;
        }
        .ticket-title {
          font-size: 20px;
          font-weight: bold;
        }
        .close-ticket-button {
          background: #dc3545;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.3s;
        }
        .close-ticket-button:hover {
          background: #c82333;
        }
        .reply-input {
          width: 100%;
          height: 80px;
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        .attachment-section {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }
        .add-attachment-button {
          background: #004085;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 20px;
          transition: background 0.3s;
        }
        .add-attachment-button:hover {
          background: #003366;
        }
        .attachment-info {
          font-size: 14px;
          color: #555;
        }
        .comment-section {
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
        .comment-box {
          border: 1px solid #eee;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 12px;
        }
        .comment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .comment-author {
          font-weight: bold;
          font-size: 16px;
        }
        .comment-timestamp {
          font-size: 14px;
          color: #777;
        }
        .delete-button {
          background: #dc3545;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
        }
        .comment-text {
          font-size: 14px;
          color: #333;
        }
        .reply-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.3s;
        }
        .reply-button:hover {
          background: #0056b3;
        }
      `}</style>
    </div>
  );
};

export default TicketDetails;
