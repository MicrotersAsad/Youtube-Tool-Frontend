import React, { useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';

const EditorWrapper = ({ data, onChange }) => {
  const editorInstance = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@editorjs/header').then((Header) => {
        import('@editorjs/image').then((ImageTool) => {
          import('@editorjs/simple-image').then((SimpleImage) => {
            import('@editorjs/list').then((List) => {
              import('@editorjs/embed').then((Embed) => {
                import('@editorjs/table').then((Table) => {
                  import('@editorjs/code').then((CodeTool) => {
                    import('@editorjs/link').then((LinkTool) => {
                      import('@editorjs/marker').then((Marker) => {
                        import('@editorjs/paragraph').then((Paragraph) => {
                          editorInstance.current = new EditorJS({
                            holder: 'editorjs',
                            autofocus: true,
                            data: data,
                            tools: {
                              header: Header.default,
                              image: {
                                class: ImageTool.default,
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
                              simpleImage: SimpleImage.default,
                              list: List.default,
                              embed: Embed.default,
                              table: Table.default,
                              code: CodeTool.default,
                              linkTool: LinkTool.default,
                              marker: Marker.default,
                              paragraph: Paragraph.default,
                            },
                            onChange: async () => {
                              const savedData = await editorInstance.current.save();
                              onChange(savedData);
                            },
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });

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
