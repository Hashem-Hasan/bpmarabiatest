"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { FaTrash } from "react-icons/fa";
import { Spinner } from "@nextui-org/react";
import { motion } from "framer-motion";
import Modal from "./Modal"; // Assuming you have a Modal component

const ProcessOwnerManagement = () => {
  const [processes, setProcesses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProcesses();
    fetchEmployees();
  }, []);

  useEffect(() => {
    generateLinks();
  }, [processes]);

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

  const fetchEmployees = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/employees`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const generateLinks = () => {
    const generatedLinks = [];
    processes.forEach((process) => {
      if (process.owners && process.owners.length > 0) {
        process.owners.forEach((owner) => {
          generatedLinks.push({
            processId: process._id,
            processName: process.name,
            ownerId: owner._id,
            ownerName: owner.fullName,
            ownerHrId: owner.hrId,
          });
        });
      }
    });
    setLinks(generatedLinks);
  };

  const handleAddLink = () => {
    setSelectedEmployee(null);
    setSelectedProcess(null);
    setIsModalOpen(true);
  };

  const handleLink = async () => {
    if (!selectedProcess || !selectedEmployee) {
      alert("Please select both process and employee.");
      return;
    }
    const token = localStorage.getItem("token");
    setLoadingAction(true);
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/${selectedProcess.value}`,
        { ownerIds: [selectedEmployee.value] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      fetchProcesses();
      setIsModalOpen(false);
      alert("Process linked to owner successfully.");
    } catch (error) {
      console.error("Error linking process to owner:", error);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteLink = async (processId, ownerId) => {
    if (!window.confirm("Are you sure you want to delete this link?")) return;
    const token = localStorage.getItem("token");
    setLoadingAction(true);
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/remove-owner/${processId}`,
        { ownerId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      fetchProcesses();
    } catch (error) {
      console.error("Error removing owner from process:", error);
    } finally {
      setLoadingAction(false);
    }
  };

  const filteredLinks = links.filter((link) =>
    link.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.processName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.ownerHrId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-white min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="process-owner-management p-4 text-black bg-white shadow-lg flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">Process Owner Management</h1>
        <button
          className="bg-[#14BAB6] text-white py-2 px-4 rounded"
          onClick={handleAddLink}
        >
          Add Link
        </button>
      </div>

      {/* Search Input */}
      <div>
        <input
          type="text"
          placeholder="Search Processes or Employees"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 p-2 rounded w-full text-black mb-2"
        />
      </div>

      {/* Links Table */}
      <div className="overflow-x-auto overflow-y-auto h-full">
        <table className="min-w-full bg-white">
          <thead className="sticky top-0 bg-[#14BAB6] text-white">
            <tr>
              <th className="py-2 px-4">HR ID</th>
              <th className="py-2 px-4">Process</th>
              <th className="py-2 px-4">Employee</th>
              <th className="py-2 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLinks.map((link, index) => (
              <motion.tr
                key={index}
                className="text-center border-b"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <td className="py-2 px-4">{link.ownerHrId}</td>
                <td className="py-2 px-4">{link.processName}</td>
                <td className="py-2 px-4">{link.ownerName}</td>
                <td className="py-2 px-4">
                  <button
                    onClick={() => handleDeleteLink(link.processId, link.ownerId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Link Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add Process-Employee Link"
          hideFooter={true}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-left mb-1">Select Employee</label>
              <Select
                placeholder="Search and select employee"
                options={employees.map((employee) => ({
                  label: `${employee.hrId} - ${employee.fullName}`,
                  value: employee._id,
                }))}
                onChange={(option) => setSelectedEmployee(option)}
                isSearchable
                className="text-black"
              />
            </div>
            <div>
              <label className="block text-left mb-1">Select Process</label>
              <Select
                placeholder="Search and select process"
                options={processes.map((process) => ({
                  label: process.name,
                  value: process._id,
                }))}
                onChange={(option) => setSelectedProcess(option)}
                isSearchable
                className="text-black"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-500 text-white py-2 px-4 rounded"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                onClick={handleLink}
                className="bg-[#14BAB6] text-white py-2 px-4 rounded"
              >
                {loadingAction ? <Spinner size="sm" color="white" /> : "Link"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProcessOwnerManagement;
