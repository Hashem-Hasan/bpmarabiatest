"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Spinner } from "@nextui-org/react";
import { motion } from "framer-motion"; // For animations
import { FaSearch, FaChevronDown, FaChevronUp } from "react-icons/fa"; // For icons
import moment from "moment"; // For date formatting

const DiagramLogs = () => {
  const [diagrams, setDiagrams] = useState([]);
  const [filteredDiagrams, setFilteredDiagrams] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDiagramIds, setExpandedDiagramIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 5; // Number of logs per page

  useEffect(() => {
    fetchDiagrams();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [diagrams, searchTerm]);

  const fetchDiagrams = async () => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
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

  const handleSearch = () => {
    const filtered = diagrams.filter((diagram) =>
      diagram.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDiagrams(filtered);
  };

  const toggleExpand = (diagramId) => {
    if (expandedDiagramIds.includes(diagramId)) {
      setExpandedDiagramIds(expandedDiagramIds.filter((id) => id !== diagramId));
    } else {
      setExpandedDiagramIds([...expandedDiagramIds, diagramId]);
    }
  };

  const formatDate = (date) => {
    return moment(date).format("MMMM Do YYYY, h:mm:ss a");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="diagram-logs p-8 bg-white space-y-8 shadow-lg min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-4xl font-bold text-black">Diagram Logs</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search Diagrams"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 p-2 rounded w-full text-black pl-10"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {/* Diagrams and Logs */}
      <div className="space-y-4">
        {filteredDiagrams.length > 0 ? (
          filteredDiagrams.map((diagram) => (
            <motion.div
              key={diagram._id}
              className="bg-gray-100 rounded-lg shadow-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Diagram Header */}
              <div
                className="flex justify-between items-center p-4 cursor-pointer"
                onClick={() => toggleExpand(diagram._id)}
              >
                <h2 className="text-xl font-bold text-black">{diagram.name}</h2>
                {expandedDiagramIds.includes(diagram._id) ? (
                  <FaChevronUp className="text-gray-500" />
                ) : (
                  <FaChevronDown className="text-gray-500" />
                )}
              </div>
              {/* Logs */}
              {expandedDiagramIds.includes(diagram._id) && (
                <div className="px-4 pb-4">
                  {diagram.logs && diagram.logs.length > 0 ? (
                    <div className="space-y-2">
                      {diagram.logs
                        .slice(
                          (currentPage - 1) * logsPerPage,
                          currentPage * logsPerPage
                        )
                        .map((log, index) => (
                          <motion.div
                            key={index}
                            className="bg-white p-4 rounded-lg shadow-sm"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <div className="flex justify-between items-center">
                              <p className="text-black">
                                <span className="font-semibold">Action:</span>{" "}
                                {log.action}
                              </p>
                            </div>
                            <p className="text-sm text-gray-500">
                              <span className="font-semibold">Timestamp:</span>{" "}
                              {formatDate(log.timestamp)}
                            </p>
                            <p className="text-black">
                              <span className="font-semibold">User ID:</span>{" "}
                              {log.userId || "N/A"}
                            </p>
                            <p className="text-black">
                              <span className="font-semibold">User Email:</span>{" "}
                              {log.userEmail || "N/A"}
                            </p>
                          </motion.div>
                        ))}
                      {/* Pagination */}
                      {diagram.logs.length > logsPerPage && (
                        <div className="flex justify-center mt-4">
                          <nav>
                            <ul className="flex list-none">
                              {[...Array(Math.ceil(diagram.logs.length / logsPerPage))].map(
                                (_, index) => (
                                  <li key={index}>
                                    <button
                                      onClick={() => setCurrentPage(index + 1)}
                                      className={`mx-1 px-3 py-1 rounded ${
                                        currentPage === index + 1
                                          ? "bg-[#1C997F] text-white"
                                          : "bg-gray-200 text-black"
                                      }`}
                                    >
                                      {index + 1}
                                    </button>
                                  </li>
                                )
                              )}
                            </ul>
                          </nav>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">No logs available.</p>
                  )}
                </div>
              )}
            </motion.div>
          ))
        ) : (
          <p className="text-gray-500">No diagrams found.</p>
        )}
      </div>
    </div>
  );
};

export default DiagramLogs;
