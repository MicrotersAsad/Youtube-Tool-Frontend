import React, { useEffect, useState, useRef, forwardRef } from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';

// Dynamically import jodit-react with no SSR
const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

const JoditWrapper = forwardRef(({ initialContent = '', onChange = () => {} }, ref) => {
  const [content, setContent] = useState(initialContent);
  const editorRef = useRef(null);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);
  const handleEditorChange = (value) => {
    setContent(value);
    onChange(value);
  };
  
  const config = {
    readonly: false,
    toolbarAdaptive: false,
    toolbarSticky: false,
    toolbar: true,
    height: 400,
    buttons: [
      'source', '|',
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|',
      'outdent', 'indent', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'table', 'link', '|',
      'align', 'undo', 'redo', '|',
      'hr', 'eraser', 'fullsize'
    ],
    events: {
      blur: handleEditorChange,  // update content on blur event
      focus: () => {}  // Optional: Handle focus event if needed
    }
  };
  

  return (
    <JoditEditor
      ref={ref || editorRef}
      value={content}
      config={config}
      onBlur={handleEditorChange} // preferred to use `onBlur` instead of `onChange` for better performance
    />
  );
});

JoditWrapper.propTypes = {
  initialContent: PropTypes.string,
  onChange: PropTypes.func,
};

export default JoditWrapper;
