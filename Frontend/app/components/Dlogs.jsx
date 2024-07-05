"use client";
import React, { useState, useEffect } from "react";
import { Spinner } from "@nextui-org/react";
import axios from "axios";

const DiagramLogs = () => {
  const [diagrams, setDiagrams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiagrams();
  }, []);

  const fetchDiagrams = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDiagrams(response.data);
    } catch (error) {
      console.error("Error fetching diagrams:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" color="warning" />
      </div>
    );
  }

  return (
    <div className="diagram-logs p-8 bg-white rounded-lg shadow-lg min-h-screen flex flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold mb-4 text-black w-full">Diagram Logs</h1>
      <div className="logs-list w-full">
        {diagrams.map((diagram) => (
          <div key={diagram._id} className="bg-orange-200 rounded-xl shadow-md p-4 mb-4 text-black w-full">
            <p className="text-lg font-bold">{diagram.name}</p>
            <p>Logs:</p>
            <ul>
              {diagram.logs.map((log, index) => (
                <li key={index} className="mb-2">
                  <p><strong>Action:</strong> {log.action}</p>
                  <p><strong>User ID:</strong> {log.userId}</p>
                  <p><strong>Email:</strong> {log.userEmail}</p>
                  <p><strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiagramLogs;
