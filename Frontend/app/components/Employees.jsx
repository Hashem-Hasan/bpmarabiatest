"use client";
import React, { useState, useEffect } from "react";
import { Button, Input, Checkbox, Spinner } from "@nextui-org/react";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";

// Helper function to flatten the roles with indentation for subroles
function flattenRoles(roles, prefix = '') {
  return roles.reduce((acc, role) => {
    acc.push({ id: role._id, name: prefix + role.name });
    if (role.subRoles && role.subRoles.length) {
      const subRoles = flattenRoles(role.subRoles, prefix + '--');
      acc = acc.concat(subRoles);
    }
    return acc;
  }, []);
}

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phoneNumber: "", hrId: "", isAdmin: false, ownedProcesses: [], role: "" });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState({
    addEdit: false,
    delete: false,
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/employees/roles`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const flatRoles = flattenRoles(response.data);
      setRoles(flatRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    setLoadingAction({ ...loadingAction, addEdit: true });
    try {
      if (editingEmployee) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_HOST}/api/employees/${editingEmployee._id}`,
          form,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_HOST}/api/employees`,
          form,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      setForm({ fullName: "", email: "", password: "", phoneNumber: "", hrId: "", isAdmin: false, ownedProcesses: [], role: "" });
      setEditingEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoadingAction({ ...loadingAction, addEdit: false });
    }
  };

  const handleEdit = (employee) => {
    setForm({
      fullName: employee.fullName,
      email: employee.email,
      password: "",
      phoneNumber: employee.phoneNumber,
      hrId: employee.hrId,
      isAdmin: employee.isAdmin,
      ownedProcesses: employee.ownedProcesses,
      role: employee.role ? employee.role._id : "",
    });
    setEditingEmployee(employee);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    setLoadingAction({ ...loadingAction, delete: true });
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/employees/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
    } finally {
      setLoadingAction({ ...loadingAction, delete: false });
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredEmployees = employees.filter((employee) =>
    employee.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center bg-white min-h-screen"><Spinner size="lg" color="warning" /></div>;
  }

  return (
    <div className="employee-management p-8 bg-white  space-y-14 shadow-lg min-h-screen flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold mb-4 text-black w-full">Employee Management</h1>
      <div className="flex flex-col md:flex-row items-center w-full md:justify-center">
        <div className="w-1/3  md:pr-4 ">
          <form onSubmit={handleSubmit} className="w-full  mx-auto">
            <Input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Full Name"
              className="border border-gray-300 p-2 rounded mb-2 w-full text-black"
            />
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              className="border border-gray-300 p-2 rounded mb-2 w-full text-black"
            />
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Password"
              className="border border-gray-300 p-2 rounded mb-2 w-full text-black"
            />
            <Input
              type="text"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              placeholder="Phone Number"
              className="border border-gray-300 p-2 rounded mb-2 w-full text-black"
            />
            <Input
              type="text"
              value={form.hrId}
              onChange={(e) => setForm({ ...form, hrId: e.target.value })}
              placeholder="HR ID"
              className="border border-gray-300 p-2 rounded mb-2 w-full text-black"
            />
            <div className="flex items-center mb-2">
              <Checkbox
                checked={form.isAdmin}
                onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })}
              >
                Is Admin?
              </Checkbox>
            </div>
            <div className="mb-2">
              <label htmlFor="role" className="block text-black mb-1">Role</label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="border border-gray-300 p-2 rounded w-full text-black"
                style={{ maxHeight: '150px', overflowY: 'scroll' }} // Make the dropdown scrollable
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="bg-orange-500 text-white w-full">
              {loadingAction.addEdit ? <Spinner size="sm" color="warning" /> : editingEmployee ? "Update Employee" : "Add Employee"}
            </Button>
          </form>
        </div>

        <div className=" w-1/3  md:pl-4 mt-8 md:mt-0">
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search Employees"
              value={searchTerm}
              onChange={handleSearch}
              className="border border-gray-300 p-2 rounded w-full text-black"
            />
          </div>
          <div className="employees-list max-h-96 overflow-y-auto w-full max-w-2xl">
            {filteredEmployees.map((employee) => (
              <div key={employee._id} className="bg-orange-200 rounded-xl shadow-md p-4 mb-4 text-black">
                <p className="text-lg font-bold">{employee.fullName}</p>
                <p>Email: {employee.email}</p>
                <p>Phone: {employee.phoneNumber}</p>
                <p>HR ID: {employee.hrId}</p>
                <p>Admin: {employee.isAdmin ? "Yes" : "No"}</p>
                <p>Role: {employee.role ? employee.role.name : "No Role Assigned"}</p>
                <div className="flex space-x-2 mt-2">
                  <Button className="bg-yellow-500 text-white" onClick={() => handleEdit(employee)}>
                    <FaEdit />
                  </Button>
                  <Button className="bg-red-500 text-white" onClick={() => handleDelete(employee._id)}>
                    {loadingAction.delete ? <Spinner size="sm" color="warning" /> : <FaTrash />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex w-full justify-center space-x-4 mt-8">
        <Button className="bg-gray-500 w-1/3 text-white" onClick={() => window.location.href = '/Structure'}>
          Back
        </Button>
        <Button className="bg-orange-500 w-1/3 text-white" onClick={() => window.location.href = '/Tool'}>
          Next Step
        </Button>
      </div>
    </div>
  );
};

export default EmployeeManagement;
