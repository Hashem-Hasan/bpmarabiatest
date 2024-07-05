import React, { useEffect, useRef, useState } from 'react';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

const ReadOnlyBpmnViewer = ({ diagramXml }) => {
  const viewerRef = useRef(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    viewerRef.current = new BpmnViewer({
      container: '#bpmn-container',
      width: '100%',
      height: '100%',
    });

    viewerRef.current.on('element.click', handleElementClick);

    if (diagramXml) {
      importDiagram(diagramXml);
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, [diagramXml]);

  const importDiagram = async (xml) => {
    try {
      await viewerRef.current.importXML(xml);
      viewerRef.current.get('canvas').zoom('fit-viewport');
    } catch (err) {
      console.error('Error importing BPMN diagram:', err);
    }
  };

  const handleElementClick = (event) => {
    const element = event.element;
    if (element.type === 'bpmn:Task' || element.type === 'bpmn:StartEvent' || element.type === 'bpmn:EndEvent') {
      setSelectedElement(element);
      setAttachments(element.businessObject.$attrs.attachments ? JSON.parse(element.businessObject.$attrs.attachments) : []);
      setComments(element.businessObject.$attrs.comments ? JSON.parse(element.businessObject.$attrs.comments) : []);
    } else {
      setSelectedElement(null);
      setAttachments([]);
      setComments([]);
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div id="bpmn-container" className="w-full h-96 border border-gray-300 mb-4"></div>
      {selectedElement && (
        <div className="flex flex-row space-x-4 w-full h-64 overflow-auto">
          <div className="attachments w-1/2">
            <h3 className="text-lg font-semibold">Attachments</h3>
            {attachments.length > 0 ? (
              <ul className="list-disc">
                {attachments.map((attachment, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                      {attachment.name}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No attachments</p>
            )}
          </div>
          <div className="comments w-1/2">
            <h3 className="text-lg font-semibold">Comments</h3>
            {comments.length > 0 ? (
              <ul className="list-disc overflow-y-auto h-full">
                {comments.map((comment, index) => (
                  <li key={index} className="p-2 border-b border-gray-300">
                    <p>{comment}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No comments</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadOnlyBpmnViewer;
