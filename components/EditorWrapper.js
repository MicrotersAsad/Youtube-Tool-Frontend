import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import react-quill with no SSR
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const QuillWrapper = ({ initialContent, onChange }) => {
  const [content, setContent] = useState(initialContent || '');
  const quillRef = useRef(null);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleChange = (value) => {
    setContent(value);
    onChange(value);
  };

  const imageHandler = () => {
    const url = prompt('Enter the image URL');
    if (url) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      quill.insertEmbed(range.index, 'image', url);
    }
  };

  const modules = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'font': [] }],
        [{ 'align': [] }],
        ['clean'],
        ['image']
      ],
     
    },
  };

  const formats = [
    'header', 'font',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'script', 'indent', 'direction', 'size', 'color', 'background',
    'link', 'image', 'video', 'align', 'code-block', 'clean'
  ];

  return (
    <ReactQuill
      ref={quillRef}
      value={content}
      onChange={handleChange}
      modules={modules}
      formats={formats}
      theme="snow"
    />
  );
};

QuillWrapper.propTypes = {
  initialContent: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default QuillWrapper;
