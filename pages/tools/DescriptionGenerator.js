import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const YouTubeDescriptionGenerator = () => {
  const [videoInfo, setVideoInfo] = useState({
    aboutVideo: `Welcome to [Your Channel Name]!\n\nIn this video, we're diving deep into the world of Full Stack Development. Whether you're a beginner or an experienced developer, these tips and guidelines will help you enhance your skills and stay ahead in the tech industry.`,
    timestamps: `00:00 - Introduction\n01:00 - First Topic\n02:00 - Second Topic\n03:00 - Third Topic`,
    aboutChannel: `Our channel is all about [Channel's Niche]. We cover a lot of cool stuff like [Topics Covered]. Make sure to subscribe for more awesome content!`,
    recommendedVideos: `Check Out Our Other Videos:\n- [Video 1 Title](#)\n- [Video 2 Title](#)\n- [Video 3 Title](#)`,
    aboutCompany: `Check out our company and our products at [Company Website]. We offer [Products/Services Offered].`,
    website: `Find us at:\n[Website URL]`,
    contactSocial: `Get in Touch with Us:\nEmail: [Your Email]\nFollow us on Social Media:\nTwitter: [Your Twitter Handle]\nLinkedIn: [Your LinkedIn Profile]\nGitHub: [Your GitHub Repository]`,
    keywords: 'full stack development, coding, programming, web development'
  });

  const [sections, setSections] = useState([
    { id: 'aboutVideo', title: 'About the Video', visible: true },
    { id: 'timestamps', title: 'Timestamps', visible: true },
    { id: 'aboutChannel', title: 'About the Channel', visible: true },
    { id: 'recommendedVideos', title: 'Recommended Videos/Playlists', visible: true },
    { id: 'aboutCompany', title: 'About Our Company & Products', visible: true },
    { id: 'website', title: 'Our Website', visible: true },
    { id: 'contactSocial', title: 'Contact & Social', visible: true },
    { id: 'keywords', title: 'Keywords to Target (Optional)', visible: true }
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVideoInfo((prevInfo) => ({
      ...prevInfo,
      [name]: value
    }));
  };

  const generateDescription = () => {
    const { aboutVideo, timestamps, aboutChannel, recommendedVideos, aboutCompany, website, contactSocial, keywords } = videoInfo;
    return `
${aboutVideo}

📌 **Timestamps:**
${timestamps}

📌 **About the Channel:**
${aboutChannel}

📌 **Recommended Videos/Playlists:**
${recommendedVideos}

📌 **About Our Company & Products:**
${aboutCompany}

📌 **Our Website:**
${website}

📌 **Contact & Social:**
${contactSocial}

🔍 **Keywords to Target:**
${keywords}
    `;
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const newSections = Array.from(sections);
    const [movedSection] = newSections.splice(result.source.index, 1);
    newSections.splice(result.destination.index, 0, movedSection);

    setSections(newSections);
  };

  const toggleVisibility = (id) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.id === id ? { ...section, visible: !section.visible } : section
      )
    );
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">YouTube Description Generator</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {sections.map(({ id, title, visible }, index) => (
                    <Draggable key={id} draggableId={id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mb-4 border p-4 rounded shadow"
                        >
                          <div className="flex justify-between items-center">
                            <label className="block font-semibold mb-1" htmlFor={id}>{title}</label>
                            <button onClick={() => toggleVisibility(id)} className="text-gray-600">
                              {visible ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                          {visible && (
                            <textarea
                              name={id}
                              value={videoInfo[id]}
                              onChange={handleChange}
                              className="w-full p-2 border border-gray-300 rounded"
                              rows="4"
                            ></textarea>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Generated Video Description</h2>
          <div className="p-4 border border-gray-300 rounded bg-gray-100 whitespace-pre-wrap">
            {generateDescription()}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(generateDescription())}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default YouTubeDescriptionGenerator;
