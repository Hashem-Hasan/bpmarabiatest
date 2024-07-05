"use client";
import React, { useState, useEffect } from "react";
import { Button, Input, Spinner } from "@nextui-org/react";
import axios from "axios";

const CompanyStructure = () => {
  const [structure, setStructure] = useState([]);
  const [showInput, setShowInput] = useState(null);
  const [roleName, setRoleName] = useState("");
  const [editRoleId, setEditRoleId] = useState(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStructure();
  }, []);

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
    }
  };

  const editRole = async (roleId) => {
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
    }
  };

  const deleteRole = async (roleId) => {
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
    }
  };

  const renderRoles = (roles) => {
    return roles.map((role) => (
      <div key={role._id} className="flex flex-col items-center mt-4">
        <div className="bg-orange-200 rounded-xl shadow-md p-2 text-black relative">
          <p className="text-sm font-bold">{role.name}</p>
          <div className="flex space-x-2 mt-2">
            <Button
              className="bg-orange-500 text-white"
              onClick={() => setShowInput(role._id)}
            >
              Add Subrole
            </Button>
            <Button
              className="bg-yellow-500 text-white"
              onClick={() => {
                setEditRoleId(role._id);
                setEditRoleName(role.name);
              }}
            >
              Edit
            </Button>
          </div>
          {role.subRoles?.length === 0 && (
            <Button
              className="bg-red-500 text-white mt-2"
              onClick={() => deleteRole(role._id)}
            >
              Delete
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
                Save
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
                Save
              </Button>
            </div>
          )}
        </div>
        {role.subRoles && role.subRoles.length > 0 && (
          <div className="flex space-x-4 mt-4">
            {renderRoles(role.subRoles)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="company-structure overflow-x-auto p-8 bg-white rounded-lg shadow-lg min-h-screen flex flex-col items-center justify-center text-center">
      {loading ? (
        <Spinner size="lg" color="warning" />
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4 text-black">
            Define Company Structure
          </h1>

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
                  Add Root Role
                </Button>
              </div>
            )}
          </div>

          <div className="roles-tree">
            {structure.length > 0 && (
              <div className="flex flex-col items-center">
                {renderRoles(structure)}
                <Button
                  className="bg-orange-500 w-96 mt-44 text-white"
                  onClick={() => (window.location.href = '/employeesys')}
                >
                  Next Step
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CompanyStructure;
