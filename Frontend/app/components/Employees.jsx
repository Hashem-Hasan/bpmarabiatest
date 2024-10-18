"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from './Modal'; // Ensure this path is correct
import { FaEdit } from "react-icons/fa";
import { Spinner } from "@nextui-org/react";

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
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    fetchEmployees(); // Fetch the data from the DB while searching
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
        <button
          className="bg-[#1C997F] text-white py-2 px-4 rounded"
          onClick={handleAdd}
        >
          Add Employee
        </button>
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
      <div className="overflow-auto max-h-[60vh]"> {/* Table should be scrollable */}
        <table className="min-w-full bg-white relative">
          <thead className="sticky top-0 bg-[#1C997F] text-white">
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
                placeholder={editingEmployee ? "Leave blank to keep current password" : ""}
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
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2">
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
                className="bg-[#1C997F] text-white py-2 px-4 rounded"
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
