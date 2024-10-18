"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Spinner } from '@nextui-org/react';

const DepartmentsWithProcesses = () => {
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDepartmentsWithProcesses();
  }, []);

  const fetchDepartmentsWithProcesses = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('employeeToken');
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_HOST}/api/departments/departments-with-processes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDepartments(response.data);
      setFilteredDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments and processes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);

    if (searchValue === '') {
      setFilteredDepartments(departments);
    } else {
      const filtered = departments
        .map((department) => {
          const filteredProcesses = department.processes.filter((process) =>
            process.name.toLowerCase().includes(searchValue)
          );

          return { ...department, processes: filteredProcesses };
        })
        .filter((department) => department.processes.length > 0);

      setFilteredDepartments(filtered);
    }
  };

  const totalProcesses = filteredDepartments.reduce((acc, department) => acc + department.processes.length, 0);

  return (
    <div className="px-6 bg-white shadow-lg rounded-lg h-[400px] mb-12 py-10 w-[1200px] mx-auto overflow-y-scroll">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">
          Processes <span className="text-gray-500">({totalProcesses})</span>
        </h1>
        <div className="relative w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search for processes"
            className="border border-gray-300 rounded-full px-4 py-2 w-full"
          />
          <svg
            className="w-6 h-6 absolute right-4 top-2 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {/* SVG path */}
          </svg>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner size="lg" color="primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {filteredDepartments.length === 0 ? (
            <p className="text-gray-600 text-lg">No processes found.</p>
          ) : (
            filteredDepartments.map((department) => (
              <div key={department.department._id} className="p-6">
                <h2 className="text-lg font-semibold text-[#1C997F] mb-4">
                  {department.department.name}
                </h2>
                <div className="overflow-y-auto max-h-40 scroll-smooth"> {/* Enable smooth scrolling */}
                  {department.processes.map((process) => (
                    <div key={process._id} className="bg-[#F7F9FC] p-4 rounded-lg mb-4">
                      <h3 className="text-sm font-semibold text-gray-700">{process.name}</h3>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DepartmentsWithProcesses;
