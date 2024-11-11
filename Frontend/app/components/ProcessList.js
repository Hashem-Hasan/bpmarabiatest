import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Spinner } from "@nextui-org/react";
import Modal from './Modal';
import {
  FaEdit,
  FaTrashAlt,
  FaLock,
  FaUnlock,
  FaChevronDown,
  FaChevronUp,
  FaEye,
  FaPlus, // Import FaPlus
} from 'react-icons/fa';
import { AiOutlineClear } from "react-icons/ai";


const ProcessList = ({ 
  onDiagramSelect,
  mainUserToken,
  employeeToken,
  createNewDiagram,    // Accept the function
  clearSelection,       // Accept the function
  selectedDiagram,      // Accept the state
  isDiagramLoaded        }) => {
  const [diagrams, setDiagrams] = useState([]);
  const [filteredDiagrams, setFilteredDiagrams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [expandedDepartments, setExpandedDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingDiagrams, setFetchingDiagrams] = useState(false);
  const [loadingVerification, setLoadingVerification] = useState(null);
  const isFetching = useRef(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [diagramToDelete, setDiagramToDelete] = useState(null);

  useEffect(() => {
    if (mainUserToken || employeeToken) {
      fetchDiagrams(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, mainUserToken, employeeToken]);

  const fetchDiagrams = async (page) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setFetchingDiagrams(true);
    const token = mainUserToken || employeeToken;

    let endpoint;
    if (mainUserToken) {
      endpoint = `${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/all?page=${page}&limit=5`;
    } else {
      endpoint = `${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/owned?page=${page}&limit=5`;
    }

    try {
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.length > 0) {
        const newDiagrams = response.data.filter(
          (diagram) =>
            !diagrams.some((existingDiagram) => existingDiagram._id === diagram._id)
        );
        const updatedDiagrams = [...diagrams, ...newDiagrams];
        setDiagrams(updatedDiagrams);
        updateFilteredDiagrams(updatedDiagrams, searchTerm);

        if (newDiagrams.length < 5) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching diagrams:', err);
    } finally {
      isFetching.current = false;
      setFetchingDiagrams(false);
    }
  };

  const updateFilteredDiagrams = (diagramsToFilter, term) => {
    const filtered = term
      ? diagramsToFilter.filter((diagram) =>
          diagram.name.toLowerCase().includes(term.toLowerCase())
        )
      : diagramsToFilter;

    setFilteredDiagrams(filtered);

    // Group filtered diagrams by department
    const departmentMap = new Map();
    filtered.forEach((diagram) => {
      const departmentName = diagram.department?.name || 'No Department';
      if (!departmentMap.has(departmentName)) {
        departmentMap.set(departmentName, []);
      }
      departmentMap.get(departmentName).push(diagram);
    });
    setDepartments(Array.from(departmentMap.entries()));

    if (term) {
      // Expand all departments with matches
      setExpandedDepartments(Array.from(departmentMap.keys()));
    } else {
      // Collapse all departments
      setExpandedDepartments([]);
    }
  };

  const confirmDelete = (id) => {
    setDiagramToDelete(id);
    setIsConfirmOpen(true);
  };

  const deleteDiagram = async () => {
    const token = mainUserToken;
    setIsConfirmOpen(false);
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/${diagramToDelete}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const updatedDiagrams = diagrams.filter(
        (diagram) => diagram._id !== diagramToDelete
      );
      setDiagrams(updatedDiagrams);
      updateFilteredDiagrams(updatedDiagrams, searchTerm);

      if (updatedDiagrams.length === 0) {
        setHasMore(true);
        setPage(1);
        fetchDiagrams(1);
      }
    } catch (err) {
      console.error('Error deleting diagram:', err);
    }
  };

  const editDiagram = (diagram) => {
    if (diagram.isVerified) {
      alert(
        'This process is verified. You can view it, but edits will not be saved. Unverify it or contact your administrator to make changes.'
      );
    }
    if (onDiagramSelect) {
      onDiagramSelect(diagram);
    }
  };

  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    updateFilteredDiagrams(diagrams, term);
  };

  const toggleVerification = async (id, isVerified) => {
    const token = mainUserToken;
    setLoadingVerification(id);
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/toggle-verify/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update only the isVerified status in the local state
      setDiagrams((prevDiagrams) => {
        const updatedDiagrams = prevDiagrams.map((diagram) => {
          if (diagram._id === id) {
            return { ...diagram, isVerified: !isVerified };
          }
          return diagram;
        });

        updateFilteredDiagrams(updatedDiagrams, searchTerm);
        return updatedDiagrams;
      });
    } catch (err) {
      console.error('Error toggling verification:', err);
    } finally {
      setLoadingVerification(null);
    }
  };

  // Toggle expanded department with animation
  const toggleDepartment = (departmentName) => {
    if (expandedDepartments.includes(departmentName)) {
      setExpandedDepartments(expandedDepartments.filter((name) => name !== departmentName));
    } else {
      setExpandedDepartments([...expandedDepartments, departmentName]);
    }
  };

  return (
    <div className="w-full border-r-1 border-gray-300 items-center mx-auto h-full overflow-y-auto p-4">
      {/* Header with Processes title and buttons */}
      <div className="relative flex items-center justify-between w-full mb-2">
        <h2 className="text-xl text-[#14BAB6] font-bold">Processes</h2>
        <div className="flex items-center space-x-2">
          {(!selectedDiagram && !isDiagramLoaded) && (
            <button
              onClick={createNewDiagram}
              className="text-center text-xl text-[#14BAB6] py-2 px-4 rounded-md transition-all hover:bg-gray-200"
            >
              <FaPlus />
            </button>
          )}
          {(selectedDiagram || isDiagramLoaded) && (
            <button
              onClick={clearSelection}
              className="text-center text-xl text-black py-2 px-4 rounded-md transition-all hover:bg-gray-200"
            >
              <AiOutlineClear />
            </button>
          )}
        </div>
      </div>

      {/* Search input */}
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Search processes..."
        className="border border-gray-100 rounded-2xl mb-2 px-4 py-2 w-full"
      />

      {fetchingDiagrams && (
        <div className="flex justify-center items-center">
          <Spinner size="lg" color="warning" />
        </div>
      )}
      <ul className="space-y-4">
        {departments.map(([departmentName, diagrams]) => (
          <li key={departmentName}>
            <div className="flex justify-between items-center">
              <h3 className="text-md items-start font-semibold mb-2">
                {departmentName}
              </h3>
              <button
                className="text-gray-500"
                onClick={() => toggleDepartment(departmentName)}
              >
                {expandedDepartments.includes(departmentName) ? (
                  <FaChevronUp className="w-5 h-5" />
                ) : (
                  <FaChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>

            <motion.div
              initial={false}
              animate={{
                height: expandedDepartments.includes(departmentName)
                  ? 'auto'
                  : 0,
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {diagrams.map((diagram) => (
                <div
                  key={diagram._id}
                  className="flex justify-between items-center py-2 border-b-2 border-gray-200"
                >
                  {/* Left side: text */}
                  <div className="flex items-center text-left space-x-2 overflow-hidden">
                    <span
                      className="truncate text-sm w-24 sm:w-32 md:w-40 lg:w-48 xl:w-64"
                      title={diagram.name}
                    >
                      {diagram.name}
                    </span>
                  </div>
                  {/* Right side: icons */}
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 text-xs hidden sm:inline">
                      {diagram.version || 'V0'}
                    </span>
                    {diagram.isVerified ? (
                      <FaEye
                        onClick={() => editDiagram(diagram)}
                        className="text-blue-500 text-sm cursor-pointer"
                      />
                    ) : (
                      <FaEdit
                        onClick={() => editDiagram(diagram)}
                        className="text-blue-500 text-sm cursor-pointer"
                      />
                    )}
                    {mainUserToken && (
                      <>
                        <FaTrashAlt
                          onClick={() => confirmDelete(diagram._id)}
                          className="text-red-500 text-sm cursor-pointer"
                        />
                        {loadingVerification === diagram._id ? (
                          <Spinner size="sm" color="warning" />
                        ) : diagram.isVerified ? (
                          <FaLock
                            onClick={() =>
                              toggleVerification(diagram._id, diagram.isVerified)
                            }
                            className="text-yellow-500 text-sm cursor-pointer"
                          />
                        ) : (
                          <FaUnlock
                            onClick={() =>
                              toggleVerification(diagram._id, diagram.isVerified)
                            }
                            className="text-green-500 text-sm cursor-pointer"
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          </li>
        ))}
      </ul>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Confirm Deletion"
        onConfirm={deleteDiagram}
      >
        Are you sure you want to delete this process?
      </Modal>
    </div>
  );
};

export default ProcessList;
