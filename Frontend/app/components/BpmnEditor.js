import React, { useEffect, useRef, useState } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import CustomPaletteProvider from './CustomPaletteProvider';
import axios from 'axios';
import { Spinner } from "@nextui-org/react";
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import DiagramExporter from './DiagramExporter';
import { FaBars } from 'react-icons/fa';
import Image from 'next/image';
import { Button, Input, Card } from '@nextui-org/react';
import { Plus } from 'react-feather';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import ProcessList from './ProcessList';
import { Listbox } from '@headlessui/react';
import { CheckIcon, SelectorIcon } from '@heroicons/react/solid'; // Importing icons

const BpmnEditor = ({ onSave, diagramToEdit, onClear }) => {
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
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false); // For handling dropdown state

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
    if (selectedDiagram || isDiagramLoaded) {
      fetchDepartments();
    }
  }, [selectedDiagram, isDiagramLoaded]);

  const fetchDepartments = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('employeeToken');
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_HOST}/api/department-structure`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDepartments(response.data.departments);

      if (selectedDiagram && selectedDiagram.department) {
        setSelectedDepartment(selectedDiagram.department);
      }
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
                className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}
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

  useEffect(() => {
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

    return () => {
      if (modelerRef.current) {
        modelerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedDiagram) {
      setDiagramName(selectedDiagram.name);
      setDiagramId(selectedDiagram._id);
      importDiagram(selectedDiagram.xml);
      fetchCompanyDetails(selectedDiagram.creator);
    }
  }, [selectedDiagram]);

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

      const payload = {
        id: diagramId,
        name: diagramName,
        xml,
        department: selectedDepartment,
      };

      console.log('Submitting payload:', payload);

      if (onSave) {
        const success = await onSave(payload); // Wait for onSave to complete and check its result
        if (success) {
          clearSelection(); // Call clearSelection instead of onClear
        }
      }
    } catch (err) {
      console.error('Error saving BPMN diagram:', err);

      // Check if the error response is 403
      if (err.response && err.response.status === 403) {
        alert(err.response.data.message || 'You do not have permission to perform this action.');
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
    setSelectedDepartment('');
    setSelectedDiagram(null);

    // Destroy the existing modeler instance
    if (modelerRef.current) {
      modelerRef.current.destroy();
    }

    // Recreate a new instance of the modeler
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

    // Add event listeners back to the new instance
    modelerRef.current.on('element.click', handleElementClick);

    if (onClear) {
      onClear(); // Call clear handler to sync with parent state
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
          type: file.type,
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
      const response = await axios.post(
        'http://localhost:3001/api/upload/upload-video',
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

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <div className="flex flex-row-reverse gap-3 justify-center pt-14 items-center">
      <div className="flex flex-col items-center ">
      <div className="  w-[200px]  p-6 flex flex-col h-[600px]">
  {selectedElement ? (
    <>
      <h3 className="text-2xl font-bold mb-3">Attachments</h3>
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
          {/* Replace with your Spinner component */}
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
                className="text-blue-600 hover:underline"
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
      <h3 className="text-2xl border-t border-gray-300 pt-5 font-bold mb-4">
        Comments
      </h3>
      {/* Scrollable Comments Section */}
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
      {/* Comment Input */}
      <div className="flex items-center">
        <Input
          clearable
          underlined
          fullWidth
          placeholder="Enter comment"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault(); // Prevent form submission if inside a form
              handleAddComment();
            }
          }}
        />
      </div>
    </>
  ) : (
    <div className="text-center text-gray-500">
      <p className="text-xl">No element selected</p>
    </div>
  )}
</div>

      </div>

      <div
        id="bpmn-container"
        className="w-[1200px] h-[600px] shadow-lg  rounded-2xl border-gray-300 mb-4"
      ></div>

      <div className="flex w-[250px] h-[590px] flex-col">
        <div className="flex flex-col bg-white shadow-md p-3 border-1 border-gray-300 rounded-lg mb-6">
          {/* Flex row containing diagram name input and dropdown menu icon */}
          <div className="flex flex-row-reverse items-center">
            <input
              type="text"
              required
              value={diagramName}
              onChange={(e) => setDiagramName(e.target.value)}
              placeholder="Enter diagram name"
              className="mb-2 p-2 shadow-sm transition-all rounded-md w-full"
              disabled={!selectedDiagram && !isDiagramLoaded}
            />
            {/* Dropdown Button */}
            <div className="relative mr-2">
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2"
              >
                {/* Replace FaBars with your custom image */}
                <Image src="/Group 1.png" alt="Group 1" width={25} height={25} />
                {/* Toggle Arrow Icon */}
                {dropdownOpen ? (
                  <FaChevronUp className="text-xl" />
                ) : (
                  <FaChevronDown className="text-xl" />
                )}
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white shadow-md border rounded-md z-10"
                  >
                    <ul className="flex flex-col p-2 space-y-2">
                      {selectedDiagram || isDiagramLoaded ? (
                        <li>
                          <button
                            onClick={clearSelection}
                            className="w-full text-center text-gray-500 py-2 px-4 rounded-md transition-all hover:bg-gray-200"
                          >
                            Clear Selection
                          </button>
                        </li>
                      ) : (
                        <li>
                          <button
                            onClick={createNewDiagram}
                            className="w-full text-center text-gray-500 py-2 px-4 rounded-md transition-all hover:bg-gray-200"
                          >
                            New Diagram
                          </button>
                        </li>
                      )}
                      <li>
                        <button
                          onClick={saveDiagram}
                          className={`w-full text-center text-gray-500 py-2 px-4 rounded-md hover:bg-gray-200 transition-all ${
                            loading || !diagramName.trim() || !isDiagramLoaded
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                          disabled={loading || !diagramName.trim() || !isDiagramLoaded}
                        >
                          {loading ? 'Saving...' : 'Save Diagram'}
                        </button>
                      </li>
                      <li>
                        <DiagramExporter
                          modelerRef={modelerRef}
                          diagramToEdit={selectedDiagram}
                          diagramName={diagramName}
                        />
                      </li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Dropdown ends */}
          </div>

          {/* Diagram name and department in a flex column */}
          {(selectedDiagram || isDiagramLoaded) && (
            <div className="w-full max-w-2xl mx-auto ">
              <Listbox value={selectedDepartment} onChange={setSelectedDepartment}>
                {({ open }) => (
                  <>
                    {/* Removed the Listbox.Label to have the "Select Department" text as default option */}
                    <div className="relative">
                      <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
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
                            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
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

        {/* Include ProcessList component under this section */}
        <ProcessList
          onDiagramSelect={setSelectedDiagram}
          mainUserToken={mainUserToken}
          employeeToken={employeeToken}
        />
      </div>
    </div>
  );
};

export default BpmnEditor;
