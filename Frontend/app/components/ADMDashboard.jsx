"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody, Spinner } from "@nextui-org/react";
import axios from "axios";

const AdminDashboard = () => {
  const [numEmployees, setNumEmployees] = useState(0);
  const [numProcesses, setNumProcesses] = useState(0);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingProcesses, setLoadingProcesses] = useState(true);
  const [loadingToken, setLoadingToken] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      setToken(storedToken);
      setLoadingToken(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchNumEmployees();
      fetchNumProcesses();
    }
  }, [token]);

  const fetchNumEmployees = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/employees`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setNumEmployees(response.data.length);
    } catch (error) {
      console.error("Error fetching number of employees:", error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchNumProcesses = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setNumProcesses(response.data.length);
    } catch (error) {
      console.error("Error fetching number of processes:", error);
    } finally {
      setLoadingProcesses(false);
    }
  };

  if (loadingToken) {
    return (
      <div className="text-center flex flex-col items-center justify-center bg-white min-h-screen p-8">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!token) {

 
  }

  return (
    <div className="admin-dashboard p-8 flex flex-col items-center">
      {/* Modernized Tab-like Buttons Section */}
      <div className="flex font-semibold justify-center rounded-lg border-gray-300 bg-white h-16 px-6 items-center w-fit mb-8 space-x-6">
        <a
          href="/DStructure"
          className="text-gray-500 hover:text-[#1C997F] border-b-2 border-transparent hover:border-[#1C997F] py-1 transition-all"
        >
          Departments Structure
        </a>
        <a
          href="/Structure"
          className="text-gray-500 hover:text-[#1C997F] border-b-2 border-transparent hover:border-[#1C997F] py-1 transition-all"
        >
          Roles Structure
        </a>
        <a
          href="/employeesys"
          className="text-gray-500 hover:text-[#1C997F] border-b-2 border-transparent hover:border-[#1C997F] py-1 transition-all"
        >
          Employees Management
        </a>
        <a
          href="/Tool"
          className="text-gray-500 hover:text-[#1C997F] border-b-2 border-transparent hover:border-[#1C997F] py-1 transition-all"
        >
          Processes Management
        </a>
        <a
          href="/ProcessManager"
          className="text-gray-500 hover:text-[#1C997F] border-b-2 border-transparent hover:border-[#1C997F] py-1 transition-all"
        >
          Process Owners Management
        </a>
        <a
          href="/RolesAssigner"
          className="text-gray-500 hover:text-[#1C997F] border-b-2 border-transparent hover:border-[#1C997F] py-1 transition-all"
        >
          Process Mapping
        </a>
        <a
          href="/DLO"
          className="text-gray-500 hover:text-[#1C997F] border-b-2 border-transparent hover:border-[#1C997F] py-1 transition-all"
        >
          Logs
        </a>
      </div>

      {/* Information Section */}
      <div className="flex flex-c w-[1200px] justify-center gap-10 ">
        {/* Total Employees Card */}
        <div className="flex flex-col items-center p-6 bg-white shadow-lg rounded-2xl w-full">
          <div className="flex items-center mb-4">
            <div className="bg-[#E6E6FF] rounded-full p-4">
              {/* Employee Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#1C997F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-3-3h-4a3 3 0 00-3 3v2M9 20h4v-2a3 3 0 00-3-3H7a3 3 0 00-3 3v2m5-8a4 4 0 110-8 4 4 0 010 8zm6 0a4 4 0 110-8 4 4 0 010 8z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-[#421987] ml-4">
              {loadingEmployees ? <Spinner size="sm" color="warning" /> : numEmployees}
            </p>
          </div>
          <p className="text-[#1C997F] text-lg font-semibold">Total of employees</p>
        </div>

        {/* Total Processes Card */}
        <div className="flex flex-col items-center p-6 bg-white shadow-lg rounded-2xl w-full">
          <div className="flex items-center mb-4">
            <div className="bg-[#D9FFE6] rounded-full p-4">
              {/* Process Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#1C997F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-[#421987] ml-4">
              {loadingProcesses ? <Spinner size="sm" color="warning" /> : numProcesses}
            </p>
          </div>
          <p className="text-[#1C997F] text-lg font-semibold">Total of processes</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;