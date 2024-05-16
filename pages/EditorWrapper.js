import React, { useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import ImageTool from '@editorjs/image';
import SimpleImage from '@editorjs/simple-image';
import List from '@editorjs/list';
import Embed from '@editorjs/embed';
import Table from '@editorjs/table';
import CodeTool from '@editorjs/code';
import LinkTool from '@editorjs/link';
import Marker from '@editorjs/marker';
import Paragraph from '@editorjs/paragraph';

const EditorWrapper = ({ data, onChange }) => {
  const editorInstance = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initializeEditor = () => {
        editorInstance.current = new EditorJS({
          holder: 'editorjs',
          autofocus: true,
          data: data,
          tools: {
            header: Header,
            image: {
              class: ImageTool,
              config: {
                endpoints: {
                  byFile: 'your-image-upload-endpoint', // Your backend file upload endpoint
                  byUrl: 'your-image-fetch-endpoint', // Your endpoint to fetch image by URL
                },
                additionalRequestHeaders: {
                  Authorization: 'Bearer <your-token>', // If you need any authorization headers
                },
              },
            },
            simpleImage: SimpleImage,
            list: List,
            embed: Embed,
            table: Table,
            code: CodeTool,
            linkTool: LinkTool,
            marker: Marker,
            paragraph: Paragraph,
          },
          onChange: async () => {
            const savedData = await editorInstance.current.save();
            onChange(savedData);
          },
        });
      };

      initializeEditor();

      return () => {
        if (editorInstance.current && typeof editorInstance.current.destroy === 'function') {
          editorInstance.current.destroy();
        }
        editorInstance.current = null;
      };
    }
  }, [data, onChange]);

  return <div id="editorjs" className="bg-white p-5 rounded border"></div>;
};

export default EditorWrapper;
