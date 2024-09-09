"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button, Input, Spinner } from "@nextui-org/react";
import { FaPlus, FaEdit, FaTrash, FaSave, FaList, FaSitemap } from "react-icons/fa";
import axios from "axios";
import Modal from './Modal';  // Import the custom modal component

const DepartmentStructure = () => {
  const [structure, setStructure] = useState([]);
  const [showInput, setShowInput] = useState(null);
  const [departmentName, setDepartmentName] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState(null);
  const [editDepartmentName, setEditDepartmentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState({
    addSubDepartment: false,
    defineRoot: false,
    deleteDepartment: false,
    editDepartment: false,
  });
  const [viewMode, setViewMode] = useState("tree");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmDepartment, setConfirmDepartment] = useState(null);

  const containerRef = useRef(null);

  useEffect(() => {
    fetchStructure();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const rootElement = containerRef.current.querySelector(".root-department");
      if (rootElement) {
        containerRef.current.scrollLeft = rootElement.offsetLeft - (containerRef.current.clientWidth - rootElement.clientWidth) / 2;
      }
    }
  }, [structure]);

  const fetchStructure = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/department-structure`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const departmentStructure = response.data;
      setStructure(departmentStructure.departments || []);
    } catch (error) {
      console.error("Error fetching department structure:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmation = (action, department) => {
    setConfirmAction(action);
    setConfirmDepartment(department);
    setIsConfirmOpen(true);
  };

  const confirmEditDepartment = () => {
    setIsConfirmOpen(false);
    editDepartment(confirmDepartment);
  };

  const confirmDeleteDepartment = () => {
    setIsConfirmOpen(false);
    deleteDepartment(confirmDepartment._id);
  };

  const addDepartment = async (parentId) => {
    setLoadingAction({ ...loadingAction, addSubDepartment: true });
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/department-structure/add-department`,
        { parentId, name: departmentName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const newDepartment = response.data.newDepartment;

      if (!parentId) {
        setStructure([...structure, newDepartment]);
      } else {
        const updateStructure = (departments) => {
          return departments.map((department) => {
            if (department._id === parentId) {
              return { ...department, subDepartments: [...(department.subDepartments || []), newDepartment] };
            } else if (department.subDepartments && department.subDepartments.length > 0) {
              return { ...department, subDepartments: updateStructure(department.subDepartments) };
            }
            return department;
          });
        };
        setStructure(updateStructure(structure));
      }

      setDepartmentName("");
      setShowInput(null);
    } catch (error) {
      console.error("Error adding department:", error);
    } finally {
      setLoadingAction({ ...loadingAction, addSubDepartment: false });
    }
  };

  const editDepartment = async (department) => {
    setLoadingAction({ ...loadingAction, editDepartment: true });
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/department-structure/edit-department`,
        { departmentId: department._id, name: editDepartmentName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updateStructure = (departments) => {
        return departments.map((d) => {
          if (d._id === department._id) {
            return { ...d, name: editDepartmentName };
          } else if (d.subDepartments && d.subDepartments.length > 0) {
            return { ...d, subDepartments: updateStructure(d.subDepartments) };
          }
          return d;
        });
      };

      setStructure(updateStructure(structure));
      setEditDepartmentId(null);
      setEditDepartmentName("");
    } catch (error) {
      console.error("Error editing department:", error);
    } finally {
      setLoadingAction({ ...loadingAction, editDepartment: false });
    }
  };

  const deleteDepartment = async (departmentId) => {
    setLoadingAction({ ...loadingAction, deleteDepartment: true });
    const token = localStorage.getItem("token");
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/department-structure/delete-department`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: { departmentId },
        }
      );

      const updateStructure = (departments) => {
        return departments
          .filter((department) => department._id !== departmentId)
          .map((department) => {
            if (department.subDepartments && department.subDepartments.length > 0) {
              return { ...department, subDepartments: updateStructure(department.subDepartments) };
            }
            return department;
          });
      };

      setStructure(updateStructure(structure));
    } catch (error) {
      console.error("Error deleting department:", error);
    } finally {
      setLoadingAction({ ...loadingAction, deleteDepartment: false });
    }
  };

  const renderDepartmentsTree = (departments, isRoot = false) => {
    return (
      <div className={`flex ${isRoot ? 'justify-center' : ''}`}>
        {departments.map((department) => (
          <div key={department._id} className={`flex flex-col items-center m-4 ${isRoot ? 'root-department' : ''}`}>
            <div className="bg-blue-200 rounded-xl shadow-md p-2 text-black">
              <p className="text-sm font-bold">{department.name}</p>
              <div className="flex space-x-2 mt-2">
                <Button
                  className="bg-blue-500 text-white"
                  onClick={() => setShowInput(department._id)}
                >
                  {loadingAction.addSubDepartment && showInput === department._id ? <Spinner size="sm" color="warning" /> : <FaPlus />}
                </Button>
                <Button
                  className="bg-yellow-500 text-white"
                  onClick={() => {
                    setEditDepartmentId(department._id);
                    setEditDepartmentName(department.name);
                  }}
                >
                  {loadingAction.editDepartment && editDepartmentId === department._id ? <Spinner size="sm" color="warning" /> : <FaEdit />}
                </Button>
              </div>
              {department.subDepartments?.length === 0 && (
                <Button
                  className="bg-red-500 text-white mt-2"
                  onClick={() => handleConfirmation('delete', department)}
                >
                  {loadingAction.deleteDepartment ? <Spinner size="sm" color="warning" /> : <FaTrash />}
                </Button>
              )}
              {showInput === department._id && (
                <div className="mt-2">
                  <Input
                    type="text"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    placeholder="Department Name"
                    className="border border-gray-300 p-2 rounded text-black"
                  />
                  <Button
                    className="bg-green-500 text-white ml-2"
                    onClick={() => addDepartment(department._id)}
                  >
                    {loadingAction.addSubDepartment ? <Spinner size="sm" color="warning" /> : <FaSave />}
                  </Button>
                </div>
              )}
              {editDepartmentId === department._id && (
                <div className="mt-2">
                  <Input
                    type="text"
                    value={editDepartmentName}
                    onChange={(e) => setEditDepartmentName(e.target.value)}
                    placeholder="Edit Department Name"
                    className="border border-gray-300 p-2 rounded text-black"
                  />
                  <Button
                    className="bg-green-500 text-white ml-2"
                    onClick={() => handleConfirmation('edit', department)}
                  >
                    {loadingAction.editDepartment ? <Spinner size="sm" color="warning" /> : <FaSave />}
                  </Button>
                </div>
              )}
            </div>
            {department.subDepartments && department.subDepartments.length > 0 && (
              <div className="flex justify-center mt-4">
                {renderDepartmentsTree(department.subDepartments)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderDepartmentsList = (departments) => {
    return (
      <div className="flex flex-col items-start">
        {departments.map((department) => (
          <div key={department._id} className="bg-blue-200 rounded-xl shadow-md p-2 m-2 text-black w-full border border-gray-400">
            <div className="flex justify-between">
              <p className="text-sm font-bold">{department.name}</p>
              <div className="flex space-x-2">
                <Button
                  className="bg-blue-500 text-white"
                  onClick={() => setShowInput(department._id)}
                >
                  {loadingAction.addSubDepartment && showInput === department._id ? <Spinner size="sm" color="warning" /> : <FaPlus />}
                </Button>
                <Button
                  className="bg-yellow-500 text-white"
                  onClick={() => {
                    setEditDepartmentId(department._id);
                    setEditDepartmentName(department.name);
                  }}
                >
                  {loadingAction.editDepartment && editDepartmentId === department._id ? <Spinner size="sm" color="warning" /> : <FaEdit />}
                </Button>
                {department.subDepartments?.length === 0 && (
                  <Button
                    className="bg-red-500 text-white"
                    onClick={() => handleConfirmation('delete', department)}
                  >
                    {loadingAction.deleteDepartment ? <Spinner size="sm" color="warning" /> : <FaTrash />}
                  </Button>
                )}
              </div>
            </div>
            {showInput === department._id && (
              <div className="mt-2">
                <Input
                  type="text"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="Department Name"
                  className="border border-gray-300 p-2 rounded text-black"
                />
                <Button
                  className="bg-green-500 text-white ml-2"
                  onClick={() => addDepartment(department._id)}
                >
                  {loadingAction.addSubDepartment ? <Spinner size="sm" color="warning" /> : <FaSave />}
                </Button>
              </div>
            )}
            {editDepartmentId === department._id && (
              <div className="mt-2">
                <Input
                  type="text"
                  value={editDepartmentName}
                  onChange={(e) => setEditDepartmentName(e.target.value)}
                  placeholder="Edit Department Name"
                  className="border border-gray-300 p-2 rounded text-black"
                />
                <Button
                  className="bg-green-500 text-white ml-2"
                  onClick={() => handleConfirmation('edit', department)}
                >
                  {loadingAction.editDepartment ? <Spinner size="sm" color="warning" /> : <FaSave />}
                </Button>
              </div>
            )}
            {department.subDepartments && department.subDepartments.length > 0 && (
              <div className="ml-6 mt-2">
                {renderDepartmentsList(department.subDepartments)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="department-structure-container flex flex-col items-center justify-center text-center p-8 bg-white rounded-lg shadow-lg min-h-screen overflow-x-auto">
      {loading ? (
        <Spinner size="lg" color="warning" />
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4 text-black">Define Department Structure</h1>

          <Button
            className="mb-4 bg-blue-500 text-white"
            onClick={() => setViewMode(viewMode === "tree" ? "list" : "tree")}
          >
            {viewMode === "tree" ? <FaList /> : <FaSitemap />} Switch to {viewMode === "tree" ? "List View" : "Tree View"}
          </Button>

          <div className="add-root-department mb-6 w-full max-w-md">
            {!structure.length && (
              <div>
                <Input
                  type="text"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="Root Department Name"
                  className="border border-gray-300 p-2 rounded mb-2 w-full text-black"
                />
                <Button
                  onClick={() => addDepartment(null)}
                  className="bg-blue-500 text-white w-full"
                >
                  {loadingAction.defineRoot ? <Spinner size="sm" color="warning" /> : 'Add Root Department'}
                </Button>
              </div>
            )}
          </div>

          {viewMode === "tree" ? (
            <div className="departments-tree w-full overflow-x-auto" ref={containerRef}>
              {structure.length > 0 && (
                <div className="flex flex-col items-center">
                  {renderDepartmentsTree(structure, true)}
                </div>
              )}
            </div>
          ) : (
            <div className="departments-list w-full" ref={containerRef}>
              {structure.length > 0 && (
                <div className="flex flex-col items-center">
                  {renderDepartmentsList(structure)}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title={confirmAction === "delete" ? "Delete Department" : "Edit Department"}
        onConfirm={
          confirmAction === "delete" ? confirmDeleteDepartment : confirmEditDepartment
        }
      >
        Are you sure you want to {confirmAction} this department?
      </Modal>
    </div>
  );
};

export default DepartmentStructure;
