// EmployeeManagement.js

"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Modal from "./Modal"; // Ensure this path is correct
import { FaEdit } from "react-icons/fa";
import { Spinner } from "@nextui-org/react";
import * as XLSX from "xlsx";

// Helper function to flatten the roles with indentation for subroles
function flattenRoles(roles, prefix = "") {
  return roles.reduce((acc, role) => {
    acc.push({ id: role._id, name: prefix + role.name });
    if (role.subRoles && role.subRoles.length) {
      const subRoles = flattenRoles(role.subRoles, prefix + "--");
      acc = acc.concat(subRoles);
    }
    return acc;
  }, []);
}

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    hrId: "",
    role: "",
  });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // File input reference
  const fileInputRef = useRef(null);

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

  const handleEdit = (employee) => {
    setForm({
      fullName: employee.fullName,
      email: employee.email,
      password: "", // Password field is empty initially
      phoneNumber: employee.phoneNumber,
      hrId: employee.hrId,
      role: employee.role ? employee.role._id : "",
    });
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setForm({
      fullName: "",
      email: "",
      password: "",
      phoneNumber: "",
      hrId: "",
      role: "",
    });
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    setLoadingAction(true);
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/employees/${employeeToDelete}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchEmployees();
      setEmployeeToDelete(null);
      setIsDeleteConfirmOpen(false); // Close the delete confirmation modal
      setIsModalOpen(false); // Close the form modal
      setEditingEmployee(null);
    } catch (error) {
      console.error("Error deleting employee:", error);
    } finally {
      setLoadingAction(false);
    }
  };

  const confirmDelete = (employeeId) => {
    setEmployeeToDelete(employeeId);
    setIsDeleteConfirmOpen(true); // Open the delete confirmation modal
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    setLoadingAction(true);
    try {
      let dataToSend = { ...form };
      if (editingEmployee && !form.password) {
        // If editing and password is empty, remove it from the data to keep the current password
        delete dataToSend.password;
      }
      if (editingEmployee) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_HOST}/api/employees/${editingEmployee._id}`,
          dataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_HOST}/api/employees`,
          dataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      fetchEmployees();
      setIsModalOpen(false);
      setForm({
        fullName: "",
        email: "",
        password: "",
        phoneNumber: "",
        hrId: "",
        role: "",
      });
      setEditingEmployee(null);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // Optionally, implement server-side search if needed
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      await importEmployeesFromExcel(file);
    }
  };

  const importEmployeesFromExcel = async (file) => {
    setLoadingAction(true);
    try {
      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      // Proceed with processing jsonData
      await processImportedData(jsonData);
    } catch (error) {
      console.error('Error importing employees:', error);
      alert(`Error importing employees: ${error.response?.data?.message || error.message}`);
      setLoadingAction(false);
    }
  };

  const processImportedData = async (jsonData) => {
    // Fetch existing roles
    const token = localStorage.getItem("token");
    const rolesResponse = await axios.get(
      `${process.env.NEXT_PUBLIC_API_HOST}/api/employees/roles`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const flatRoles = flattenRoles(rolesResponse.data);

    // Map roles by name for quick lookup
    const rolesMap = {};
    flatRoles.forEach((role) => {
      const roleNameKey = role.name.replace(/^-*/, '').trim();
      rolesMap[roleNameKey] = role.id;
    });

    // Prepare employees data
    const employeesData = [];
    const errors = [];

    jsonData.forEach((item, index) => {
      const roleName = item.role ? item.role.trim() : '';
      const roleId = rolesMap[roleName];
      if (!roleId) {
        errors.push(`Row ${index + 2}: Role "${roleName}" not found.`);
        return;
      }
      // Check for missing required fields
      if (!item.fullName || !item.email || !item.password || !item.phoneNumber || !item.hrId) {
        errors.push(`Row ${index + 2}: Missing required fields.`);
        return;
      }
      employeesData.push({
        fullName: item.fullName,
        email: item.email,
        password: item.password,
        phoneNumber: item.phoneNumber,
        hrId: item.hrId,
        role: roleId, // Use the role ID
      });
    });

    if (errors.length > 0) {
      alert(`Errors in file:\n${errors.join('\n')}`);
      setLoadingAction(false);
      return;
    }

    // Send data to backend
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_HOST}/api/employees/import`,
      { employees: employeesData },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert('Employees imported successfully.');
    fetchEmployees(); // Refresh the employees list
    setLoadingAction(false);
  };

  const filteredEmployees = employees.filter((employee) =>
    employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.hrId && employee.hrId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-white min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="employee-management p-8 text-black bg-white space-y-4 flex-grow flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-black">Employee Management</h1>
        <div>
          <button
            className="bg-[#14BAB6] text-white py-2 px-4 rounded mr-2"
            onClick={handleAdd}
          >
            Add Employee
          </button>
          <button
            className="bg-green-500 text-white py-2 px-4 rounded"
            onClick={handleImportClick}
            disabled={loadingAction}
          >
            {loadingAction ? <Spinner size="sm" color="white" /> : "Import"}
          </button>
        </div>
      </div>
      <div className="mb-2">
        <input
          type="text"
          placeholder="Search Employees"
          value={searchTerm}
          onChange={handleSearch}
          className="border border-gray-300 p-2 rounded w-full text-black"
        />
      </div>
      <div className="overflow-auto max-h-[60vh]">
        {/* Table should be scrollable */}
        <table className="min-w-full bg-white relative">
          <thead className="sticky top-0 bg-[#14BAB6] text-white">
            <tr>
              <th className="py-2 px-4">HR ID</th>
              <th className="py-2 px-4">Name</th>
              <th className="py-2 px-4">Email</th>
              <th className="py-2 px-4">Phone</th>
              <th className="py-2 px-4">Role</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee) => (
              <tr key={employee._id} className="text-center border-b">
                <td className="py-2 px-4">{employee.hrId}</td>
                <td className="py-2 px-4">{employee.fullName}</td>
                <td className="py-2 px-4">{employee.email}</td>
                <td className="py-2 px-4">{employee.phoneNumber}</td>
                <td className="py-2 px-4">
                  {employee.role ? employee.role.name : "No Role"}
                </td>
                <td className="py-2 px-4">
                  <button
                    onClick={() => handleEdit(employee)}
                    className="text-blue-500 hover:text-blue-700 mx-2"
                  >
                    <FaEdit />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        accept=".xlsx, .xls"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      {/* Modal for Add/Edit Employee */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEmployee(null);
            setEmployeeToDelete(null);
          }}
          title={editingEmployee ? "Edit Employee" : "Add Employee"}
          hideFooter={true}
        >
          <form onSubmit={handleSubmit} className="w-full">
            <div className="mb-2">
              <label className="block text-left text-black mb-1">Full Name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="border border-gray-300 p-2 rounded w-full text-black"
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-left text-black mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="border border-gray-300 p-2 rounded w-full text-black"
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-left text-black mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="border border-gray-300 p-2 rounded w-full text-black"
                placeholder={
                  editingEmployee ? "Leave blank to keep current password" : ""
                }
                required={!editingEmployee}
              />
            </div>
            <div className="mb-2">
              <label className="block text-left text-black mb-1">Phone Number</label>
              <input
                type="text"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                className="border border-gray-300 p-2 rounded w-full text-black"
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-left text-black mb-1">HR ID</label>
              <input
                type="text"
                value={form.hrId}
                onChange={(e) => setForm({ ...form, hrId: e.target.value })}
                className="border border-gray-300 p-2 rounded w-full text-black"
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-left text-black mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="border border-gray-300 p-2 rounded w-full text-black"
                required
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name.replace(/^-*/, "").trim()}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="button"
                className="bg-gray-500 text-white py-2 px-4 rounded"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingEmployee(null);
                  setEmployeeToDelete(null);
                }}
              >
                Cancel
              </button>
              {editingEmployee && (
                <button
                  type="button"
                  className="bg-red-500 text-white py-2 px-4 rounded"
                  onClick={() => confirmDelete(editingEmployee._id)}
                >
                  Delete
                </button>
              )}
              <button
                type="submit"
                className="bg-[#14BAB6] text-white py-2 px-4 rounded"
                disabled={loadingAction}
              >
                {loadingAction ? (
                  <Spinner size="sm" color="white" />
                ) : editingEmployee ? (
                  "Update"
                ) : (
                  "Add"
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <Modal
          isOpen={isDeleteConfirmOpen}
          onClose={() => {
            setIsDeleteConfirmOpen(false);
            setEmployeeToDelete(null);
          }}
          title="Confirm Deletion"
          hideFooter={true}
        >
          <p>Are you sure you want to delete this employee?</p>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              className="bg-gray-500 text-white py-2 px-4 rounded"
              onClick={() => {
                setIsDeleteConfirmOpen(false);
                setEmployeeToDelete(null);
              }}
            >
              Cancel
            </button>
            <button
              className="bg-red-500 text-white py-2 px-4 rounded"
              onClick={handleDelete}
              disabled={loadingAction}
            >
              {loadingAction ? <Spinner size="sm" color="white" /> : "Confirm"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EmployeeManagement;
