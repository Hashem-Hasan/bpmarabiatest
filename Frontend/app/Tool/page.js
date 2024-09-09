'use client';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import BpmnEditor from '../components/BpmnEditor';
import { Button, Input, Spinner } from "@nextui-org/react";
import Modal from '../components/Modal';
import { FaEdit, FaTrashAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'; // Import icons

const Home = () => {
  const [diagrams, setDiagrams] = useState([]);
  const [filteredDiagrams, setFilteredDiagrams] = useState([]);
  const [selectedDiagram, setSelectedDiagram] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingDiagrams, setFetchingDiagrams] = useState(false);
  const [editorKey, setEditorKey] = useState(Date.now());
  const [loadingVerification, setLoadingVerification] = useState(null); 
  const observer = useRef();
  const isFetching = useRef(false);

  const [mainUserToken, setMainUserToken] = useState(null);
  const [employeeToken, setEmployeeToken] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [diagramToDelete, setDiagramToDelete] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMainUserToken(localStorage.getItem("token"));
      setEmployeeToken(localStorage.getItem("employeeToken"));
    }
  }, []);

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
        const newDiagrams = response.data.filter(diagram => 
          !diagrams.some(existingDiagram => existingDiagram._id === diagram._id)
        );
        setDiagrams(prevDiagrams => [...prevDiagrams, ...newDiagrams]);
        setFilteredDiagrams(prevDiagrams => [...prevDiagrams, ...newDiagrams]);
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

  const saveDiagram = async ({ id, name, xml, department }) => {
    const token = mainUserToken || employeeToken;
    setLoading(true);
    try {
      let response;
      if (id) {
        response = await axios.put(`${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/${id}`, 
          { name, xml, department },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        response = await axios.post(`${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes`, 
          { name, xml, department },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      alert('Diagram saved successfully!');
      const savedDiagram = response.data;
  
      setDiagrams(prevDiagrams => {
        const index = prevDiagrams.findIndex(diagram => diagram._id === savedDiagram._id);
        if (index === -1) {
          return [savedDiagram, ...prevDiagrams];
        } else {
          const updatedDiagrams = [...prevDiagrams];
          updatedDiagrams[index] = savedDiagram;
          return updatedDiagrams;
        }
      });
      setFilteredDiagrams(prevDiagrams => {
        const index = prevDiagrams.findIndex(diagram => diagram._id === savedDiagram._id);
        if (index === -1) {
          return [savedDiagram, ...prevDiagrams];
        } else {
          const updatedDiagrams = [...prevDiagrams];
          updatedDiagrams[index] = savedDiagram;
          return updatedDiagrams;
        }
      });
      setSelectedDiagram(null);
      setEditorKey(Date.now());
      return true; // Return true indicating success
    } catch (err) {
      console.error('Error saving diagram:', err);
      
      // Check if the error response is 403
      if (err.response && err.response.status === 403) {
        alert(err.response.data.message || 'You do not have permission to perform this action.');
      } else {
        alert('An error occurred while saving the diagram. Please try again.');
      }
      return false; // Return false indicating failure
    } finally {
      setLoading(false);
    }
  };
  
  const handleClearSelection = () => {
    setSelectedDiagram(null); // Clear the selected diagram
    setEditorKey(Date.now()); // Reset the editor key to force re-render of the editor
  };

  const confirmDelete = (id) => {
    setDiagramToDelete(id);
    setIsConfirmOpen(true);
  };

  const deleteDiagram = async () => {
    const token = mainUserToken;
    setIsConfirmOpen(false);
    setLoading(true);
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/${diagramToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedDiagrams = diagrams.filter(diagram => diagram._id !== diagramToDelete);
      setDiagrams(updatedDiagrams);
      setFilteredDiagrams(updatedDiagrams);
      setSelectedDiagram(null);
      if (updatedDiagrams.length === 0) {
        setHasMore(true);
        setPage(1);
        fetchDiagrams(1);
      }
    } catch (err) {
      console.error('Error deleting diagram:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetDiagrams = () => {
    setDiagrams([]);
    setFilteredDiagrams([]);
    setPage(1);
    setHasMore(true);
    isFetching.current = false;
    fetchDiagrams(1);
  };

  const editDiagram = (diagram) => {
    // Check if the diagram is verified
    if (diagram.isVerified) {
      alert('This Process is verified. Unverify it or contact your administrator to unverify it, or your edits will not be saved!');
    }
    setSelectedDiagram(diagram);
  };

  const handleSearch = (event) => {
    const searchTerm = event.target.value;
    setSearchTerm(searchTerm);
    if (searchTerm === '') {
      setFilteredDiagrams(diagrams);
    } else {
      setFilteredDiagrams(diagrams.filter(diagram => 
        diagram.name.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    }
  };

  const toggleVerification = async (id, isVerified) => {
    const token = mainUserToken;
    setLoadingVerification(id);
    try {
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/toggle-verify/${id}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedDiagram = response.data;

      setDiagrams(prevDiagrams => {
        const index = prevDiagrams.findIndex(diagram => diagram._id === updatedDiagram._id);
        if (index !== -1) {
          const updatedDiagrams = [...prevDiagrams];
          updatedDiagrams[index] = updatedDiagram;
          return updatedDiagrams;
        }
        return prevDiagrams;
      });

      setFilteredDiagrams(prevDiagrams => {
        const index = prevDiagrams.findIndex(diagram => diagram._id === updatedDiagram._id);
        if (index !== -1) {
          const updatedDiagrams = [...prevDiagrams];
          updatedDiagrams[index] = updatedDiagram;
          return updatedDiagrams;
        }
        return prevDiagrams;
      });
    } catch (err) {
      console.error('Error toggling verification:', err);
    } finally {
      setLoadingVerification(null);
    }
  };

  const lastDiagramElementRef = (node) => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isFetching.current) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  };

  return (
    <div className='bg-white min-h-screen text-center h-auto justify-center text-black'>
      <h1 className='font-bold text-3xl py-4'>Process Editor</h1>
      <BpmnEditor key={editorKey} onSave={saveDiagram} onClear={handleClearSelection} diagramToEdit={selectedDiagram} />
      <h2 className='mt-4'>Saved Diagrams</h2>
      <input 
        type='text' 
        value={searchTerm} 
        onChange={handleSearch} 
        placeholder='Search diagrams...' 
        className='my-2 p-2 border border-gray-300 rounded'
      />
      <div className='border border-gray-300 w-1/2 items-center mx-auto rounded max-h-64 overflow-y-auto p-2'>
        {fetchingDiagrams && (
          <div className="flex justify-center items-center">
            <Spinner size="lg" color="warning" />
          </div>
        )}
        <ul className=''>
          {filteredDiagrams.map((diagram, index) => {
            if (filteredDiagrams.length === index + 1) {
              return (
                <li ref={lastDiagramElementRef} key={diagram._id} className='flex justify-between p-2'>
                  {diagram.name} (Version: {diagram.version}) ({diagram.isVerified ? 'Verified' : 'Not Verified'})
                  <div className="flex flex-row space-x-4"> {/* Align icons in a row */}
                    <FaEdit onClick={() => editDiagram(diagram)} className="text-blue-500 cursor-pointer" />
                    {mainUserToken && (
                      <>
                        <FaTrashAlt onClick={() => confirmDelete(diagram._id)} className="text-red-500 cursor-pointer" />
                        {loadingVerification === diagram._id ? (
                          <Spinner size="sm" color="warning" />
                        ) : (
                          diagram.isVerified ? 
                          <FaTimesCircle onClick={() => toggleVerification(diagram._id, diagram.isVerified)} className="text-yellow-500 cursor-pointer" /> :
                          <FaCheckCircle onClick={() => toggleVerification(diagram._id, diagram.isVerified)} className="text-green-500 cursor-pointer" />
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            } else {
              return (
                <li key={diagram._id} className='flex justify-between p-2'>
                  {diagram.name} (Version: {diagram.version}) ({diagram.isVerified ? 'Verified' : 'Not Verified'})
                  <div className="flex flex-row space-x-4"> {/* Align icons in a row */}
                    <FaEdit onClick={() => editDiagram(diagram)} className="text-blue-500 cursor-pointer" />
                    {mainUserToken && (
                      <>
                        <FaTrashAlt onClick={() => confirmDelete(diagram._id)} className="text-red-500 cursor-pointer" />
                        {loadingVerification === diagram._id ? (
                          <Spinner size="sm" color="warning" />
                        ) : (
                          diagram.isVerified ? 
                          <FaTimesCircle onClick={() => toggleVerification(diagram._id, diagram.isVerified)} className="text-yellow-500 cursor-pointer" /> :
                          <FaCheckCircle onClick={() => toggleVerification(diagram._id, diagram.isVerified)} className="text-green-500 cursor-pointer" />
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            }
          })}
        </ul>
      </div>

      {/* Confirmation Modal */}
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

export default Home;
