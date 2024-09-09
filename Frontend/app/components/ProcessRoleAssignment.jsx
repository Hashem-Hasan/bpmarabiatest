"use client";
import React, { useState, useEffect } from "react";
import { Button, Input, Spinner, Checkbox } from "@nextui-org/react";
import Select from "react-select";
import axios from "axios";
import { FaTrash } from "react-icons/fa";

const ProcessRoleAssignment = () => {
  const [processes, setProcesses] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProcesses();
    fetchRoles();
  }, []);

  const fetchProcesses = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProcesses(response.data);
    } catch (error) {
      console.error("Error fetching processes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/company-structure`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const flatRoles = flattenRoles(response.data.roles);
      setRoles(flatRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const flattenRoles = (roles, prefix = '') => {
    return roles.reduce((acc, role) => {
      acc.push({ label: prefix + role.name, value: role._id });
      if (role.subRoles && role.subRoles.length) {
        const subRoles = flattenRoles(role.subRoles, prefix + '--');
        acc = acc.concat(subRoles);
      }
      return acc;
    }, []);
  };

  const handleAssign = async () => {
    if (!selectedProcess || selectedRoles.length === 0) {
      alert("Please select a process and at least one role.");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/company-structure/assign-processes`,
        { roleId: selectedRoles.map(role => role.value), processIds: [selectedProcess.value] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchProcesses();
      // Clear selected roles and process
      setSelectedRoles([]);
      setSelectedProcess(null);
    } catch (error) {
      console.error("Error assigning process to roles:", error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRemoveAssignment = async (processId, roleId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/company-structure/remove-assignment`,
        { roleId, processId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchProcesses();
    } catch (error) {
      console.error("Error removing assignment:", error);
    }
  };

  const filteredRoles = roles.filter((role) =>
    role.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" color="warning" />
      </div>
    );
  }

  const token = localStorage.getItem("token");

  return (
    <div className="process-role-assignment p-8 bg-white rounded-lg shadow-lg min-h-screen flex flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold mb-4 text-black w-full">
        Assign Processes to Roles
      </h1>
      <div className="flex flex-col md:flex-row items-center w-full md:justify-center">
        <div className="w-full md:w-1/2 md:pr-4 mb-4">
          <Select
            placeholder="Select Process"
            options={processes.map((process) => ({
              label: process.name,
              value: process._id,
            }))}
            onChange={(option) => setSelectedProcess(option)}
            value={selectedProcess}
            className="mb-4 text-black"
          />
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search Roles"
              value={searchTerm}
              onChange={handleSearch}
              className="border border-gray-300 p-2 rounded w-full text-black"
            />
          </div>
          <div className="max-h-96 overflow-y-auto w-full">
            {filteredRoles.map((role) => (
              <div
                key={role.value}
                className="bg-orange-200 rounded-xl shadow-md p-4 mb-4 text-black flex justify-between items-center"
              >
                <p>{role.label}</p>
                <Checkbox
                  checked={selectedRoles.includes(role)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRoles([...selectedRoles, role]);
                    } else {
                      setSelectedRoles(
                        selectedRoles.filter((r) => r.value !== role.value)
                      );
                    }
                  }}
                />
              </div>
            ))}
          </div>
          <Button
            onClick={handleAssign}
            className="bg-green-500 text-white w-full mt-4"
          >
            Assign Process to Roles
          </Button>
        </div>
        <div className="w-full md:w-1/2 md:pl-4">
          <div className="assigned-list max-h-96 overflow-y-auto w-full">
            {processes.map((process) => (
              <div
                key={process._id}
                className="bg-orange-200 rounded-xl shadow-md p-4 mb-4 text-black"
              >
                <p className="text-lg font-bold">{process.name}</p>
                <p>Assigned Roles:</p>
                <ul>
                  {process.assignedRoles &&
                    process.assignedRoles.map((role) => (
                      <li
                        key={role._id}
                        className="flex justify-between items-center"
                      >
                        {role.name}
                        <FaTrash
                          className="text-red-500 cursor-pointer"
                          onClick={() =>
                            handleRemoveAssignment(process._id, role._id)
                          }
                        />
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default ProcessRoleAssignment;
