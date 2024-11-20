// pages/Home.js

'use client';
import React, { useState, useEffect } from 'react';
import BpmnEditor from '../components/BpmnEditor';
import ProtectedRoute from '../components/ProtectedRoute';

const Home = () => {
  const [selectedDiagram, setSelectedDiagram] = useState(null);
  const [editorKey, setEditorKey] = useState(Date.now());

  const handleClearSelection = () => {
    setSelectedDiagram(null);
    setEditorKey(Date.now());
  };

  return (
    <div className='bg-[#FDFDFD] text-black h-screen w-full text-center flex justify-center items-center overflow-clip'>
      <ProtectedRoute>
        <div className="h-screen pt-16 pb-7 w-screen flex justify-center items-center">
          <BpmnEditor
            key={editorKey}
            onClear={handleClearSelection}
            diagramToEdit={selectedDiagram}
            style={{ height: '100%', width: '100%' }} // Ensure it takes the full space
          />
        </div>
      </ProtectedRoute>
    </div>
  );
};

export default Home;
