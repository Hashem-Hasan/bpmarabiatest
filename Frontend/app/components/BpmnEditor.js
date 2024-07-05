import React, { useEffect, useRef, useState } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import CustomPaletteProvider from './CustomPaletteProvider';
import axios from 'axios';
import { Spinner } from "@nextui-org/react";
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const BpmnEditor = ({ onSave, diagramToEdit }) => {
  const modelerRef = useRef(null);
  const [diagramName, setDiagramName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [diagramId, setDiagramId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDiagramLoaded, setIsDiagramLoaded] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    modelerRef.current = new BpmnModeler({
      container: '#bpmn-container',
      width: '100%',
      additionalModules: [
        {
          __init__: ['customPaletteProvider'],
          customPaletteProvider: ['type', CustomPaletteProvider]
        }
      ],
    });

    modelerRef.current.on('element.click', handleElementClick);

    return () => {
      if (modelerRef.current) {
        modelerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (diagramToEdit) {
      setDiagramName(diagramToEdit.name);
      setDiagramId(diagramToEdit._id);
      importDiagram(diagramToEdit.xml);
      fetchCompanyDetails(diagramToEdit.creator);
    }
  }, [diagramToEdit]);

  const fetchCompanyDetails = async (creatorId) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_HOST}/api/user/${creatorId}`);
      const { companyName, phoneNumber } = response.data;
      setCompanyName(companyName);
      setPhoneNumber(phoneNumber);
    } catch (err) {
      console.error('Error fetching company details:', err);
    }
  };

  const importDiagram = async (xml) => {
    try {
      await modelerRef.current.importXML(xml);
      modelerRef.current.get('canvas').zoom('fit-viewport');
      setIsDiagramLoaded(true);
    } catch (err) {
      console.error('Error importing BPMN diagram:', err);
    }
  };

  const createNewDiagram = async () => {
    const newDiagram = `<?xml version="1.0" encoding="UTF-8"?>
      <bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
          xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
          xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
          targetNamespace="http://bpmn.io/schema/bpmn">
        <bpmn:process id="Process_1" isExecutable="false">
          <bpmn:startEvent id="StartEvent_1"/>
        </bpmn:process>
        <bpmndi:BPMNDiagram id="BPMNDiagram_1">
          <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
            <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
              <dc:Bounds x="173" y="102" width="36" height="36"/>
            </bpmndi:BPMNShape>
          </bpmndi:BPMNPlane>
        </bpmndi:BPMNDiagram>
      </bpmn:definitions>`;

    try {
      await modelerRef.current.importXML(newDiagram);
      modelerRef.current.get('canvas').zoom('fit-viewport');
      setIsDiagramLoaded(true);
    } catch (err) {
      console.error('Error creating new BPMN diagram:', err);
    }
  };

  const saveDiagram = async () => {
    if (!diagramName.trim()) {
      alert('Diagram name is required');
      return;
    }

    try {
      const { xml } = await modelerRef.current.saveXML({ format: true });
      if (!xml || xml.trim().length === 0) {
        alert('Diagram content is required');
        return;
      }
      setLoading(true);
      const token = localStorage.getItem('employeeToken');
      if (onSave) {
        await onSave({ id: diagramId, name: diagramName, xml, token });
      }
    } catch (err) {
      console.error('Error saving BPMN diagram:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportDiagram = async () => {
    const canvas = modelerRef.current.get('canvas');
    canvas.zoom('fit-viewport'); // Ensure the diagram fits within the viewport
  
    const diagramCanvas = canvas._container;
    const svgElement = diagramCanvas.querySelector('svg');
  
    if (!svgElement) {
      alert('BPMN diagram element not found');
      return;
    }
  
    const canvasElement = diagramCanvas.cloneNode(true);
    const palette = canvasElement.querySelector('.djs-palette');
    const minimap = canvasElement.querySelector('.djs-minimap');
    const tool = canvasElement.querySelector('.djs-tool');
    if (palette) palette.remove();
    if (minimap) minimap.remove();
    if (tool) tool.remove();
  
    // Fetch company info
    let companyName = '';
    let phoneNumber = '';
  
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('employeeToken');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_HOST}/api/company/company-info/${diagramToEdit._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      companyName = response.data.companyName;
      phoneNumber = response.data.phoneNumber;
    } catch (error) {
      console.error('Error fetching company info:', error);
      alert('Error fetching company info. Please try again.');
      return;
    }
  
    // Create a temporary container for the cloned canvas
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '0';
    tempContainer.style.left = '0';
    tempContainer.style.width = '100%';
    tempContainer.style.height = '100%';
    tempContainer.style.zIndex = '-1';
    document.body.appendChild(tempContainer);
    tempContainer.appendChild(canvasElement);
  
    // Use html2canvas to capture the diagram as a canvas
    html2canvas(canvasElement, { scale: 3 }).then((canvas) => {
      document.body.removeChild(tempContainer); // Clean up the temporary container
  
      const context = canvas.getContext('2d');
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  
      // Calculate the bounding box of the non-transparent pixels
      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = 0;
      let maxY = 0;
  
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const index = (y * canvas.width + x) * 4;
          const alpha = imageData.data[index + 3];
          if (alpha > 0) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }
  
      const croppedWidth = maxX - minX + 1;
      const croppedHeight = maxY - minY + 1;
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = croppedWidth;
      croppedCanvas.height = croppedHeight;
      const croppedContext = croppedCanvas.getContext('2d');
      croppedContext.putImageData(context.getImageData(minX, minY, croppedWidth, croppedHeight), 0, 0);
  
      const imgData = croppedCanvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', undefined, [croppedWidth / 3, croppedHeight / 3]);
  
      // Add diagram name, company name, and phone number at the top
      pdf.setFontSize(36);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const text = `${companyName}     ${diagramName}     ${phoneNumber}`;
      const textWidth = pdf.getStringUnitWidth(text) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
      const textX = (pageWidth - textWidth) / 2;
      pdf.text(text, textX, 20);
  
      pdf.addImage(imgData, 'PNG', 0, 40, pageWidth, pdf.internal.pageSize.getHeight() - 50);
      pdf.save(`${diagramName}.pdf`);
    }).catch((error) => {
      console.error('Error capturing diagram:', error);
      alert('Error exporting diagram. Please try again.');
    });
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

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    const newAttachments = [];
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let uploadUrl = '';

      if (file.type.startsWith('image/')) {
        uploadUrl = await uploadToImgBB(file);
      } else if (file.type.startsWith('video/')) {
        uploadUrl = await uploadToBackend(file);
      }

      if (uploadUrl) {
        newAttachments.push({
          name: file.name,
          url: uploadUrl,
          type: file.type
        });
      }

      if (i === files.length - 1) {
        updateElementAttachments(newAttachments);
        setUploading(false);
      }
    }
  };

  const uploadToImgBB = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', '5990a44a9ee7af4103ba3c8fc39c2337');

    try {
      const response = await axios.post('https://api.imgbb.com/1/upload', formData);
      return response.data.data.url;
    } catch (err) {
      console.error('Error uploading image to imgbb:', err);
      return '';
    }
  };

  const uploadToBackend = async (file) => {
    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await axios.post('http://localhost:3001/api/upload/upload-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('employeeToken')}` // Include employee token here
        }
      });
      return response.data.url;
    } catch (err) {
      console.error('Error uploading video to backend:', err);
      return '';
    }
  };

  const updateElementAttachments = (newAttachments) => {
    if (selectedElement) {
      const modeling = modelerRef.current.get('modeling');
      const businessObject = selectedElement.businessObject;
      const existingAttachments = businessObject.$attrs.attachments ? JSON.parse(businessObject.$attrs.attachments) : [];

      const updatedAttachments = [...existingAttachments, ...newAttachments];
      businessObject.$attrs.attachments = JSON.stringify(updatedAttachments);
      modeling.updateProperties(selectedElement, {
        attachments: businessObject.$attrs.attachments,
      });
      setAttachments(updatedAttachments);
    }
  };

  const handleAttachmentDelete = (index) => {
    if (selectedElement) {
      const modeling = modelerRef.current.get('modeling');
      const businessObject = selectedElement.businessObject;
      const existingAttachments = businessObject.$attrs.attachments ? JSON.parse(businessObject.$attrs.attachments) : [];

      existingAttachments.splice(index, 1);
      businessObject.$attrs.attachments = JSON.stringify(existingAttachments);
      modeling.updateProperties(selectedElement, {
        attachments: businessObject.$attrs.attachments,
      });
      setAttachments(existingAttachments);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const updatedComments = [...comments, newComment];
    if (selectedElement) {
      const modeling = modelerRef.current.get('modeling');
      const businessObject = selectedElement.businessObject;
      businessObject.$attrs.comments = JSON.stringify(updatedComments);
      modeling.updateProperties(selectedElement, {
        comments: businessObject.$attrs.comments,
      });
      setComments(updatedComments);
      setNewComment('');
    }
  };

  const handleCommentDelete = (index) => {
    const updatedComments = comments.filter((_, i) => i !== index);
    if (selectedElement) {
      const modeling = modelerRef.current.get('modeling');
      const businessObject = selectedElement.businessObject;
      businessObject.$attrs.comments = JSON.stringify(updatedComments);
      modeling.updateProperties(selectedElement, {
        comments: businessObject.$attrs.comments,
      });
      setComments(updatedComments);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div id="bpmn-container" className="w-full h-96 border border-gray-300 mb-4"></div>
      <div className="w-full flex flex-col items-center">
        <input 
          type="text" 
          required
          value={diagramName} 
          onChange={(e) => setDiagramName(e.target.value)} 
          placeholder="Enter diagram name" 
          className="mb-2 p-2 border border-gray-300 transition-all rounded-md w-1/2"
          disabled={!diagramToEdit && !isDiagramLoaded}
        />
        <div className="flex space-x-2">
          <button 
            onClick={createNewDiagram} 
            className="bg-blue-500 text-white py-2 px-4 rounded-md transition-all hover:bg-blue-700"
          >
            New Diagram
          </button>
          <button 
            onClick={saveDiagram} 
            className={`bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-all ${loading || !diagramName.trim() || !isDiagramLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading || !diagramName.trim() || !isDiagramLoaded}
          >
            {loading ? 'Saving...' : 'Save Diagram'}
          </button>
          <button 
            onClick={exportDiagram} 
            className="bg-purple-500 text-white py-2 px-4 rounded-md transition-all hover:bg-purple-700"
          >
            Export as PDF
          </button>
        </div>
      </div>
      {selectedElement && (
        <div className="w-full flex flex-col items-center mt-4">
          <h3 className="text-lg font-semibold">Attachments</h3>
          <input 
            type="file"
            multiple
            onChange={handleFileUpload}
            className="mb-2 p-2 border border-gray-300 transition-all rounded-md w-1/2"
          />
          {uploading && (
            <div className="flex justify-center items-center mt-2">
              <Spinner size="lg" color="warning" />
            </div>
          )}
          {attachments.length > 0 ? (
            <ul className="list-disc">
              {attachments.map((attachment, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                    {attachment.name}
                  </a>
                  <button
                    onClick={() => handleAttachmentDelete(index)}
                    className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No attachments</p>
          )}
          <h3 className="text-lg font-semibold mt-4">Comments</h3>
          <div className="mb-2 p-2 border border-gray-300 transition-all rounded-md w-1/2">
            <input 
              type="text" 
              value={newComment} 
              onChange={(e) => setNewComment(e.target.value)} 
              placeholder="Enter comment" 
              className="w-full p-2 border border-gray-300 rounded"
            />
            <button 
              onClick={handleAddComment} 
              className="bg-blue-500 text-white py-2 px-4 rounded-md transition-all hover:bg-blue-700 mt-2"
            >
              Add Comment
            </button>
          </div>
          {comments.length > 0 ? (
            <ul className="list-disc w-1/2">
              {comments.map((comment, index) => (
                <li key={index} className="flex justify-between items-center p-2 border-b border-gray-300">
                  <span>{comment}</span>
                  <button
                    onClick={() => handleCommentDelete(index)}
                    className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No comments</p>
          )}
        </div>
      )}
    </div>
  );
};

export default BpmnEditor;
