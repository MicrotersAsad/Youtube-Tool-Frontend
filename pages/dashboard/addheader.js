import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import Head from 'next/head'; // For adding custom meta and script tags
import Layout from './layout';

const QuillWrapper = dynamic(() => import('../../components/EditorWrapper'), { ssr: false });

const AddHeader = () => {
    const [headerContent, setHeaderContent] = useState(""); // State to store the content
    const [savedHeaders, setSavedHeaders] = useState([]); // For storing fetched headers
    const [isLoading, setIsLoading] = useState(false); // Loading state for submitting

    // Load data from the server when component mounts
    useEffect(() => {
        fetchSavedHeaders(); // Call the function to fetch saved headers
    }, []);

    // Fetch saved headers from the API
    const fetchSavedHeaders = async () => {
        try {
            const response = await fetch('/api/heading', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            setSavedHeaders(data.data); // Set the fetched data to state
        } catch (error) {
            console.error('Error fetching headers:', error);
        }
    };

    // Handle content change in the editor
    const handleContentChange = (content) => {
        setHeaderContent(content); // Update the content
    };

    // Submit the content to the API
    const handleSubmit = async () => {
        if (!headerContent) {
            alert('Header content cannot be empty!');
            return;
        }
    
        setIsLoading(true); // Set loading state
    
        try {
            const response = await fetch('/api/heading', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: headerContent }),  // Make sure content is being sent properly
            });
    
            const data = await response.json();  // Log the response from the API
            console.log("API Response: ", data);
    
            if (!response.ok) {
                throw new Error(data.message || 'Failed to save header content');
            }
    
            alert(data.message); // Show success message
            fetchSavedHeaders(); // Refresh saved headers after submitting
        } catch (error) {
            console.error('Error saving header content:', error);  // Log the error message
        } finally {
            setIsLoading(false); // Stop loading state
        }
    };
    

    return (
        <Layout>
            <div>
                {/* Rich Text Editor */}
                <div>
                    <label className="block text-lg font-medium text-gray-700">Custom Header</label>
                    <div className="mt-2">
                        <QuillWrapper
                            value={headerContent}
                            onChange={handleContentChange}
                            theme="snow"
                            className="bg-white shadow-sm"
                            placeholder="Write your header content here..."
                        />
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-4">
                    <button
                        onClick={handleSubmit}
                        className={`px-4 py-2 rounded-md bg-blue-600 text-white ${isLoading ? 'opacity-50' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Save Header'}
                    </button>
                </div>

                {/* Display Saved Headers */}
                <div className="mt-8">
                    <h2 className="text-lg font-semibold">Saved Headers</h2>
                    {savedHeaders?.length > 0 ? (
                        savedHeaders?.map((header, index) => (
                            <div key={index} className="bg-gray-100 p-4 mt-2 rounded-md shadow-sm">
                                <pre>{header.content}</pre>
                            </div>
                        ))
                    ) : (
                        <p>No saved headers yet.</p>
                    )}
                </div>

                {/* Dynamically adding meta and script tags */}
                <Head>
                    <div dangerouslySetInnerHTML={{ __html: headerContent }} />
                </Head>

                {/* Preview Section */}
                <div>
                    <h2 className="mt-6 text-lg font-semibold">Preview</h2>
                    <div
                        dangerouslySetInnerHTML={{ __html: headerContent }}
                        className="bg-gray-100 p-4 mt-2 rounded-md shadow-sm"
                    />
                </div>
            </div>
        </Layout>
    );
};

export default AddHeader;
