import React, { useEffect, useState, useRef, forwardRef } from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import react-quill with no SSR
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const QuillWrapper = forwardRef(({ initialContent = '', onChange = () => {} }, ref) => {
  const [content, setContent] = useState(initialContent);
  const quillRef = useRef(null);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleChange = (value) => {
    try {
      setContent(value);
      onChange(value);
    } catch (error) {
      console.error('Error updating content:', error);
    }
  };

  const modules = {
    toolbar: {
      container: [
        [{ 'header': '1' }, { 'header': '2' }, { 'header': [3, 4, 5, 6] }, { 'font': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'code-block': 'code' }],
        ['link', 'image', 'video'],
        [{ 'align': [] }],
        ['clean']
      ],
    },
  };

  const formats = [
    'header', 'font',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet',
    'code-block',
    'link', 'image', 'video', 'align'
  ];

  return (
    <ReactQuill
      ref={ref || quillRef}
      value={content}
      onChange={handleChange}
      modules={modules}
      formats={formats}
      theme="snow"
    />
  );
});

QuillWrapper.propTypes = {
  initialContent: PropTypes.string,
  onChange: PropTypes.func,
};

export default QuillWrapper;