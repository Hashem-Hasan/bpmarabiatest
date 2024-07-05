"use client";
import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Spinner,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
} from "@nextui-org/react";
import axios from "axios";

const AccountSettings = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [token, setToken] = useState(null);
  const [isEmployee, setIsEmployee] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token") || localStorage.getItem("employeeToken");
    setToken(storedToken);
    setIsEmployee(!!localStorage.getItem("employeeToken"));
  }, []);

  useEffect(() => {
    if (token) {
      fetchUserInfo();
    }
  }, [token]);

  const fetchUserInfo = async () => {
    try {
      const endpoint = isEmployee ? 
        `${process.env.NEXT_PUBLIC_API_HOST}/api/employeess/me` : 
        `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/me`;
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserInfo(response.data);
      setPhoneNumber(response.data.phoneNumber);
    } catch (error) {
      console.error("Error fetching user info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const endpoint = isEmployee ? 
        `${process.env.NEXT_PUBLIC_API_HOST}/api/employeess/update` : 
        `${process.env.NEXT_PUBLIC_API_HOST}/api/auth/update`;
      await axios.put(endpoint, {
        phoneNumber,
        oldPassword,
        newPassword,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEditing(false);
      fetchUserInfo(); // Refresh user info
    } catch (error) {
      console.error("Error updating user info:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" color="warning" />
      </div>
    );
  }

  if (!userInfo) {
    return <div className="text-center p-8">User info not found.</div>;
  }

  return (
    <div className="account-settings p-8 bg-white min-h-screen flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4 text-black">Account Settings</h1>
      <Card className="w-full md:w-1/2 p-4">
        <CardHeader><h2>Account Information</h2></CardHeader>
        <CardBody>
          <div className="mb-4">
            <p><strong>Full Name:</strong> {userInfo.fullName}</p>
            <p><strong>Email:</strong> {isEmployee ? userInfo.email : userInfo.businessMail}</p>
            {isEmployee ? null : (
              <>
                <p><strong>Company Name:</strong> {userInfo.companyName}</p>
                <p><strong>Company Size:</strong> {userInfo.companySize}</p>
              </>
            )}
            <p><strong>Phone Number:</strong></p>
            {editing ? (
              <Input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="border border-gray-300 p-2 rounded w-full"
              />
            ) : (
              <p>{userInfo.phoneNumber}</p>
            )}
          </div>
          {editing && (
            <>
              <div className="mb-4">
                <Input
                  type="password"
                  placeholder="Old Password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="border border-gray-300 p-2 rounded w-full"
                />
              </div>
              <div className="mb-4">
                <Input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border border-gray-300 p-2 rounded w-full"
                />
              </div>
            </>
          )}
        </CardBody>
        <CardFooter>
          {editing ? (
            <>
              <Button onClick={handleSave} className="bg-green-500 text-white mr-4">
                Save
              </Button>
              <Button onClick={() => setEditing(false)} className="bg-red-500 text-white">
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)} className="bg-orange-500 text-white">
              Edit
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AccountSettings;
