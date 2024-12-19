"use client";
import React, { useState, useEffect } from "react";
import { Button, Input, Spinner, Card, CardHeader, CardBody, CardFooter } from "@nextui-org/react";
import axios from "axios";

const AccountSettings = () => {
  const [userInfo, setUserInfo] = useState(null); // Start without default info
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [token, setToken] = useState(null);
  const [isEmployee, setIsEmployee] = useState(false);

  // Fetch the token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token") || localStorage.getItem("employeeToken");
    setToken(storedToken);
    setIsEmployee(!!localStorage.getItem("employeeToken"));
  }, []);

  // Fetch user information when token is available
  useEffect(() => {
    if (token) {
      fetchUserInfo();
    }
  }, [token]);

  // Fetch user information based on the type of user (employee or main user)
  const fetchUserInfo = async () => {
    try {
      const endpoint = isEmployee
        ? `${process.env.NEXT_PUBLIC_API_HOST}/api/employeess/me`
        : `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/me`;
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Fetched User Info: ", response.data); // Log the fetched data for debugging
      setUserInfo(response.data);
      setPhoneNumber(response.data.phoneNumber); // Set phone number separately for editing
    } catch (error) {
      console.error("Error fetching user info:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle save after editing
  const handleSave = async () => {
    try {
      const endpoint = isEmployee
        ? `${process.env.NEXT_PUBLIC_API_HOST}/api/employeess/update`
        : `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/update`;
      await axios.put(
        endpoint,
        {
          phoneNumber,
          oldPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setEditing(false);
      fetchUserInfo(); // Refresh user info after saving
    } catch (error) {
      console.error("Error updating user info:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center bg-white items-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!userInfo) {
    return <div className="text-center p-8">User info not found.</div>;
  }

  // Determine the logo URL based on user type
  const logoUrl = isEmployee
    ? userInfo.company?.logo // Assuming company is populated for employees
    : userInfo.logo; // User's own logo for main users

  return (
    <div className="p-8 bg-white flex flex-col items-center">
      <Card className="w-full max-w-5xl shadow-lg">
        {/* Logo and User Info Section */}
        <CardHeader className="flex justify-between items-center px-6">
          {/* Display Logo */}
          {logoUrl && (
            <img
              src={logoUrl}
              alt={isEmployee ? `${userInfo.company.companyName} Logo` : 'User Logo'}
              className="h-16 w-16 object-contain rounded-md"
              onError={(e) => {
                e.target.onerror = null; // Prevent infinite loop if fallback also fails
                e.target.src = "/fallback-logo.png"; // Path to a fallback logo image
              }}
              loading="lazy" // Optional: Improves performance by lazy loading the image
            />
          )}

          {/* User Info and Edit Button */}
          <div className="flex-1 ml-4">
            <h2 className="text-3xl font-bold text-[#14BAB6] mb-2">{userInfo.fullName}</h2>
            <p className="text-gray-500">{isEmployee ? userInfo.email : userInfo.businessMail}</p>
          </div>
          <Button
            color={editing ? "success" : "primary"}
            onClick={() => setEditing(!editing)}
            className="bg-[#14BAB6] text-white"
          >
            {editing ? "Save" : "Edit"}
          </Button>
        </CardHeader>

        <CardBody className="grid grid-cols-2 gap-6 mt-6 px-6 mb-12">
          {/* Full Name */}
          <div className="max-w-md w-full">
            <label className="text-gray-600">Full Name</label>
            <Input
              type="text"
              value={userInfo.fullName}
              disabled
              className="mt-1 bg-gray-100 border-none rounded-md w-full"
              style={{ color: '#999', cursor: 'not-allowed' }}
            />
          </div>

          {/* Only show Company Name and Size for non-employee users */}
          {!isEmployee && (
            <>
              {/* Company Name */}
              <div className="max-w-md w-full">
                <label className="text-gray-600">Company Name</label>
                <Input
                  type="text"
                  value={userInfo.companyName}
                  disabled
                  className="mt-1 bg-gray-100 border-none rounded-md w-full"
                  style={{ color: '#999', cursor: 'not-allowed' }}
                />
              </div>

              {/* Company Size */}
              <div className="max-w-md w-full">
                <label className="text-gray-600">Company Size</label>
                <Input
                  type="text"
                  value={userInfo.companySize}
                  disabled
                  className="mt-1 bg-gray-100 border-none rounded-md w-full"
                  style={{ color: '#999', cursor: 'not-allowed' }}
                />
              </div>
            </>
          )}

          {/* Phone Number */}
          <div className="max-w-md w-full">
            <label className="text-gray-600">Phone Number</label>
            <Input
              type="text"
              value={phoneNumber}
              disabled={!editing}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={`mt-1 rounded-md w-full ${
                editing ? "bg-white border-gray-300" : "bg-gray-100 border-none"
              }`}
              style={!editing ? { color: '#999', cursor: 'not-allowed' } : {}}
            />
          </div>

          {/* Old Password */}
          {editing && (
            <>
              <div className="col-span-2 max-w-md w-full">
                <label className="text-gray-600">Old Password</label>
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="mt-1 rounded-md border-gray-300 w-full"
                  placeholder="Enter old password"
                />
              </div>

              {/* New Password */}
              <div className="col-span-2 max-w-md w-full">
                <label className="text-gray-600">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 rounded-md border-gray-300 w-full"
                  placeholder="Enter new password"
                />
              </div>
            </>
          )}
        </CardBody>

        {editing && (
          <CardFooter className="flex justify-end">
            <Button
              color="success"
              onClick={handleSave}
              disabled={loading}
              className="mr-4 text-white bg-[#14BAB6]"
            >
              {loading ? <Spinner size="sm" /> : "Save"}
            </Button>
            <Button
              color="danger"
              onClick={() => setEditing(false)}
              className="bg-red-500"
            >
              Cancel
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default AccountSettings;