// pages/Home.js

'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BpmnEditor from '../components/BpmnEditor';
import ProtectedRoute from '../components/ProtectedRoute';

const Home = () => {
  const [selectedDiagram, setSelectedDiagram] = useState(null);
  const [editorKey, setEditorKey] = useState(Date.now());
  const [mainUserToken, setMainUserToken] = useState(null);
  const [employeeToken, setEmployeeToken] = useState(null);

  // Fetch tokens on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMainUserToken(localStorage.getItem('token'));
      setEmployeeToken(localStorage.getItem('employeeToken'));
    }
  }, []);

  const saveDiagram = async ({ id, name, xml, department }) => {
    const token = mainUserToken || employeeToken;
    try {
      let response;
      if (id) {
        response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/${id}`,
          { name, xml, department },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes`,
          { name, xml, department },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      alert('Diagram saved successfully!');
      setSelectedDiagram(null);
      setEditorKey(Date.now());
      return true;
    } catch (err) {
      console.error('Error saving diagram:', err);
      if (err.response && err.response.status === 403) {
        alert(
          err.response.data.message ||
            'You do not have permission to perform this action.'
        );
      } else {
        alert('An error occurred while saving the diagram. Please try again.');
      }
      return false;
    }
  };

  const handleClearSelection = () => {
    setSelectedDiagram(null);
    setEditorKey(Date.now());
  };

  return (
    <div className='bg-[#FDFDFD]  text-black h-screen w-full text-center flex justify-center items-center overflow-hidden'>
      <ProtectedRoute >
      <div className="h-full scale-50 md:scale-60 lg:scale-80 xl:scale-85 2xl:scale-100 w-full flex justify-center items-center">
        <BpmnEditor
          key={editorKey}
          onSave={saveDiagram}
          onClear={handleClearSelection}
          diagramToEdit={selectedDiagram}
          style={{ height: '100%', width: '100%' }} // Ensure it takes the full space
        />
      </div>
      </ProtectedRoute >
    </div>
  );
};

export default Home;
