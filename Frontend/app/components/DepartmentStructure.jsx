"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaList,
  FaSitemap,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import axios from "axios";
import Modal from "./Modal"; // Import the custom modal component
import { motion, AnimatePresence } from "framer-motion";
import { Spinner, Input, Button } from "@nextui-org/react";

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
  const [expandedDepartments, setExpandedDepartments] = useState([]); // Array to track expanded departments in tree view

  const containerRef = useRef(null);

  useEffect(() => {
    fetchStructure();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const rootElement = containerRef.current.querySelector(".root-department");
      if (rootElement) {
        containerRef.current.scrollLeft =
          rootElement.offsetLeft -
          (containerRef.current.clientWidth - rootElement.clientWidth) / 2;
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
              return {
                ...department,
                subDepartments: [
                  ...(department.subDepartments || []),
                  newDepartment,
                ],
              };
            } else if (
              department.subDepartments &&
              department.subDepartments.length > 0
            ) {
              return {
                ...department,
                subDepartments: updateStructure(department.subDepartments),
              };
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
            return {
              ...d,
              subDepartments: updateStructure(d.subDepartments),
            };
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
            if (
              department.subDepartments &&
              department.subDepartments.length > 0
            ) {
              return {
                ...department,
                subDepartments: updateStructure(department.subDepartments),
              };
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

  const toggleExpand = (departmentId) => {
    setExpandedDepartments((prev) =>
      prev.includes(departmentId)
        ? prev.filter((id) => id !== departmentId)
        : [...prev, departmentId]
    );
  };

  const renderDepartmentsTree = (departments, isRoot = false) => {
    return (
      <div className={`flex ${isRoot ? "justify-center" : "justify-start"} items-start`}>
        {departments.map((department) => (
          <div
            key={department._id}
            className={`flex flex-col items-center m-4 relative ${isRoot ? "root-department" : ""}`}
          >
            {!isRoot && (
              <div className="absolute top-0 left-1/2 w-px h-4 bg-gray-400"></div>
            )}

            <motion.div
              className="bg-[#F7F9FC] border border-gray-300 rounded-xl shadow-md p-4 text-black flex flex-col items-center relative"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {department.subDepartments && department.subDepartments.length > 0 && (
                <button
                  onClick={() => toggleExpand(department._id)}
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 focus:outline-none"
                >
                  {expandedDepartments.includes(department._id) ? (
                    <FaChevronDown size={14} />
                  ) : (
                    <FaChevronRight size={14} />
                  )}
                </button>
              )}

              <p className="text-sm font-bold">{department.name}</p>
              <div className="flex space-x-2 mt-2">
                <button
                  className="text-[#14BAB6] rounded-full p-1 hover:text-[#15986a] focus:outline-none transition-all"
                  onClick={() => setShowInput(department._id)}
                >
                  <FaPlus size={14} />
                </button>
                <button
                  className="text-gray-400 rounded-full p-1 hover:text-gray-500 focus:outline-none transition-all"
                  onClick={() => {
                    setEditDepartmentId(department._id);
                    setEditDepartmentName(department.name);
                  }}
                >
                  <FaEdit size={14} />
                </button>
                {department.subDepartments?.length === 0 && (
                  <button
                    className="text-red-500 rounded-full p-1 hover:text-red-600 focus:outline-none transition-all"
                    onClick={() => handleConfirmation("delete", department)}
                  >
                    <FaTrash size={14} />
                  </button>
                )}
              </div>
              {showInput === department._id && (
                <div className="mt-2 flex items-center space-x-2">
                  <Input
                    type="text"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    placeholder="Department Name"
                    className="border border-gray-300 p-1 rounded text-black w-32"
                  />
                  <button
                    className="bg-[#14BAB6] text-white rounded px-2 py-1 hover:bg-[#15986a] focus:outline-none flex items-center"
                    onClick={() => addDepartment(department._id)}
                  >
                    <FaSave size={14} className="mr-1" />
                    Save
                  </button>
                </div>
              )}
              {editDepartmentId === department._id && (
                <div className="mt-2 flex items-center space-x-2">
                  <Input
                    type="text"
                    value={editDepartmentName}
                    onChange={(e) => setEditDepartmentName(e.target.value)}
                    placeholder="Edit Department Name"
                    className="border border-gray-300 p-1 rounded text-black w-32"
                  />
                  <button
                    className="bg-[#14BAB6] text-white rounded px-2 py-1 hover:bg-[#15986a] focus:outline-none flex items-center"
                    onClick={() =>
                      handleConfirmation("edit", { _id: editDepartmentId, name: editDepartmentName })
                    }
                  >
                    <FaSave size={14} className="mr-1" />
                    Save
                  </button>
                </div>
              )}
            </motion.div>

            {department.subDepartments && department.subDepartments.length > 0 && expandedDepartments.includes(department._id) && (
              <AnimatePresence>
                <motion.div
                  className="flex flex-col items-center mt-4"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-px h-4 bg-gray-400"></div>
                  <div className="flex justify-center items-start">
                    {renderDepartmentsTree(department.subDepartments)}
                  </div>
                </motion.div>
              </AnimatePresence>
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
          <div
            key={department._id}
            className="bg-[#F7F9FC] border border-gray-300 rounded-xl shadow-md p-4 m-2 text-black w-full"
          >
            <div className="flex justify-between">
              <p className="text-sm font-bold">{department.name}</p>
              <div className="flex space-x-2">
                <button
                  className="text-[#14BAB6] rounded-full p-1 hover:text-[#15986a] focus:outline-none transition-all"
                  onClick={() => setShowInput(department._id)}
                >
                  <FaPlus size={14} />
                </button>
                <button
                  className="text-gray-400 rounded-full p-1 hover:text-gray-500 focus:outline-none transition-all"
                  onClick={() => {
                    setEditDepartmentId(department._id);
                    setEditDepartmentName(department.name);
                  }}
                >
                  <FaEdit size={14} />
                </button>
                {department.subDepartments?.length === 0 && (
                  <button
                    className="text-red-500 rounded-full p-1 hover:text-red-600 focus:outline-none transition-all"
                    onClick={() => handleConfirmation("delete", department)}
                  >
                    <FaTrash size={14} />
                  </button>
                )}
              </div>
            </div>
            {showInput === department._id && (
              <div className="mt-2 flex">
                <Input
                  type="text"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="Department Name"
                  className="border border-gray-300 p-2 rounded text-black"
                />
                <button
                  className="bg-[#14BAB6] text-white rounded px-2 py-1 hover:bg-[#15986a] focus:outline-none flex items-center"
                  onClick={() => addDepartment(department._id)}
                >
                  <FaSave size={14} className="mr-1" />
                  Save
                </button>
              </div>
            )}
            {editDepartmentId === department._id && (
              <div className="mt-2 flex">
                <Input
                  type="text"
                  value={editDepartmentName}
                  onChange={(e) => setEditDepartmentName(e.target.value)}
                  placeholder="Edit Department Name"
                  className="border border-gray-300 p-2 rounded text-black"
                />
                <button
                  className="bg-[#14BAB6] text-white rounded px-2 py-1 hover:bg-[#15986a] focus:outline-none flex items-center"
                  onClick={() => handleConfirmation("edit", department)}
                >
                  <FaSave size={14} className="mr-1" />
                  Save
                </button>
              </div>
            )}
            {department.subDepartments &&
              department.subDepartments.length > 0 && (
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
    <div className="department-structure-container flex flex-col items-center justify-center text-center p-8 bg-white rounded-lg shadow-lg min-h-screen overflow-x-hidden">
      {loading ? (
        <Spinner size="lg" color="primary" />
      ) : (
        <>
          <h1 className="text-4xl font-bold mb-6 text-black">
            Define Department Structure
          </h1>

          <Button
            className="mb-4 bg-[#14BAB6] text-white flex items-center"
            onClick={() => setViewMode(viewMode === "tree" ? "list" : "tree")}
            auto
          >
            {viewMode === "tree" ? (
              <>
                <FaList className="mr-2" />
                Switch to List View
              </>
            ) : (
              <>
                <FaSitemap className="mr-2" />
                Switch to Tree View
              </>
            )}
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
                  className="bg-[#14BAB6] text-white w-full flex items-center justify-center"
                  auto
                >
                  {loadingAction.defineRoot ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    <>
                      <FaPlus className="mr-2" />
                      Add Root Department
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {viewMode === "tree" ? (
            <div
              className="departments-tree w-full overflow-x-auto"
              ref={containerRef}
            >
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

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title={confirmAction === "delete" ? "Delete Department" : "Edit Department"}
        onConfirm={confirmAction === "delete" ? confirmDeleteDepartment : confirmEditDepartment}
        hideFooter={false}
      >
        <p className="text-black">
          Are you sure you want to {confirmAction} this department?
        </p>
      </Modal>
    </div>
  );
};

export default DepartmentStructure;
