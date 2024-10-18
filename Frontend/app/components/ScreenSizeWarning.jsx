"use client";
import { useState, useEffect } from "react";
import { isMobile } from "react-device-detect";

const ScreenSizeWarning = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Ensure the component only runs on the client
    setHasMounted(true);

    const disableScroll = () => {
      // Disable scrolling by adding specific styles for both X and Y axes
      document.body.style.overflow = "hidden"; // Prevent vertical and horizontal scroll
      document.body.style.position = "fixed"; // Disable positioning changes
      document.body.style.width = "100vw"; // Fix the width to viewport size
      document.body.style.height = "100vh"; // Fix the height to viewport size
      document.body.style.pointerEvents = "none"; // Disable interactions
    };

    const enableScroll = () => {
      document.body.style.overflow = "auto"; // Enable scrolling back
      document.body.style.position = "static"; // Reset positioning
      document.body.style.width = "auto"; // Reset width
      document.body.style.height = "auto"; // Reset height
      document.body.style.pointerEvents = "auto"; // Enable interactions back
    };

    if (isMobile || window.innerWidth < 1024) {
      setShowWarning(true);
      disableScroll(); // Disable scroll and interactions on small screens
    } else {
      enableScroll(); // Allow scrolling and interactions on larger screens
    }

    // Cleanup on component unmount
    return () => {
      enableScroll(); // Reset styles on cleanup
    };
  }, []);

  if (!hasMounted) {
    return null; // Prevent rendering on the server
  }

  if (!showWarning) {
    return null; // Don't render the warning if it's not a mobile device
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 1)", // Dark background
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "auto", // Allow interactions within the modal
      }}
      className="text-black opacity-100"
    >
      <div
        style={{
          backgroundColor: "#ffffff", // White background for modal
          padding: "2rem",
          borderRadius: "0.5rem",
          textAlign: "center",
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.5)",
          maxWidth: "90%", // Ensure it fits within smaller screens
          zIndex: 10000, // Ensure modal is above everything
        }}
      >
        <img src="/LLogo.png" alt="Logo" style={{ width: "100px", marginBottom: "1rem" }} />
        <h2 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>Please Use Desktop View</h2>
        <p style={{ fontSize: "1.2rem" }}>
          This application is best viewed on a desktop. Please switch to a larger screen for an optimal experience.
        </p>
      </div>
    </div>
  );
};

export default ScreenSizeWarning;
