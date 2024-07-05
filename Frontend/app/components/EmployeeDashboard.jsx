"use client";
import React, { useState, useEffect } from 'react';
import { Button, Spinner } from "@nextui-org/react";
import axios from 'axios';
import ReadOnlyBpmnViewer from './ReadOnlyBpmnViewer';

const EmployeeDashboard = () => {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProcess, setSelectedProcess] = useState(null);

  useEffect(() => {
    fetchProcesses();
  }, []);

  const fetchProcesses = async () => {
    const token = localStorage.getItem('employeeToken');
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_HOST}/api/employeess/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProcesses(response.data);
      if (response.data.length > 0) {
        setSelectedProcess(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching processes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShow = (process) => {
    setSelectedProcess(process);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg" color="warning" /></div>;
  }

  return (
    <div className="employee-dashboard p-8 bg-white rounded-lg text-black shadow-lg min-h-screen flex flex-col items-center text-center">
      <h1 className="text-2xl font-bold mb-4 text-black w-full">Employee Dashboard</h1>
      {selectedProcess && (
        <div className="w-full h-96 mb-4">
          <ReadOnlyBpmnViewer diagramXml={selectedProcess.xml} />
        </div>
      )}
      <div className="tasks-list w-full">
        {processes.map((process) => (
          <div key={process._id} className="bg-orange-200 rounded-xl shadow-md p-4 mb-4 text-black w-full">
            <p className="text-lg font-bold">{process.name}</p>
            <Button auto onClick={() => handleShow(process)}>Show</Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
