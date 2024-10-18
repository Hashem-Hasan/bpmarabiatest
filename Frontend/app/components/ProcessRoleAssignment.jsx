"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { FaTrash } from "react-icons/fa";
import { Spinner } from "@nextui-org/react"; // For the loading spinner
import { motion } from "framer-motion"; // For animations
import Modal from "./Modal"; // Assuming you have a Modal component

const ProcessRoleAssignment = () => {
  const [processes, setProcesses] = useState([]);
  const [roles, setRoles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // For search functionality

  useEffect(() => {
    fetchProcesses();
    fetchRoles();
  }, []);

  useEffect(() => {
    generateAssignments();
  }, [processes]);

  useEffect(() => {
    handleSearch();
  }, [assignments, searchTerm]);

  const fetchProcesses = async () => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
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

  const flattenRoles = (roles, prefix = "") => {
    return roles.reduce((acc, role) => {
      acc.push({ label: prefix + role.name, value: role._id });
      if (role.subRoles && role.subRoles.length) {
        const subRoles = flattenRoles(role.subRoles, prefix + "--");
        acc = acc.concat(subRoles);
      }
      return acc;
    }, []);
  };

  const generateAssignments = () => {
    const generatedAssignments = [];
    processes.forEach((process) => {
      if (process.assignedRoles && process.assignedRoles.length > 0) {
        process.assignedRoles.forEach((role) => {
          generatedAssignments.push({
            processId: process._id,
            processName: process.name,
            roleId: role._id,
            roleName: role.name,
          });
        });
      }
    });
    setAssignments(generatedAssignments);
  };

  const handleAssign = async () => {
    if (!selectedProcess || selectedRoles.length === 0) {
      alert("Please select a process and at least one role.");
      return;
    }

    const token = localStorage.getItem("token");
    setLoadingAction(true);
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/company-structure/assign-processes`,
        {
          roleId: selectedRoles.map((role) => role.value),
          processIds: [selectedProcess.value],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      fetchProcesses();
      setSelectedRoles([]);
      setSelectedProcess(null);
      setIsModalOpen(false);
      alert("Process assigned to roles successfully.");
    } catch (error) {
      console.error("Error assigning process to roles:", error);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRemoveAssignment = async (processId, roleId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to remove this assignment?"
    );
    if (!confirmDelete) return;

    const token = localStorage.getItem("token");
    setLoadingAction(true);
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/company-structure/remove-assignment`,
        { roleId, processId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      await fetchProcesses();
    } catch (error) {
      console.error("Error removing assignment:", error);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSearch = () => {
    const filtered = assignments.filter(
      (assignment) =>
        assignment.processName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.roleName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAssignments(filtered);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-white min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="process-role-assignment p-4 text-black bg-white shadow-lg h-screen overflow-hidden flex flex-col space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Process Role Assignment</h1>
        <button
          className="bg-[#1C997F] text-white py-2 px-4 rounded"
          onClick={() => setIsModalOpen(true)}
        >
          Add Assignment
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-2">
        <input
          type="text"
          placeholder="Search Assignments"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 p-2 rounded w-full text-black"
        />
      </div>

      {/* Assignments Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
        <table className="min-w-full bg-white">
          <thead className="sticky top-0 bg-[#1C997F] text-white">
            <tr>
              <th className="py-2 px-4">Process</th>
              <th className="py-2 px-4">Role</th>
              <th className="py-2 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.map((assignment, index) => (
              <motion.tr
                key={index}
                className="text-center border-b"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <td className="py-2 px-4">{assignment.processName}</td>
                <td className="py-2 px-4">{assignment.roleName}</td>
                <td className="py-2 px-4">
                  <button
                    onClick={() =>
                      handleRemoveAssignment(assignment.processId, assignment.roleId)
                    }
                    className="text-red-500 hover:text-red-700"
                  >
                    {loadingAction ? (
                      <Spinner size="sm" color="red" />
                    ) : (
                      <FaTrash />
                    )}
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Assignment Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Assign Process to Roles"
          hideFooter={true}
        >
          <div className="space-y-4">
            {/* Select Process */}
            <div>
              <label className="block text-left text-black mb-1">Select Process</label>
              <Select
                placeholder="Select Process"
                options={processes.map((process) => ({
                  label: process.name,
                  value: process._id,
                }))}
                onChange={(option) => setSelectedProcess(option)}
                value={selectedProcess}
                className="text-black"
                isSearchable
              />
            </div>
            {/* Select Roles */}
            <div>
              <label className="block text-left text-black mb-1">Select Roles</label>
              <Select
                placeholder="Search and select roles"
                options={roles}
                onChange={(options) => setSelectedRoles(options)}
                value={selectedRoles}
                className="text-black"
                isMulti
                isSearchable
              />
            </div>
            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-500 text-white py-2 px-4 rounded"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                className="bg-[#1C997F] text-white py-2 px-4 rounded"
                disabled={loadingAction}
              >
                {loadingAction ? (
                  <Spinner size="sm" color="white" />
                ) : (
                  "Assign"
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProcessRoleAssignment;
