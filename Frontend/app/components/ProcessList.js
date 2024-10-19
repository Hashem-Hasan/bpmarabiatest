import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion'; // Import framer-motion
import { Spinner } from "@nextui-org/react";
import Modal from './Modal';
import {
  FaEdit,
  FaTrashAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';

const ProcessList = ({ onDiagramSelect, mainUserToken, employeeToken }) => {
  const [diagrams, setDiagrams] = useState([]);
  const [filteredDiagrams, setFilteredDiagrams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [expandedDepartments, setExpandedDepartments] = useState([]); // Changed from single value to array
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
        // Update filteredDiagrams and departments based on updatedDiagrams
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
        'This Process is verified. Unverify it or contact your administrator to unverify it, or your edits will not be saved!'
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
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/toggle-verify/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const updatedDiagram = response.data;

      setDiagrams((prevDiagrams) => {
        const index = prevDiagrams.findIndex(
          (diagram) => diagram._id === updatedDiagram._id
        );
        if (index !== -1) {
          const updatedDiagrams = [...prevDiagrams];
          updatedDiagrams[index] = updatedDiagram;
          return updatedDiagrams;
        }
        return prevDiagrams;
      });

      updateFilteredDiagrams(
        diagrams.map((diagram) =>
          diagram._id === updatedDiagram._id ? updatedDiagram : diagram
        ),
        searchTerm
      );
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
    <div className='shadow-md w-full border-1 border-gray-300 items-center mx-auto rounded-lg h-[500px] overflow-y-auto p-4'>
      <div className='relative flex flex-col items-start w-full'>
        <h2 className='text-xl mb-2 text-[#1C997F] font-bold'>Processes</h2>

        <input
          type='text'
          value={searchTerm}
          onChange={handleSearch}
          placeholder='Search processes...'
          className='border border-gray-100 rounded-2xl mb-2 px-4 py-2 w-full'
        />
      </div>
      {fetchingDiagrams && (
        <div className='flex justify-center items-center'>
          <Spinner size='lg' color='warning' />
        </div>
      )}
      <ul className='space-y-4'>
        {departments.map(([departmentName, diagrams]) => (
          <li key={departmentName}>
            <div className='flex justify-between items-center'>
              <h3 className='text-md items-start font-semibold mb-2'>{departmentName}</h3>
              <button
                className='text-gray-500'
                onClick={() => toggleDepartment(departmentName)}
              >
                {expandedDepartments.includes(departmentName) ? (
                  <FaChevronUp className='w-5 h-5' />
                ) : (
                  <FaChevronDown className='w-5 h-5' />
                )}
              </button>
            </div>

            <motion.div
              initial={false}
              animate={{
                height: expandedDepartments.includes(departmentName) ? 'auto' : 0,
              }}
              transition={{ duration: 0.3 }}
              className='overflow-hidden'
            >
              {diagrams.map((diagram) => (
                <div
                  key={diagram._id}
                  className='flex justify-between p-2 border-b-2 border-gray-200  '
                >
                  <div className='flex items-center space-x-4'>
                    <span className=''>{diagram.name}</span>
                    <FaEdit
                      onClick={() => editDiagram(diagram)}
                      className='text-blue-500 cursor-pointer'
                    />
                    {mainUserToken && (
                      <>
                        <FaTrashAlt
                          onClick={() => confirmDelete(diagram._id)}
                          className='text-red-500 cursor-pointer'
                        />
                        {loadingVerification === diagram._id ? (
                          <Spinner size='sm' color='warning' />
                        ) : diagram.isVerified ? (
                          <FaTimesCircle
                            onClick={() =>
                              toggleVerification(diagram._id, diagram.isVerified)
                            }
                            className='text-yellow-500 cursor-pointer'
                          />
                        ) : (
                          <FaCheckCircle
                            onClick={() =>
                              toggleVerification(diagram._id, diagram.isVerified)
                            }
                            className='text-green-500 cursor-pointer'
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
        title='Confirm Deletion'
        onConfirm={deleteDiagram}
      >
        Are you sure you want to delete this process?
      </Modal>
    </div>
  );
};

export default ProcessList;
