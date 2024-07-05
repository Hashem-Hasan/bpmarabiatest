"use client";
import React, { useState, useEffect } from "react";
import { Button, Input, Spinner, Checkbox } from "@nextui-org/react";
import Select from "react-select";
import axios from "axios";
import { FaTrash } from "react-icons/fa";

const ProcessOwnerManagement = () => {
  const [processes, setProcesses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [selectedOwners, setSelectedOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProcesses();
    fetchEmployees();
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
      console.log("Fetched Processes:", response.data);
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
      console.log("Fetched Employees:", response.data);
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleLink = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/${selectedProcess.value}`,
        { ownerIds: selectedOwners },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchProcesses();
    } catch (error) {
      console.error("Error linking process to owners:", error);
    }
  };

  const handleRemoveOwner = async (processId, ownerId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/remove-owner/${processId}`,
        { ownerId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchProcesses();
    } catch (error) {
      console.error("Error removing owner from process:", error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredEmployees = employees.filter((employee) =>
    employee.fullName.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="process-owner-management p-8 bg-white rounded-lg shadow-lg min-h-screen flex flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold mb-4 text-black w-full">
        Link Processes to Owners
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
            className="mb-4 text-black"
          />
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search Employees"
              value={searchTerm}
              onChange={handleSearch}
              className="border border-gray-300 p-2 rounded w-full text-black"
            />
          </div>
          <div className="max-h-96 overflow-y-auto w-full">
            {filteredEmployees.map((employee) => (
              <div
                key={employee._id}
                className="bg-orange-200 rounded-xl shadow-md p-4 mb-4 text-black flex justify-between items-center"
              >
                <p>{employee.fullName}</p>
                <Checkbox
                  checked={selectedOwners.includes(employee._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedOwners([...selectedOwners, employee._id]);
                    } else {
                      setSelectedOwners(
                        selectedOwners.filter((id) => id !== employee._id)
                      );
                    }
                  }}
                />
              </div>
            ))}
          </div>
          <Button onClick={handleLink} className="bg-green-500 text-white w-full mt-4">
            Link Process to Owners
          </Button>
        </div>
        <div className="w-full md:w-1/2 md:pl-4">
          <div className="links-list max-h-96 overflow-y-auto w-full">
            {processes.map((process) => (
              <div
                key={process._id}
                className="bg-orange-200 rounded-xl shadow-md p-4 mb-4 text-black"
              >
                <p className="text-lg font-bold">{process.name}</p>
                <p>Owners:</p>
                <ul>
                  {process.owners &&
                    process.owners.map((owner) => (
                      <li key={owner._id} className="flex justify-between items-center">
                        {owner.fullName}
                        <FaTrash
                          className="text-red-500 cursor-pointer"
                          onClick={() => handleRemoveOwner(process._id, owner._id)}
                        />
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      {token && (
        <div className="flex w-full justify-center space-x-4 mt-8">
          <Button
            className="bg-gray-500 w-1/3 text-white"
            onClick={() => window.location.href = "/Tool"}
          >
            Back
          </Button>
          <Button
            className="bg-orange-500 w-1/3 text-white"
            onClick={() => window.location.href = "/RolesAssigner"}
          >
            Next Step
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProcessOwnerManagement;
