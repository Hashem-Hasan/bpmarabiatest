"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button, Input, Spinner } from "@nextui-org/react";
import { FaPlus, FaEdit, FaTrash, FaSave, FaList, FaSitemap } from "react-icons/fa";
import axios from "axios";

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
  const [viewMode, setViewMode] = useState("tree"); // Added view mode state

  const containerRef = useRef(null);

  useEffect(() => {
    fetchStructure();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const rootElement = containerRef.current.querySelector(".root-role");
      if (rootElement) {
        containerRef.current.scrollLeft = rootElement.offsetLeft - (containerRef.current.clientWidth - rootElement.clientWidth) / 2;
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

  const addRole = async (parentId) => {
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
        setStructure([...structure, newRole]);
      } else {
        const updateStructure = (roles) => {
          return roles.map((role) => {
            if (role._id === parentId) {
              return { ...role, subRoles: [...(role.subRoles || []), newRole] };
            } else if (role.subRoles && role.subRoles.length > 0) {
              return { ...role, subRoles: updateStructure(role.subRoles) };
            }
            return role;
          });
        };
        setStructure(updateStructure(structure));
      }

      setRoleName("");
      setShowInput(null);
    } catch (error) {
      console.error("Error adding role:", error);
    } finally {
      setLoadingAction({ ...loadingAction, addSubrole: false });
    }
  };

  const editRole = async (roleId) => {
    setLoadingAction({ ...loadingAction, editRole: true });
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/company-structure/edit-role`,
        { roleId, name: editRoleName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updateStructure = (roles) => {
        return roles.map((role) => {
          if (role._id === roleId) {
            return { ...role, name: editRoleName };
          } else if (role.subRoles && role.subRoles.length > 0) {
            return { ...role, subRoles: updateStructure(role.subRoles) };
          }
          return role;
        });
      };

      setStructure(updateStructure(structure));
      setEditRoleId(null);
      setEditRoleName("");
    } catch (error) {
      console.error("Error editing role:", error);
    } finally {
      setLoadingAction({ ...loadingAction, editRole: false });
    }
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

      const updateStructure = (roles) => {
        return roles
          .filter((role) => role._id !== roleId)
          .map((role) => {
            if (role.subRoles && role.subRoles.length > 0) {
              return { ...role, subRoles: updateStructure(role.subRoles) };
            }
            return role;
          });
      };

      setStructure(updateStructure(structure));
    } catch (error) {
      console.error("Error deleting role:", error);
    } finally {
      setLoadingAction({ ...loadingAction, deleteRole: false });
    }
  };

  const renderRolesTree = (roles, isRoot = false) => {
    return (
      <div className={`flex ${isRoot ? 'justify-center' : ''}`}>
        {roles.map((role) => (
          <div key={role._id} className={`flex flex-col items-center m-4 ${isRoot ? 'root-role' : ''}`}>
            <div className="bg-orange-200 rounded-xl shadow-md p-2 text-black">
              <p className="text-sm font-bold">{role.name}</p>
              <div className="flex space-x-2 mt-2">
                <Button
                  className="bg-orange-500 text-white"
                  onClick={() => setShowInput(role._id)}
                >
                  {loadingAction.addSubrole && showInput === role._id ? <Spinner size="sm" color="warning" /> : <FaPlus />}
                </Button>
                <Button
                  className="bg-yellow-500 text-white"
                  onClick={() => {
                    setEditRoleId(role._id);
                    setEditRoleName(role.name);
                  }}
                >
                  {loadingAction.editRole && editRoleId === role._id ? <Spinner size="sm" color="warning" /> : <FaEdit />}
                </Button>
              </div>
              {role.subRoles?.length === 0 && (
                <Button
                  className="bg-red-500 text-white mt-2"
                  onClick={() => deleteRole(role._id)}
                >
                  {loadingAction.deleteRole ? <Spinner size="sm" color="warning" /> : <FaTrash />}
                </Button>
              )}
              {showInput === role._id && (
                <div className="mt-2">
                  <Input
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="Role Name"
                    className="border border-gray-300 p-2 rounded text-black"
                  />
                  <Button
                    className="bg-green-500 text-white ml-2"
                    onClick={() => addRole(role._id)}
                  >
                    {loadingAction.addSubrole ? <Spinner size="sm" color="warning" /> : <FaSave />}
                  </Button>
                </div>
              )}
              {editRoleId === role._id && (
                <div className="mt-2">
                  <Input
                    type="text"
                    value={editRoleName}
                    onChange={(e) => setEditRoleName(e.target.value)}
                    placeholder="Edit Role Name"
                    className="border border-gray-300 p-2 rounded text-black"
                  />
                  <Button
                    className="bg-green-500 text-white ml-2"
                    onClick={() => editRole(role._id)}
                  >
                    {loadingAction.editRole ? <Spinner size="sm" color="warning" /> : <FaSave />}
                  </Button>
                </div>
              )}
            </div>
            {role.subRoles && role.subRoles.length > 0 && (
              <div className="flex justify-center mt-4">
                {renderRolesTree(role.subRoles)}
              </div>
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
          <div key={role._id} className="bg-orange-200 rounded-xl shadow-md p-2 m-2 text-black w-full border border-gray-400">
            <div className="flex justify-between">
              <p className="text-sm font-bold">{role.name}</p>
              <div className="flex space-x-2">
                <Button
                  className="bg-orange-500 text-white"
                  onClick={() => setShowInput(role._id)}
                >
                  {loadingAction.addSubrole && showInput === role._id ? <Spinner size="sm" color="warning" /> : <FaPlus />}
                </Button>
                <Button
                  className="bg-yellow-500 text-white"
                  onClick={() => {
                    setEditRoleId(role._id);
                    setEditRoleName(role.name);
                  }}
                >
                  {loadingAction.editRole && editRoleId === role._id ? <Spinner size="sm" color="warning" /> : <FaEdit />}
                </Button>
                {role.subRoles?.length === 0 && (
                  <Button
                    className="bg-red-500 text-white"
                    onClick={() => deleteRole(role._id)}
                  >
                    {loadingAction.deleteRole ? <Spinner size="sm" color="warning" /> : <FaTrash />}
                  </Button>
                )}
              </div>
            </div>
            {showInput === role._id && (
              <div className="mt-2">
                <Input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Role Name"
                  className="border border-gray-300 p-2 rounded text-black"
                />
                <Button
                  className="bg-green-500 text-white ml-2"
                  onClick={() => addRole(role._id)}
                >
                  {loadingAction.addSubrole ? <Spinner size="sm" color="warning" /> : <FaSave />}
                </Button>
              </div>
            )}
            {editRoleId === role._id && (
              <div className="mt-2">
                <Input
                  type="text"
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  placeholder="Edit Role Name"
                  className="border border-gray-300 p-2 rounded text-black"
                />
                <Button
                  className="bg-green-500 text-white ml-2"
                  onClick={() => editRole(role._id)}
                >
                  {loadingAction.editRole ? <Spinner size="sm" color="warning" /> : <FaSave />}
                </Button>
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
    <div className="company-structure-container flex flex-col items-center justify-center text-center p-8 bg-white rounded-lg shadow-lg min-h-screen overflow-x-auto">
      {loading ? (
        <Spinner size="lg" color="warning" />
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4 text-black">Define Company Structure</h1>

          <Button
            className="mb-4 bg-blue-500 text-white"
            onClick={() => setViewMode(viewMode === "tree" ? "list" : "tree")}
          >
            {viewMode === "tree" ? <FaList /> : <FaSitemap />} Switch to {viewMode === "tree" ? "List View" : "Tree View"}
          </Button>

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
                  className="bg-orange-500 text-white w-full"
                >
                  {loadingAction.defineRoot ? <Spinner size="sm" color="warning" /> : 'Add Root Role'}
                </Button>
              </div>
            )}
          </div>

          {viewMode === "tree" ? (
            <div className="roles-tree w-full overflow-x-auto" ref={containerRef}>
              {structure.length > 0 && (
                <div className="flex flex-col items-center">
                  {renderRolesTree(structure, true)}
                </div>
              )}
            </div>
          ) : (
            <div className="roles-list w-full" ref={containerRef}>
              {structure.length > 0 && (
                <div className="flex flex-col items-center">
                  {renderRolesList(structure)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CompanyStructure;
