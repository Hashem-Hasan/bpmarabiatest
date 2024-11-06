"use client";
import React, { useState, useEffect } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Link,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
} from "@nextui-org/react";
import { usePathname, useRouter } from "next/navigation";
import axios from 'axios';
import Image from "next/image";

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMainUser, setIsMainUser] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path) => pathname === path;

  const menuItems = [
    // Add static menu items here if any
    // Example:
    // { name: "Home", path: "/" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const employeeToken = localStorage.getItem("employeeToken");

    if (token) {
      fetchUserInfo(token);
      setIsMainUser(true);
    } else if (employeeToken) {
      fetchEmployeeInfo(employeeToken);
      setIsMainUser(false);
    } else {
      setLoading(false);
      setIsMainUser(false); // Add this line
    }

    const intervalId = setInterval(() => {
      checkTokenValidity();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      const token = localStorage.getItem("token");
      const employeeToken = localStorage.getItem("employeeToken");

      if (token) {
        fetchUserInfo(token);
        setIsMainUser(true);
      } else if (employeeToken) {
        fetchEmployeeInfo(employeeToken);
        setIsMainUser(false);
      } else {
        setLoggedInUser(null);
        setIsMainUser(false); // Add this line
      }
    };

    // This will re-run the effect when pathname changes
    handleRouteChange();
  }, [router, pathname]);

  const fetchUserInfo = async (token) => {
    try {
      const decoded = parseJwt(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        if (decoded.fullName) {
          setLoggedInUser(decoded.fullName);
        }
      } else {
        logout("token");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      logout("token");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeInfo = async (token) => {
    try {
      const decoded = parseJwt(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_HOST}/api/employeess/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLoggedInUser(response.data.fullName);
      } else {
        logout("employeeToken");
      }
    } catch (error) {
      console.error("Error fetching employee info:", error);
      logout("employeeToken");
    } finally {
      setLoading(false);
    }
  };

  const checkTokenValidity = () => {
    const token = localStorage.getItem("token");
    const employeeToken = localStorage.getItem("employeeToken");

    if (token) {
      const decoded = parseJwt(token);
      if (!decoded || decoded.exp * 1000 < Date.now()) {
        logout("token");
      }
    }

    if (employeeToken) {
      const decoded = parseJwt(employeeToken);
      if (!decoded || decoded.exp * 1000 < Date.now()) {
        logout("employeeToken");
      }
    }
  };

  const logout = (tokenType) => {
    localStorage.removeItem(tokenType);
    if (tokenType === "token") {
      localStorage.removeItem("employeeToken");
    }
    setLoggedInUser(null);
    setIsMainUser(false); // Add this line
    router.push("/");
  };

  // Function to determine if the user is an admin
  const isAdmin = isMainUser;

  // Function to determine if the user is an employee
  const isEmployee = !isMainUser && loggedInUser;

  return (
    <Navbar onMenuOpenChange={setIsMenuOpen} className="bg-white fixed shadow-sm text-black">
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden text-black"
        />
        <NavbarBrand color="foreground" href="/">
          <Link href="https://bpmarabia.com/">
            <Image src="/LLOGO.png" alt="BPMN Arabia Logo" width={170} height={100} />
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {loading ? (
          <Spinner size="lg" color="primary" />
        ) : (
          <>
            {menuItems.map((item) => (
              <NavbarItem key={item.path} isActive={isActive(item.path)}>
                <Link
                  color="foreground"
                  href={item.path}
                  className={`text-black ${isActive(item.path) ? "font-bold text-[#14BAB6]" : ""}`}
                >
                  {item.name}
                </Link>
              </NavbarItem>
            ))}

            {loggedInUser && (
              <NavbarItem isActive={isActive("/Tool")}>
                <Link
                  color="foreground"
                  href="/Tool"
                  className={`text-black ${isActive("/Tool") ? "font-bold text-[#14BAB6]" : ""}`}
                >
                  Process Builder
                </Link>
              </NavbarItem>
            )}

            {isAdmin && (
              <NavbarItem isActive={isActive("/Dashboard")}>
                <Link
                  color="foreground"
                  href="/Dashboard"
                  className={`text-black ${isActive("/Dashboard") ? "font-bold text-[#14BAB6]" : ""}`}
                >
                  Dashboard
                </Link>
              </NavbarItem>
            )}

            {isEmployee && (
              <NavbarItem isActive={isActive("/employee-dashboard")}>
                <Link
                  color="foreground"
                  href="/employee-dashboard"
                  className={`text-black ${isActive("/employee-dashboard") ? "font-bold text-[#14BAB6]" : ""}`}
                >
                  Employee Dashboard
                </Link>
              </NavbarItem>
            )}
          </>
        )}
      </NavbarContent>

      <NavbarContent justify="end" className="flex items-center">
        {loading ? (
          <Spinner size="lg" color="primary" />
        ) : loggedInUser ? (
          <Dropdown>
            <DropdownTrigger>
              <Button auto flat color="primary" className="text-white">
                Hello, {loggedInUser}
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem key="settings">
                <Link href="/account-settings" className="text-black">
                  Account Settings
                </Link>
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                onClick={() => logout(isAdmin ? "token" : "employeeToken")}
              >
                <h1 className="text-red-400 text-md font-bold">Logout</h1>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <>
            <NavbarItem>
              <Link href="/" className={`text-primary ${isActive("/") ? "font-bold text-[#14BAB6]" : ""}`}>
                Admin Login
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Button
                as={Link}
                color="primary"
                href="/ELogin"
                variant="flat"
                className={`text-primary ${isActive("/ELogin") ? "font-bold text-[#14BAB6]" : ""}`}
              >
                Employees Login
              </Button>
            </NavbarItem>
          </>
        )}
      </NavbarContent>

      <NavbarMenu>
        {menuItems.map((item) => (
          <NavbarMenuItem key={item.path}>
            <Link
              color="foreground"
              href={item.path}
              className={`w-full text-black ${isActive(item.path) ? "font-bold text-[#14BAB6]" : ""}`}
              size="lg"
            >
              {item.name}
            </Link>
          </NavbarMenuItem>
        ))}

        {loggedInUser && (
          <NavbarMenuItem key="/Tool">
            <Link
              color="foreground"
              href="/Tool"
              className={`w-full text-black ${isActive("/Tool") ? "font-bold text-[#14BAB6]" : ""}`}
              size="lg"
            >
              Process Builder
            </Link>
          </NavbarMenuItem>
        )}

        {isAdmin && (
          <NavbarMenuItem key="/Dashboard">
            <Link
              color="foreground"
              href="/Dashboard"
              className={`w-full text-black ${isActive("/Dashboard") ? "font-bold text-[#14BAB6]" : ""}`}
              size="lg"
            >
              Dashboard
            </Link>
          </NavbarMenuItem>
        )}

        {isEmployee && (
          <NavbarMenuItem key="/employee-dashboard">
            <Link
              color="foreground"
              href="/employee-dashboard"
              className={`w-full text-black ${isActive("/employee-dashboard") ? "font-bold text-[#14BAB6]" : ""}`}
              size="lg"
            >
              Employee Dashboard
            </Link>
          </NavbarMenuItem>
        )}
      </NavbarMenu>
    </Navbar>
  );
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse token:', error);
    return null;
  }
}
