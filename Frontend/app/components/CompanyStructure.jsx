// components/CompanyStructure.js
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
import { useDrag } from '@use-gesture/react';


const CompanyStructure = () => {
  const [structure, setStructure] = useState([]);
  const [showInput, setShowInput] = useState(null);
  const [roleName, setRoleName] = useState("");
  const [editRoleId, setEditRoleId] = useState(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState({
    addSubrole: false,
    defineRoot: false,
    deleteRole: false,
    editRole: false,
  });
  const [viewMode, setViewMode] = useState("tree");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmRole, setConfirmRole] = useState(null);
  const [expandedRoles, setExpandedRoles] = useState([]); // Array to track expanded roles in tree view

  const containerRef = useRef(null);

  
  useEffect(() => {
    fetchStructure();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const rootElement = containerRef.current.querySelector(".root-role");
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
        `${process.env.NEXT_PUBLIC_API_HOST}/api/company-structure`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const companyStructure = response.data;
      setStructure(companyStructure.roles || []);
    } catch (error) {
      console.error("Error fetching company structure:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmation = (action, role) => {
    setConfirmAction(action);
    setConfirmRole(role);
    setIsConfirmOpen(true);
  };

  const confirmEditRole = () => {
    setIsConfirmOpen(false);
    editRole(confirmRole);
  };

  const confirmDeleteRole = () => {
    setIsConfirmOpen(false);
    deleteRole(confirmRole._id);
  };

  const addRole = async (parentId) => {
    if (!roleName.trim()) {
      alert("Role name cannot be empty.");
      return;
    }

    setLoadingAction({ ...loadingAction, addSubrole: true });
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/company-structure/add-role`,
        { parentId, name: roleName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const newRole = response.data.newRole;

      if (!parentId) {
        setStructure([...structure, { ...newRole, subRoles: [] }]);
      } else {
        const updatedStructure = addSubRole(structure, parentId, newRole);
        setStructure(updatedStructure);
        setExpandedRoles([...expandedRoles, parentId]); // Expand parent to show new subrole
      }

      setRoleName("");
      setShowInput(null);
    } catch (error) {
      console.error("Error adding role:", error);
    } finally {
      setLoadingAction({ ...loadingAction, addSubrole: false });
    }
  };

  const addSubRole = (roles, parentId, newRole) => {
    return roles.map((role) => {
      if (role._id === parentId) {
        return {
          ...role,
          subRoles: [...(role.subRoles || []), { ...newRole, subRoles: [] }],
        };
      } else if (role.subRoles && role.subRoles.length > 0) {
        return {
          ...role,
          subRoles: addSubRole(role.subRoles, parentId, newRole),
        };
      }
      return role;
    });
  };

  const editRole = async (role) => {
    if (!editRoleName.trim()) {
      alert("Role name cannot be empty.");
      return;
    }

    setLoadingAction({ ...loadingAction, editRole: true });
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/company-structure/edit-role`,
        { roleId: role._id, name: editRoleName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedStructure = updateRoleName(structure, role._id, editRoleName);
      setStructure(updatedStructure);
      setEditRoleId(null);
      setEditRoleName("");
    } catch (error) {
      console.error("Error editing role:", error);
    } finally {
      setLoadingAction({ ...loadingAction, editRole: false });
    }
  };

  const updateRoleName = (roles, roleId, newName) => {
    return roles.map((role) => {
      if (role._id === roleId) {
        return { ...role, name: newName };
      } else if (role.subRoles && role.subRoles.length > 0) {
        return { ...role, subRoles: updateRoleName(role.subRoles, roleId, newName) };
      }
      return role;
    });
  };

  const deleteRole = async (roleId) => {
    setLoadingAction({ ...loadingAction, deleteRole: true });
    const token = localStorage.getItem("token");
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/company-structure/delete-role`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: { roleId },
        }
      );

      const updatedStructure = removeRole(structure, roleId);
      setStructure(updatedStructure);
    } catch (error) {
      console.error("Error deleting role:", error);
    } finally {
      setLoadingAction({ ...loadingAction, deleteRole: false });
    }
  };

  const removeRole = (roles, roleId) => {
    return roles
      .filter((role) => role._id !== roleId)
      .map((role) => {
        if (role.subRoles && role.subRoles.length > 0) {
          return {
            ...role,
            subRoles: removeRole(role.subRoles, roleId),
          };
        }
        return role;
      });
  };

  

  const renderRolesTree = (roles, isRoot = false) => {
    return (
      <div className={`flex ${isRoot ? "justify-center" : "justify-start"} items-start`}>
        {roles.map((role) => (
          <div
            key={role._id}
            className={`flex flex-col items-center m-4 relative ${isRoot ? "root-role" : ""}`}
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
              <p className="text-sm font-bold">{role.name}</p>
              <div className="flex space-x-2 mt-2">
                <button
                  className="text-[#14BAB6] rounded-full p-1 hover:text-[#15986a] focus:outline-none transition-all"
                  onClick={() => setShowInput(role._id)}
                >
                  <FaPlus size={14} />
                </button>
                <button
                  className="text-gray-400 rounded-full p-1 hover:text-gray-500 focus:outline-none transition-all"
                  onClick={() => {
                    setEditRoleId(role._id);
                    setEditRoleName(role.name);
                  }}
                >
                  <FaEdit size={14} />
                </button>
                {role.subRoles?.length === 0 && (
                  <button
                    className="text-red-500 rounded-full p-1 hover:text-red-600 focus:outline-none transition-all"
                    onClick={() => handleConfirmation("delete", role)}
                  >
                    <FaTrash size={14} />
                  </button>
                )}
              </div>
              {showInput === role._id && (
                <div className="mt-2 flex items-center space-x-2">
                  <Input
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="Role Name"
                    className="border border-gray-300 p-1 rounded text-black w-32"
                  />
                  <button
                    className="bg-[#14BAB6] text-white rounded px-2 py-1 hover:bg-[#15986a] focus:outline-none flex items-center"
                    onClick={() => addRole(role._id)}
                  >
                    <FaSave size={14} className="mr-1" />
                    Save
                  </button>
                </div>
              )}
              {editRoleId === role._id && (
                <div className="mt-2 flex items-center space-x-2">
                  <Input
                    type="text"
                    value={editRoleName}
                    onChange={(e) => setEditRoleName(e.target.value)}
                    placeholder="Edit Role Name"
                    className="border border-gray-300 p-1 rounded text-black w-32"
                  />
                  <button
                    className="bg-[#14BAB6] text-white rounded px-2 py-1 hover:bg-[#15986a] focus:outline-none flex items-center"
                    onClick={() =>
                      handleConfirmation("edit", { _id: editRoleId, name: editRoleName })
                    }
                  >
                    <FaSave size={14} className="mr-1" />
                    Save
                  </button>
                </div>
              )}
            </motion.div>
  
            {role.subRoles && role.subRoles.length > 0 && (
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
                    {renderRolesTree(role.subRoles)}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderRolesList = (roles) => {
    return (
      <div className="flex flex-col items-start">
        {roles.map((role) => (
          <div
            key={role._id}
            className="bg-[#F7F9FC] border border-gray-300 rounded-xl shadow-md p-4 m-2 text-black w-full"
          >
            <div className="flex justify-between">
              <p className="text-sm font-bold">{role.name}</p>
              <div className="flex space-x-2">
                <button
                  className="text-[#14BAB6] rounded-full p-1 hover:text-[#15986a] focus:outline-none transition-all"
                  onClick={() => setShowInput(role._id)}
                >
                  <FaPlus size={14} />
                </button>
                <button
                  className="text-gray-400 rounded-full p-1 hover:text-gray-500 focus:outline-none transition-all"
                  onClick={() => {
                    setEditRoleId(role._id);
                    setEditRoleName(role.name);
                  }}
                >
                  <FaEdit size={14} />
                </button>
                {role.subRoles?.length === 0 && (
                  <button
                    className="text-red-500 rounded-full p-1 hover:text-red-600 focus:outline-none transition-all"
                    onClick={() => handleConfirmation("delete", role)}
                  >
                    <FaTrash size={14} />
                  </button>
                )}
              </div>
            </div>
            {showInput === role._id && (
              <div className="mt-2 flex">
                <Input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Role Name"
                  className="border border-gray-300 p-2 rounded text-black"
                />
                <button
                  className="bg-[#14BAB6] text-white rounded px-2 py-1 hover:bg-[#15986a] focus:outline-none flex items-center"
                  onClick={() => addRole(role._id)}
                >
                  <FaSave size={14} className="mr-1" />
                  Save
                </button>
              </div>
            )}
            {editRoleId === role._id && (
              <div className="mt-2 flex">
                <Input
                  type="text"
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  placeholder="Edit Role Name"
                  className="border border-gray-300 p-2 rounded text-black"
                />
                <button
                  className="bg-[#14BAB6] text-white rounded px-2 py-1 hover:bg-[#15986a] focus:outline-none flex items-center"
                  onClick={() => handleConfirmation("edit", role)}
                >
                  <FaSave size={14} className="mr-1" />
                  Save
                </button>
              </div>
            )}
            {role.subRoles && role.subRoles.length > 0 && (
              <div className="ml-6 mt-2">
                {renderRolesList(role.subRoles)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="company-structure-container flex flex-col items-start text-center p-8 bg-white rounded-lg shadow-lg min-h-screen overflow-hidden">
      {loading ? (
        <div className="flex justify-center items-center w-full h-full">
          <Spinner size="lg" color="primary" />
        </div>
      ) : (
        <div className="w-full mt-20">
          {/* Title at the Top Left */}
          <h1 className="text-4xl font-bold text-black text-left w-full mb-4">
            Define Company Structure
          </h1>
  
          {/* Centered Button */}
          <div className="flex justify-center mb-6">
            <Button
              className="bg-[#14BAB6] text-white flex items-center"
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
          </div>
  
          {/* Root Role Input */}
          <div className="add-root-role mb-6 w-full max-w-md">
            {!structure.length && (
              <div>
                <Input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Root Role Name"
                  className="border border-gray-300 p-2 rounded mb-2 w-full text-black"
                />
                <Button
                  onClick={() => addRole(null)}
                  className="bg-[#14BAB6] text-white w-full flex items-center justify-center"
                  auto
                >
                  {loadingAction.defineRoot ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    <>
                      <FaPlus className="mr-2" />
                      Add Root Role
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
  
          {/* Scrollable Area for Roles Tree/List */}
          {viewMode === "tree" ? (
            <div className="roles-tree w-full overflow-y-auto h-[600px] p-4 border rounded-lg" ref={containerRef}>
              {structure.length > 0 && (
                <div className="flex flex-col items-start">
                  {renderRolesTree(structure, true)}
                </div>
              )}
            </div>
          ) : (
            <div className="roles-list w-full overflow-y-auto h-[600px] p-4 border rounded-lg" ref={containerRef}>
              {structure.length > 0 && (
                <div className="flex flex-col items-center">
                  {renderRolesList(structure)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
  
      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title={confirmAction === "delete" ? "Delete Role" : "Edit Role"}
        onConfirm={confirmAction === "delete" ? confirmDeleteRole : confirmEditRole}
      >
        <p className="text-black">
          Are you sure you want to {confirmAction} this role?
        </p>
      </Modal>
    </div>
  );
  
  
};

export default CompanyStructure;
