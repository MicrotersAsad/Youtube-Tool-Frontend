import { useEffect, useState } from 'react';
import { FaReply, FaTrashAlt } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './layout';

const ContactDashboard = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyingContact, setReplyingContact] = useState(null); // For reply
  const [replyMessage, setReplyMessage] = useState(''); // For reply message

  useEffect(() => {
    fetchContacts();
  }, []);

  // Fetch all contact submissions
  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/send-contact');
      const result = await response.json();
      if (result.success) {
        setContacts(result.data);
      } else {
        setError('Failed to fetch contacts');
      }
      setLoading(false);
    } catch (error) {
      setError('Error fetching contacts');
      setLoading(false);
    }
  };

  // Handle reply message input change
  const handleReplyChange = (e) => {
    setReplyMessage(e.target.value);
  };

  // Handle reply contact
  const handleReply = (contact) => {
    setReplyingContact(contact); // Set the contact to reply to
  };

  // Handle sending the reply
  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Reply message cannot be empty');
      return;
    }
  
    try {
      const response = await fetch(`/api/send-contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          replyToEmail: replyingContact.email,
          message: replyMessage,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to send reply');
      }
  
      toast.success('Reply sent successfully!');
      setReplyingContact(null);
      setReplyMessage('');
    } catch (error) {
      toast.error('Error sending reply');
    }
  };
  
  // Handle delete contact
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        const response = await fetch(`/api/send-contact?id=${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to delete contact');
        }
        toast.success('Contact deleted successfully!');
        fetchContacts(); // Reload contacts
      } catch (error) {
        toast.error('Error deleting contact');
      }
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <ToastContainer />
        <h2 className="text-2xl font-semibold text-center mb-6">Contact Submissions</h2>
        
        {error && <p className="text-red-500">{error}</p>}
        
        {loading ? (
          <div className="text-center">
            <p>Loading...</p>
          </div>
        ) : (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Subject</th>
                <th className="px-4 py-2 border">Message</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact._id}>
                  <td className="border px-4 py-2">{contact.name}</td>
                  <td className="border px-4 py-2">{contact.email}</td>
                  <td className="border px-4 py-2">{contact.subject}</td>
                  <td className="border px-4 py-2">{contact.message}</td>
                  <td className="border px-4 py-2">
                    <button
                      onClick={() => handleReply(contact)}
                      className="text-blue-500 mr-2"
                    >
                      <FaReply />
                    </button>
                    <button
                      onClick={() => handleDelete(contact._id)}
                      className="text-red-500"
                    >
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Reply Form */}
        {replyingContact && (
          <div className="mt-6 bg-gray-100 p-4 rounded-md shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Reply to {replyingContact.name}</h3>
            <div className="mb-4">
              <label className="block text-gray-700">Reply Message</label>
              <textarea
                value={replyMessage}
                onChange={handleReplyChange}
                className="w-full border rounded px-3 py-2"
                rows="4"
                placeholder="Enter your reply"
              />
            </div>
            <button
              onClick={handleSendReply}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Send Reply
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ContactDashboard;
