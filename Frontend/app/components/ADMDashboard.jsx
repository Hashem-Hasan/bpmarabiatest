"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, CardHeader, CardBody, Spinner } from "@nextui-org/react";
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
      setNumEmployees(response.data.length); // Assuming the API returns an array of employees
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
      setNumProcesses(response.data.length); // Assuming the API returns an array of processes
    } catch (error) {
      console.error("Error fetching number of processes:", error);
    } finally {
      setLoadingProcesses(false);
    }
  };

  if (loadingToken) {
    return (
      <div className="text-center flex flex-col items-center justify-center bg-white min-h-screen p-8">
        <Spinner size="lg" color="warning" />
      </div>
    );
  }

  if (!token) {
    return <div className="text-center p-8">Access Denied. No token found.</div>;
  }

  return (
    <div className="admin-dashboard p-8   flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4 text-black">Admin Dashboard</h1>
      <div className="flex flex-wrap justify-center gap-4 w-full mb-8">
        <Card
          isPressable
          className="w-full md:w-1/3 p-4"
          onClick={() => window.location.href = "/DStructure"}
        >
          <CardHeader><h2>Departmens Structure</h2></CardHeader>
        </Card>
        <Card
          isPressable
          className="w-full md:w-1/3 p-4"
          onClick={() => window.location.href = "/Structure"}
        >
          <CardHeader><h2>Roles Structure</h2></CardHeader>
        </Card>
        <Card
          isPressable
          className="w-full md:w-1/3 p-4"
          onClick={() => window.location.href = "/employeesys"}
        >
          <CardHeader><h2>Employees Management</h2></CardHeader>
        </Card>
        <Card
          isPressable
          className="w-full md:w-1/3 p-4"
          onClick={() => window.location.href = "/Tool"}
        >
          <CardHeader><h2>Processes Management</h2></CardHeader>
        </Card>
        <Card
          isPressable
          className="w-full md:w-1/3 p-4"
          onClick={() => window.location.href = "/ProcessManager"}
        >
          <CardHeader><h2>Process Owners Management</h2></CardHeader>
        </Card>
        <Card
          isPressable
          className="w-full md:w-1/3 p-4"
          onClick={() => window.location.href = "/RolesAssigner"}
        >
          <CardHeader><h2>Process Mapping</h2></CardHeader>
        </Card>
        <Card
          isPressable
          className="w-full md:w-1/3 p-4"
          onClick={() => window.location.href = "/DLO"}
        >
          <CardHeader><h2>Logs</h2></CardHeader>
        </Card>
      </div>
      <div className="flex w-full justify-center mt-8">
        <Card className="w-full md:w-1/3 p-4">
          <CardBody>
            <p>Total Employees: {loadingEmployees ? <Spinner size="sm" color="warning" /> : numEmployees}</p>
            <p>Total Processes: {loadingProcesses ? <Spinner size="sm" color="warning" /> : numProcesses}</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
