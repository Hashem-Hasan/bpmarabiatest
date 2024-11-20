import React, { useEffect, useRef, useState } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import CustomPaletteProvider from './CustomPaletteProvider';
import axios from 'axios';
import { Spinner, Input, Button } from "@nextui-org/react";
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import DiagramExporter from './DiagramExporter';
import { FaPlus, FaTrashAlt, FaSave } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import ProcessList from './ProcessList';
import { Listbox } from '@headlessui/react';
import { CheckIcon, SelectorIcon } from '@heroicons/react/solid';
import Router from 'next/router';

const BpmnEditor = ({ diagramToEdit, onClear }) => {
  const modelerRef = useRef(null);
  const processListRef = useRef(null); // Reference to ProcessList
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
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  

  const [mainUserToken, setMainUserToken] = useState(null);
  const [employeeToken, setEmployeeToken] = useState(null);
  const [selectedDiagram, setSelectedDiagram] = useState(diagramToEdit);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMainUserToken(localStorage.getItem('token'));
      setEmployeeToken(localStorage.getItem('employeeToken'));
    }
  }, []);

  useEffect(() => {
    if (
      (selectedDiagram || isDiagramLoaded) &&
      (mainUserToken || employeeToken)
    ) {
      fetchDepartments();
    }
  }, [selectedDiagram, isDiagramLoaded, mainUserToken, employeeToken]);

  const fetchDepartments = async () => {
    const token = mainUserToken || employeeToken;
    if (!token) {
      console.error('No token available for fetching departments');
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/department-structure`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDepartments(response.data.departments);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const getDepartmentNameById = (id, departmentsList = departments) => {
    for (const department of departmentsList) {
      if (department._id === id) {
        return department.name;
      } else if (department.subDepartments) {
        const name = getDepartmentNameById(id, department.subDepartments);
        if (name) return name;
      }
    }
    return '';
  };

  const renderDepartmentOptions = (departments, level = 0) => {
    return departments.map((department) => (
      <React.Fragment key={department._id}>
        <Listbox.Option
          className={({ active }) =>
            `relative cursor-default select-none py-2 pl-${4 + level * 2} pr-4 ${
              active ? 'bg-indigo-600 text-white' : 'text-gray-900'
            }`
          }
          value={department._id}
        >
          {({ selected, active }) => (
            <>
              <span
                className={`block truncate ${
                  selected ? 'font-medium' : 'font-normal'
                }`}
              >
                {'-'.repeat(level * 2) + department.name}
              </span>
              {selected ? (
                <span
                  className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                    active ? 'text-white' : 'text-indigo-600'
                  }`}
                >
                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                </span>
              ) : null}
            </>
          )}
        </Listbox.Option>
        {department.subDepartments &&
          renderDepartmentOptions(department.subDepartments, level + 1)}
      </React.Fragment>
    ));
  };

  const handleUndo = () => {
    const commandStack = modelerRef.current.get('commandStack');
    commandStack.undo();
  };

  useEffect(() => {
    modelerRef.current = new BpmnModeler({
      container: '#bpmn-container',
      width: '100%',
      hideLogo: true,
      additionalModules: [
        {
          __init__: ['customPaletteProvider'],
          customPaletteProvider: ['type', CustomPaletteProvider],
        },
      ],
    });

    modelerRef.current.on('element.click', handleElementClick);

    // Listen for changes to the diagram to track unsaved changes
    const handleDiagramChange = () => {
      setIsDirty(true);
    };

    modelerRef.current.on('commandStack.changed', handleDiagramChange);

    // Keyboard shortcut for undo
    const keyboard = modelerRef.current.get('keyboard');
    keyboard.addListener((context) => {
      const event = context.keyEvent;
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        handleUndo();
      }
    });

    return () => {
      if (modelerRef.current) {
        modelerRef.current.destroy();
      }
    };
  }, []);

  // Handle beforeunload to alert unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty || selectedDiagram || isDiagramLoaded) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, selectedDiagram, isDiagramLoaded]);

  // Handle route changes within Next.js
  useEffect(() => {
    const handleRouteChange = (url) => {
      if (isDirty || selectedDiagram || isDiagramLoaded) {
        const confirmLeave = confirm(
          'You have unsaved changes or a selected diagram. Are you sure you want to leave?'
        );
        if (!confirmLeave) {
          Router.events.emit('routeChangeError');
          throw 'Route change aborted due to unsaved changes';
        }
      }
    };

    Router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      Router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [isDirty, selectedDiagram, isDiagramLoaded]);

  useEffect(() => {
    if (selectedDiagram) {
      setDiagramName(selectedDiagram.name);
      setDiagramId(selectedDiagram._id);
      importDiagram(selectedDiagram.xml);
      fetchCompanyDetails(selectedDiagram.creator);

      // Set selected department if available
      if (selectedDiagram.department && selectedDiagram.department._id) {
        setSelectedDepartment(selectedDiagram.department._id);
      }
      setIsDirty(false); // Diagram loaded, no unsaved changes
    }
  }, [selectedDiagram]);

  const fetchCompanyDetails = async (creatorId) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/user/${creatorId}`
      );
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
      setIsDirty(true); // New diagram created, mark as unsaved
      setDiagramId(null); // Reset diagramId
      setDiagramName(''); // Reset diagram name
    } catch (err) {
      console.error('Error creating new BPMN diagram:', err);
    }
  };

  const saveDiagram = async () => {
    if (!diagramName.trim()) {
      alert('Diagram name is required');
      return;
    }

    if (!selectedDepartment) {
      alert('Please select a department');
      return;
    }

    try {
      const { xml } = await modelerRef.current.saveXML({ format: true });
      if (!xml || xml.trim().length === 0) {
        alert('Diagram content is required');
        return;
      }
      setLoading(true);

      const token = mainUserToken || employeeToken;

      const payload = {
        id: diagramId,
        name: diagramName,
        xml,
        department: selectedDepartment,
      };

      console.log('Submitting payload:', payload);

      let response;
      if (diagramId) {
        // Update existing diagram
        response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/${diagramId}`,
          { name: diagramName, xml, department: selectedDepartment },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        // Create new diagram
        response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes`,
          { name: diagramName, xml, department: selectedDepartment },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // If new diagram, set the diagramId
        setDiagramId(response.data._id);
      }

      alert('Diagram saved successfully!');
      setIsDirty(false);

       // Fetch the updated diagram data
       const updatedDiagramResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/${response.data._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const updatedDiagram = updatedDiagramResponse.data;

      // Update the selected diagram with the latest data
      setSelectedDiagram(updatedDiagram);

      // Refresh diagrams in ProcessList
      if (
        processListRef.current &&
        processListRef.current.refreshDiagrams
      ) {
        processListRef.current.refreshDiagrams();
      }
    } catch (err) {
      console.error('Error saving BPMN diagram:', err);

      if (err.response && err.response.status === 403) {
        alert(
          err.response.data.message ||
            'You do not have permission to perform this action.'
        );
      } else {
        alert('An error occurred while saving the diagram. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = async () => {
    setDiagramName('');
    setCompanyName('');
    setPhoneNumber('');
    setDiagramId(null);
    setIsDiagramLoaded(false);
    setSelectedElement(null);
    setAttachments([]);
    setComments([]);
    setSelectedDiagram(null);
    setIsDirty(false);

    if (modelerRef.current) {
      modelerRef.current.destroy();
    }

    modelerRef.current = new BpmnModeler({
      container: '#bpmn-container',
      width: '100%',
      additionalModules: [
        {
          __init__: ['customPaletteProvider'],
          customPaletteProvider: ['type', CustomPaletteProvider],
        },
      ],
    });

    modelerRef.current.on('element.click', handleElementClick);

    const handleDiagramChange = () => {
      setIsDirty(true);
    };

    modelerRef.current.on('commandStack.changed', handleDiagramChange);

    if (onClear) {
      onClear();
    }
  };

  const handleElementClick = (event) => {
    const element = event.element;
    if (
      element.type === 'bpmn:Task' ||
      element.type === 'bpmn:StartEvent' ||
      element.type === 'bpmn:EndEvent'
    ) {
      setSelectedElement(element);
      setAttachments(
        element.businessObject.$attrs.attachments
          ? JSON.parse(element.businessObject.$attrs.attachments)
          : []
      );
      setComments(
        element.businessObject.$attrs.comments
          ? JSON.parse(element.businessObject.$attrs.comments)
          : []
      );
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

    // Process all files concurrently
    const uploadPromises = Array.from(files).map(async (file) => {
        let uploadUrl = '';

        if (file.type.startsWith('image/')) {
            uploadUrl = await uploadToImgBB(file);
        } else if (file.type.startsWith('video/')) {
            uploadUrl = await uploadToBackend(file);
        }

        if (uploadUrl) {
            return {
                name: file.name,
                url: uploadUrl,
                type: file.type,
            };
        }

        return null;
    });

    try {
        // Wait for all uploads to finish
        const uploadedFiles = await Promise.all(uploadPromises);

        // Filter out any failed uploads
        const successfulUploads = uploadedFiles.filter(Boolean);

        // Update attachments with successful uploads
        if (successfulUploads.length > 0) {
            updateElementAttachments(successfulUploads);
        }
    } catch (err) {
        console.error('Error uploading files:', err);
    } finally {
        setUploading(false);
    }
};


  const uploadToImgBB = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', '5990a44a9ee7af4103ba3c8fc39c2337'); // Replace with your ImgBB API key

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
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/upload/upload-video`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('employeeToken')}`,
          },
        }
      );
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
      const existingAttachments = businessObject.$attrs.attachments
        ? JSON.parse(businessObject.$attrs.attachments)
        : [];

      const updatedAttachments = [...existingAttachments, ...newAttachments];
      businessObject.$attrs.attachments = JSON.stringify(updatedAttachments);
      modeling.updateProperties(selectedElement, {
        attachments: businessObject.$attrs.attachments,
      });
      setAttachments(updatedAttachments);
      setIsDirty(true); // Changes made, mark as unsaved
    }
  };

  const handleAttachmentDelete = (index) => {
    if (selectedElement) {
      const modeling = modelerRef.current.get('modeling');
      const businessObject = selectedElement.businessObject;
      const existingAttachments = businessObject.$attrs.attachments
        ? JSON.parse(businessObject.$attrs.attachments)
        : [];

      existingAttachments.splice(index, 1);
      businessObject.$attrs.attachments = JSON.stringify(existingAttachments);
      modeling.updateProperties(selectedElement, {
        attachments: businessObject.$attrs.attachments,
      });
      setAttachments(existingAttachments);
      setIsDirty(true); // Changes made, mark as unsaved
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
      setIsDirty(true); // Changes made, mark as unsaved
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
      setIsDirty(true); // Changes made, mark as unsaved
    }
  };

  return (
    <div className="flex w-full h-full">
      {/* Left column: ProcessList */}
      <div className=" w-1/6  flex-shrink-0">
      <ProcessList
          ref={processListRef} // Attach ref to ProcessList
          onDiagramSelect={setSelectedDiagram}
          mainUserToken={mainUserToken}
          employeeToken={employeeToken}
          createNewDiagram={createNewDiagram}
          clearSelection={clearSelection}
          selectedDiagram={selectedDiagram}
          isDiagramLoaded={isDiagramLoaded}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-grow">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-2 mt-2 px-4">
          {/* Left side: Diagram name input and department selector */}
          <div className="flex items-center space-x-2">
            {/* Diagram name input */}
            <input
              type="text"
              required
              value={diagramName}
              onChange={(e) => {
                setDiagramName(e.target.value);
                setIsDirty(true); // Mark as unsaved when name changes
              }}
              placeholder="Enter diagram name"
              className="p-2 shadow-sm transition-all rounded-md border border-gray-300"
              disabled={!selectedDiagram && !isDiagramLoaded}
            />

            {/* Department selector */}
            {(selectedDiagram || isDiagramLoaded) && (
              <div className="w-full max-w-xs">
                <Listbox value={selectedDepartment} onChange={(value) => {
                  setSelectedDepartment(value);
                  setIsDirty(true); // Mark as unsaved when department changes
                }}>
                  {({ open }) => (
                    <>
                      <div className="relative">
                        <Listbox.Button className="relative w-60 cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <span className="block truncate">
                            {getDepartmentNameById(selectedDepartment) || 'Select Department'}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <SelectorIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </span>
                        </Listbox.Button>

                        <AnimatePresence>
                          {open && (
                            <Listbox.Options
                              static
                              as={motion.ul}
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-start px-5 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                            >
                              {renderDepartmentOptions(departments)}
                            </Listbox.Options>
                          )}
                        </AnimatePresence>
                      </div>
                    </>
                  )}
                </Listbox>
              </div>
            )}
          </div>

          {/* Right side: Buttons */}
          <div className="flex items-center space-x-2">


<button
  onClick={saveDiagram}
  disabled={loading || !diagramName.trim() || !isDiagramLoaded}
  className={`text-center text-xl w-full py-2 px-4 rounded-md transition-all ${
    loading || !diagramName.trim() || !isDiagramLoaded
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' // Disabled styles
      : 'text-black hover:bg-gray-200' // Enabled styles
  }`}
>
  {loading ? <Spinner size="sm" color="primary" /> : <FaSave />}
</button>


            {/* DiagramExporter with icon-only button */}
            <DiagramExporter
              modelerRef={modelerRef}
              diagramToEdit={selectedDiagram}
              diagramName={diagramName}
              iconOnly={true} // Pass prop to render icon-only button
            />
          </div>
        </div>

        {/* BPMN editor */}
        <div
          id="bpmn-container"
          className="flex-grow h-full w-full border-y-1 border-gray-300 "
        ></div>
      </div>

      {/* Right column: Attachments and comments */}
<div className="flex flex-col border-l-1 border-gray-300 h-full items-center w-1/6 flex-shrink-0">
  <div className="w-full p-6 flex flex-col h-[600px]">
    {selectedElement ? (
      <>
        <h3 className="text-xl font-semibold mb-3">Attachments</h3>
        <Button
          auto
          flat
          as="label"
          htmlFor="file-upload"
          className="mb-4 w-full"
        >
          Upload Files
          <input
            type="file"
            id="file-upload"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </Button>
        {uploading && (
          <div className="flex justify-center items-center mt-4">
            <Spinner size="lg" color="primary" />
          </div>
        )}
        {attachments.length > 0 ? (
          <ul className="mb-4">
            {attachments.map((attachment, index) => (
              <li
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-200"
              >
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 w-1/2 overflow-hidden hover:underline"
                >
                  {attachment.name}
                </a>
                <Button
                  auto
                  flat
                  color="error"
                  onClick={() => handleAttachmentDelete(index)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 mb-4">No attachments</p>
        )}
        <h3 className="text-xl border-t border-gray-300 pt-5 font-semibold mb-4">
          Comments
        </h3>
        <div className="flex-1 overflow-y-auto mb-4">
          {comments.length > 0 ? (
            <AnimatePresence>
              {comments.map((comment, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-3"
                >
                  <div className="border rounded-md shadow-sm">
                    <div className="flex justify-between items-center p-3">
                      <span className="break-words overflow-hidden">
                        {comment}
                      </span>
                      <Button
                        auto
                        flat
                        color="error"
                        onClick={() => handleCommentDelete(index)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <p className="text-gray-500">No comments yet</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Input
            clearable
            underlined
            fullWidth
            placeholder="Enter comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddComment();
              }
            }}
          />
          <button
            auto
            flat
            onClick={handleAddComment}
            className='bg-[#14BAB6] px-3 py-3 rounded-lg text-white'
          >
            <FaSave />
          </button>
        </div>
      </>
    ) : (
      <div className="text-center text-gray-500">
        <p className="text-xl">No element selected</p>
      </div>
    )}
  </div>
</div>

      </div>
    
  );
};

export default BpmnEditor;
