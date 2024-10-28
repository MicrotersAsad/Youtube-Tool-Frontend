// /components/TicketForm.js
import React, { useState } from 'react';

const TicketForm = ({ onSubmit }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [priority, setPriority] = useState('medium'); // Default to "medium"

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ subject, description, attachments, priority });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Submit a Support Ticket</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium">Subject</label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Description</label>
        <textarea
          className="w-full h-32 p-2 border rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Priority</label>
        <select
          className="w-full p-2 border rounded"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          required
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Attachments</label>
        <input
          type="file"
          multiple
          onChange={(e) => setAttachments(Array.from(e.target.files))}
          className="block w-full"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white py-2 px-4 rounded"
      >
        Submit
      </button>
    </form>
  );
};

export default TicketForm;
