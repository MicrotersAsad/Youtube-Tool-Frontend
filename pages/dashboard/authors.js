import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './layout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaFacebook, FaImage, FaInfoCircle, FaLinkedin, FaTwitter, FaUser, FaEdit, FaTrash } from 'react-icons/fa';

const Authors = () => {
  const [authors, setAuthors] = useState([]);
  const [newAuthor, setNewAuthor] = useState({
    name: '',
    bio: '',
    image: null,
    role: 'Author',
    socialLinks: { facebook: '', twitter: '', linkedin: '' },
  });
  const [editMode, setEditMode] = useState(false);
  const [currentAuthorId, setCurrentAuthorId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      const response = await axios.get('/api/authors');
      setAuthors(response.data);
    } catch (error) {
      toast.error('Failed to fetch authors');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewAuthor((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setNewAuthor((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [name]: value },
    }));
  };

  const handleFileChange = (e) => {
    setNewAuthor((prev) => ({
      ...prev,
      image: e.target.files[0], // Store file
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', newAuthor.name);
      formData.append('bio', newAuthor.bio);
      formData.append('role', newAuthor.role);
      formData.append('socialLinks', JSON.stringify(newAuthor.socialLinks));
      if (newAuthor.image instanceof File) {
        formData.append('image', newAuthor.image);
      }

      if (editMode) {
        await axios.put(`/api/authors?id=${currentAuthorId}`, formData);
        toast.success('Author updated successfully!');
      } else {
        await axios.post('/api/authors', formData);
        toast.success('Author added successfully!');
      }

      setNewAuthor({
        name: '',
        bio: '',
        image: null,
        role: 'Author',
        socialLinks: { facebook: '', twitter: '', linkedin: '' },
      });
      setEditMode(false);
      setCurrentAuthorId(null);
      fetchAuthors();
    } catch (error) {
      toast.error('Failed to save author');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (author) => {
    setNewAuthor(author);
    setEditMode(true);
    setCurrentAuthorId(author._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this author?')) {
      try {
        await axios.delete(`/api/authors?id=${id}`);
        toast.success('Author deleted successfully!');
        fetchAuthors();
      } catch (error) {
        toast.error('Failed to delete author');
      }
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-5">
        <h2 className="text-3xl font-bold mb-5">Manage Authors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <FaUser className="inline fs-2" />
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={newAuthor.name}
              onChange={handleChange}
              className="border p-2 ms-2 md:w-2/3 rounded-md"
            />
          </div>
          <div>
            <FaInfoCircle className="inline fs-2" />
            <textarea
              name="bio"
              placeholder="Bio"
              value={newAuthor.bio}
              onChange={handleChange}
              className="border p-2 ms-2 md:w-2/3 rounded-md"
            />
          </div>
          <div>
            <FaImage className="inline fs-2" />
            <input
              type="file"
              name="image"
              onChange={handleFileChange}
              className="border p-2 ms-2 md:w-2/3 rounded-md"
            />
          </div>
          {/* Social Links */}
          <div>
            <FaFacebook className="inline fs-2" />
            <input
              type="text"
              name="facebook"
              placeholder="Facebook URL"
              value={newAuthor.socialLinks.facebook}
              onChange={handleSocialChange}
              className="border p-2 ms-2 md:w-2/3 rounded-md"
            />
          </div>
          <div>
            <FaTwitter className="inline fs-2" />
            <input
              type="text"
              name="twitter"
              placeholder="Twitter URL"
              value={newAuthor.socialLinks.twitter}
              onChange={handleSocialChange}
              className="border p-2 ms-2 md:w-2/3 rounded-md"
            />
          </div>
          <div>
            <FaLinkedin className="inline fs-2" />
            <input
              type="text"
              name="linkedin"
              placeholder="LinkedIn URL"
              value={newAuthor.socialLinks.linkedin}
              onChange={handleSocialChange}
              className="border p-2 ms-2 md:w-2/3 rounded-md"
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          {editMode ? 'Update Author' : 'Add Author'}
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {authors.map((author) => (
            <div key={author._id} className="border p-4 rounded-md shadow-md">
              <img src={author.imageUrl} alt={author.name} className="w-32 h-32 rounded-full" />
              <h3 className="text-lg font-bold">{author.name}</h3>
              <p>{author.bio}</p>
              <div className="flex space-x-4 mt-2">
                <button onClick={() => handleEdit(author)} className="bg-yellow-500 py-1 px-2 rounded">
                  <FaEdit />
                </button>
                <button onClick={() => handleDelete(author._id)} className="bg-red-500 py-1 px-2 rounded">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
        <ToastContainer />
      </div>
    </Layout>
  );
};

export default Authors;
