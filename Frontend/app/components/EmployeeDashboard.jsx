"use client";
import React, { useState, useEffect } from 'react';
import { Button, Spinner, Input } from "@nextui-org/react";
import { FaSearch, FaEye } from "react-icons/fa";
import axios from 'axios';
import ReadOnlyBpmnViewer from './ReadOnlyBpmnViewer';
import Image from 'next/image';

const EmployeeDashboard = () => {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('employeeToken');
    try {
      // Fetch processes with department information
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/employeess/tasks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProcesses(response.data);
      setSelectedProcess(null); // No process selected initially
    } catch (error) {
      console.error('Error fetching processes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShow = (process) => {
    setSelectedProcess(process);
  };

  const groupProcessesByDepartment = () => {
    const grouped = {};
    processes.forEach((process) => {
      const deptName = process.department?.name || 'Unassigned';
      if (!grouped[deptName]) {
        grouped[deptName] = [];
      }
      grouped[deptName].push(process);
    });
    return grouped;
  };

  const groupedProcesses = groupProcessesByDepartment();

  // Filter grouped processes based on search term
  const filteredGroupedProcesses = Object.keys(groupedProcesses).reduce((acc, dept) => {
    const filtered = groupedProcesses[dept].filter(process =>
      process.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[dept] = filtered;
    }
    return acc;
  }, {});

  const totalProcesses = processes.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="employee-dashboard p-8 bg-white text-black shadow-lg min-h-screen flex flex-col items-center">
   

      {/* Selected Process Viewer or Welcome Card */}
      {selectedProcess ? (
        <div className="w-full h-96 mb-8">
          <ReadOnlyBpmnViewer diagramXml={selectedProcess.xml} />
        </div>
      ) : (
        <div className="bg-[#F7F9FC] flex flex-row justify-between items-center p-6 rounded-lg shadow-md mb-8 w-[1128px] h-[362px] max-w-4xl">
          <div className='flex-col flex'>
            <h2 className="text-3xl font-bold text-black">Welcome to BPMArabia</h2>
            <p className="text-gray-700 text-2xl mt-2">We made your tasks simple</p>
            <p className="text-gray-700 text-lg mt-6">Need help? Please contact your system administrator</p>
          </div>
          <Image src="/Employee.svg" width={400} height={400}></Image>
        </div>
      )}

      {/* Processes Grouped by Department */}
      <div className="w-full mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-[#1C997F]">Processes ({totalProcesses})</h2>
          <div className="relative w-64">
            <Input
              clearable
              underlined
              fullWidth
              placeholder="Search for processes"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              contentRight={
                <FaSearch className="text-gray-400 mr-2" />
              }
            />
          </div>
        </div>

        {Object.keys(filteredGroupedProcesses).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {Object.entries(filteredGroupedProcesses).map(([dept, deptProcesses]) => (
              <div key={dept} className="p-6 bg-[#F7F9FC] rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-[#1C997F] mb-4">{dept}</h3>
                {deptProcesses.map((process) => (
                  <div key={process._id} className="bg-white p-4 rounded-lg shadow-sm mb-4 flex justify-between items-center">
                    <div>
                      <h4 className="text-md font-medium text-black">{process.name}</h4>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        className="bg-[#1C997F] text-white flex items-center"
                        onClick={() => handleShow(process)}
                        auto
                        icon={<FaEye />}
                      >
                        Show
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          // If no processes match the search term
          <div className="bg-[#F7F9FC] p-6 rounded-lg shadow-md w-full max-w-4xl">
            <p className="text-gray-600 text-lg">No processes found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;