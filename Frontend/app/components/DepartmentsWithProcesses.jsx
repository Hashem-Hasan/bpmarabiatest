"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DepartmentsWithProcesses = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

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

      setDepartments(response.data); // Set the fetched departments with their associated processes
    } catch (error) {
      console.error('Error fetching departments and processes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="departments-container flex justify-center mt-10 px-4 pb-20">
      {departments.length === 0 ? (
        <p className="text-gray-600 text-lg">No departments with processes found.</p>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-lg w-full max-w-4xl">
          <table className="min-w-full bg-white divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Processes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departments.map((department) => (
                <React.Fragment key={department.department._id}> {/* Use department.department._id because it's nested */}
                  <tr>
                    <td className="px-6 py-4 font-bold text-gray-900" rowSpan={department.processes.length + 1}>
                      {department.department.name} {/* Use department.department.name */}
                    </td>
                  </tr>
                  {department.processes.map((process) => (
                    <tr key={process._id}>
                      <td className="px-6 py-4 text-gray-700">{process.name}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DepartmentsWithProcesses;
