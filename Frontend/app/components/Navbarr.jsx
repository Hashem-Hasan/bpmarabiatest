// pages/account-settings.js
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
import axios from "axios";
import Image from "next/image";

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMainUser, setIsMainUser] = useState(false);
  const [userData, setUserData] = useState(null);

  const pathname = usePathname();
  const router = useRouter();
  const menuItems = [];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const employeeToken = localStorage.getItem("employeeToken");

    if (token) {
      setIsMainUser(true);
      fetchMainUserData(token);
    } else if (employeeToken) {
      setIsMainUser(false);
      fetchEmployeeData(employeeToken);
    } else {
      setLoading(false);
      setIsMainUser(false);
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
        setIsMainUser(true);
        fetchMainUserData(token);
      } else if (employeeToken) {
        setIsMainUser(false);
        fetchEmployeeData(employeeToken);
      } else {
        setLoggedInUser(null);
        setIsMainUser(false);
      }
    };
    handleRouteChange();
  }, [router, pathname]);

  const fetchMainUserData = async (token) => {
    try {
      const decoded = parseJwt(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_HOST}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLoggedInUser(response.data.fullName);
        setUserData(response.data);
      } else {
        logout("token");
      }
    } catch (error) {
      console.error("Error fetching main user info:", error);
      logout("token");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeData = async (token) => {
    try {
      const decoded = parseJwt(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_HOST}/api/employeess/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLoggedInUser(response.data.fullName);
        setUserData(response.data);
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
    setIsMainUser(false);
    setUserData(null);
    router.push("/");
  };

  const isAdmin = isMainUser;
  const isEmployee = !isMainUser && loggedInUser;

  const isActive = (path) => pathname === path;

  const companyLogoUrl = (() => {
    if (!userData) return null;
    return isMainUser ? userData.logo : userData.company?.logo;
  })();

  return (
    <Navbar onMenuOpenChange={setIsMenuOpen} className="bg-white overflow-hidden fixed shadow-sm text-black w-full z-50">
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden text-black"
        />
        <NavbarBrand color="foreground" href="/">
          <Link href="https://bpmarabia.com/">
            <Image src="/LLOGO.png" alt="BPM Arabia Logo" width={170} height={100} />
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
        ) : (
          <>
            {companyLogoUrl && (
              <Image
                src={companyLogoUrl}
                alt="Company Logo"
                width={80}
                height={40}
                className="object-contain mr-4"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/fallback-logo.png";
                }}
              />
            )}
            {loggedInUser ? (
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
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to parse token:", error);
    return null;
  }
}
