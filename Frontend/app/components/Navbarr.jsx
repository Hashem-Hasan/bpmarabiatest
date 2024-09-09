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

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMainUser, setIsMainUser] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path) => pathname === path;

  const menuItems = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "https://bpmarabia.com/" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const employeeToken = localStorage.getItem("employeeToken");

    if (token) {
      console.log("Main token found in localStorage:", token);
      fetchUserInfo(token);
      setIsMainUser(true);
    } else if (employeeToken) {
      console.log("Employee token found in localStorage:", employeeToken);
      fetchEmployeeInfo(employeeToken);
      setIsMainUser(false);
    } else {
      setLoading(false);
    }

    const intervalId = setInterval(() => {
      checkTokenValidity();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchUserInfo = async (token) => {
    try {
      const decoded = parseJwt(token);
      console.log("Decoded main token:", decoded);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        if (decoded.fullName) {
          console.log("Setting logged in main user:", decoded.fullName);
          setLoggedInUser(decoded.fullName);
        } else {
          console.error("fullName is not present in the decoded main token.");
        }
      } else {
        console.log("Main token expired");
        logout("token");
      }
    } catch (error) {
      console.error("Failed to fetch main user info:", error);
      logout("token");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeInfo = async (token) => {
    try {
      const decoded = parseJwt(token);
      console.log("Decoded employee token:", decoded);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_HOST}/api/employeess/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLoggedInUser(response.data.fullName);
      } else {
        console.log("Employee token expired");
        logout("employeeToken");
      }
    } catch (error) {
      console.error("Failed to fetch employee info:", error);
      logout("employeeToken");
    } finally {
      setLoading(false);
    }
  };

  const checkTokenValidity = () => {
    const token = localStorage.getItem("token");
    const employeeToken = localStorage.getItem("employeeToken");

    if (token) {
      try {
        const decoded = parseJwt(token);
        if (!decoded || decoded.exp * 1000 < Date.now()) {
          console.log("Main token expired during check");
          logout("token");
        }
      } catch (error) {
        console.error("Failed to parse main token:", error);
        logout("token");
      }
    }

    if (employeeToken) {
      try {
        const decoded = parseJwt(employeeToken);
        console.log("Employee token before checking validity:", employeeToken); // Log the employee token before checking its validity
        if (!decoded || decoded.exp * 1000 < Date.now()) {
          console.log("Employee token expired during check");
          logout("employeeToken");
        }
      } catch (error) {
        console.error("Failed to parse employee token:", error);
        logout("employeeToken");
      }
    }
  };

  const logout = (tokenType) => {
    console.log(`Logging out, clearing ${tokenType}`);
    localStorage.removeItem(tokenType);
    if (tokenType === "token") {
      localStorage.removeItem("employeeToken"); // Clear employee token only when logging out main user
    }
    setLoggedInUser(null);
    router.push("/login");
  };

  return (
    <Navbar onMenuOpenChange={setIsMenuOpen} className="bg-white text-black">
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden text-black"
        />
        <NavbarBrand color="foreground" href="/">
          <p className="font-bold text-black">BPMN Arabia</p>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {loading ? (
          <Spinner size="lg" color="warning" />
        ) : (
          <>
            {menuItems.map((item) => (
              <NavbarItem key={item.path} isActive={isActive(item.path)}>
                <Link
                  color="foreground"
                  href={item.path}
                  className={`text-black ${isActive(item.path) ? "font-bold text-orange-500" : ""}`}
                >
                  {item.name}
                </Link>
              </NavbarItem>
            ))}
            {loggedInUser && (
              <NavbarItem isActive={isActive("/tool")}>
                <Link
                  color="foreground"
                  href="/Tool"
                  className={`text-black ${isActive("/Tool") ? "font-bold text-orange-500" : ""}`}
                >
                  Process Builder
                </Link>
              </NavbarItem>
            )}
            {loggedInUser && isMainUser && (
              <NavbarItem isActive={isActive("/Dashboard")}>
                <Link
                  color="foreground"
                  href="/Dashboard"
                  className={`text-black ${isActive("/dashboard") ? "font-bold text-orange-500" : ""}`}
                >
                  Dashboard
                </Link>
              </NavbarItem>
            )}
          </>
        )}
      </NavbarContent>

      <NavbarContent justify="end" className="flex items-center">
        {loading ? (
          <Spinner size="lg" color="warning" />
        ) : loggedInUser ? (
          <Dropdown>
            <DropdownTrigger>
              <Button auto flat>
                Hello, {loggedInUser}
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem key="settings">
                <Link href="/account-settings" className="text-black">
                  Account Settings
                </Link>
              </DropdownItem>
              <DropdownItem key="logout" color="danger" onClick={() => logout("token")}>
                <h1 className="text-red-400 text-md font-bold">Logout</h1>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <>
            <NavbarItem>
              <Link href="/login" className={`text-primary ${pathname === "/login" ? "font-bold text-orange-500" : ""}`}>
                Login
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Button as={Link} color="warning" href="/ELogin" variant="flat" className={`text-primary ${pathname === "/ELogin" ? "font-bold text-orange-500" : ""}`}>
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
              className={`w-full text-black ${isActive(item.path) ? "font-bold text-orange-500" : ""}`}
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
              className={`w-full text-black ${isActive("/Tool") ? "font-bold text-orange-500" : ""}`}
              size="lg"
            >
              Process Builder
            </Link>
          </NavbarMenuItem>
        )}
        {loggedInUser && isMainUser && (
          <NavbarMenuItem key="/Dashboard">
            <Link
              color="foreground"
              href="/dashboard"
              className={`w-full text-black ${isActive("/dashboard") ? "font-bold text-orange-500" : ""}`}
              size="lg"
            >
              Dashboard
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
          return '%' + ('00' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse token:', error);
    return null;
  }
}
