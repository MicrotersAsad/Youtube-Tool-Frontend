import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { FaLinkSlash } from 'react-icons/fa6';

const QuillEditor = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const quillRef = useRef(null);

  useEffect(() => {
    const editor = document.getElementById('editor');
    const insertImageUrlButton = document.getElementById('insert-image-url');

    const quill = new Quill(editor, {
      theme: 'snow',
      modules: {
        syntax: true,
        toolbar: '#toolbar-container',
      },
    });

    quillRef.current = quill;

    insertImageUrlButton.addEventListener('click', () => setIsModalOpen(true));

    // Clean up event listener on component unmount
    return () => {
      insertImageUrlButton.removeEventListener('click', () => setIsModalOpen(true));
    };
  }, []);

  const insertImage = () => {
    const quill = quillRef.current;
    if (imageUrl) {
      let range = quill.getSelection();
      if (!range) {
        // If no range is selected, set the range to the end of the editor content
        range = { index: quill.getLength(), length: 0 };
      }
      quill.insertEmbed(range.index, 'image', imageUrl, Quill.sources.USER);
      console.log('Image added:', imageUrl);
      setImageUrl('');
      setIsModalOpen(false);
    }
  };

  const closeModal = () => {
    setImageUrl('');
    setIsModalOpen(false);
  };

  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css"
        />
        <style>
          {`
            #editor, #html-view {
              height: 400px;
              border: 1px solid #ccc;
              padding: 10px;
              border-radius: 5px;
              background: #fff;
            }
            #html-view {
              display: none;
              font-family: monospace;
              white-space: pre-wrap;
              background: #f9f9f9;
              overflow: auto;
            }
            #toolbar-container {
              border-bottom: 1px solid #ccc;
              padding: 10px;
              background: #f4f4f4;
              border-top-left-radius: 5px;
              border-top-right-radius: 5px;
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
            }
            .ql-container {
              border: none;
            }
            .ql-toolbar button, .ql-toolbar .ql-picker {
              background: #fff;
              border: 1px solid #ccc;
              border-radius: 4px;
              padding: 5px;
              cursor: pointer;
              transition: background 0.3s ease, border-color 0.3s ease;
              margin-right: 5px;
            }
            .ql-toolbar button:hover, .ql-toolbar .ql-picker:hover {
              background: #ececec;
              border-color: #bbb;
            }
            .ql-toolbar button.ql-active, .ql-toolbar .ql-picker.ql-active {
              background: #dcdcdc;
              border-color: #aaa;
            }
            .ql-toolbar .ql-picker {
              padding: 0;
            }
            .ql-toolbar .ql-picker-label {
              padding: 5px;
            }
            .ql-toolbar .ql-picker-item {
              padding: 5px;
            }
            .modal {
              display: ${isModalOpen ? 'block' : 'none'};
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: white;
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
              z-index: 1000;
              width: 300px;
            }
            .overlay {
              display: ${isModalOpen ? 'block' : 'none'};
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.7);
              z-index: 999;
            }
          `}
        </style>
      </Head>
      <div id="standalone-container">
        <div id="toolbar-container">
          <span className="ql-formats">
            <select className="ql-font"></select>
            <select className="ql-size"></select>
          </span>
          <span className="ql-formats">
            <button className="ql-bold"></button>
            <button className="ql-italic"></button>
            <button className="ql-underline"></button>
            <button className="ql-strike"></button>
          </span>
          <span className="ql-formats">
            <select className="ql-color"></select>
            <select className="ql-background"></select>
          </span>
          <span className="ql-formats">
            <button className="ql-script" value="sub"></button>
            <button className="ql-script" value="super"></button>
          </span>
          <span className="ql-formats">
            <button className="ql-header" value="1"></button>
            <button className="ql-header" value="2"></button>
            <button className="ql-blockquote"></button>
            <button className="ql-code-block"></button>
          </span>
          <span className="ql-formats">
            <button className="ql-list" value="ordered"></button>
            <button className="ql-list" value="bullet"></button>
            <button className="ql-indent" value="-1"></button>
            <button className="ql-indent" value="+1"></button>
          </span>
          <span className="ql-formats">
            <button className="ql-direction" value="rtl"></button>
            <select className="ql-align"></select>
          </span>
          <span className="ql-formats">
            <button className="ql-link"></button>
            <button className="ql-image"></button>
            <button id="insert-image-url"><FaLinkSlash /></button>
            <button className="ql-video"></button>
            <button className="ql-formula"></button>
          </span>
        </div>
        <div id="editor"></div>
        <pre id="html-view"></pre>
      </div>
      {isModalOpen && (
        <>
          <div className="overlay" onClick={closeModal}></div>
          <div className="modal">
            <h2>Insert Image URL</h2>
            <input
              type="text"
              placeholder="Enter image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={insertImage}
              className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 mt-3"
            >
              Insert
            </button>
            <button
              onClick={closeModal}
              className="mt-2 px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              Cancel
            </button>
          </div>
        </>
      )}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js"></script>
    </>
  );
};

export default QuillEditor;
