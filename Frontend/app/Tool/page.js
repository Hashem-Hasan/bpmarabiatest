'use client';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import BpmnEditor from '../components/BpmnEditor';
import { Button, Input, Spinner } from "@nextui-org/react";

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
  const observer = useRef();
  const isFetching = useRef(false);

  const [mainUserToken, setMainUserToken] = useState(null);
  const [employeeToken, setEmployeeToken] = useState(null);

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

  const saveDiagram = async ({ id, name, xml }) => {
    const token = mainUserToken || employeeToken;
    setLoading(true);
    try {
      let response;
      if (id) {
        response = await axios.put(`${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/${id}`, { name, xml }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        response = await axios.post(`${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes`, { name, xml }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
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
      // Reset editor by changing the key
      setEditorKey(Date.now());
    } catch (err) {
      console.error('Error saving diagram:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteDiagram = async (id) => {
    const token = mainUserToken;
    setLoading(true);
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedDiagrams = diagrams.filter(diagram => diagram._id !== id);
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
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_HOST}/api/bpmnroutes/toggle-verify/${id}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      resetDiagrams();
    } catch (err) {
      console.error('Error toggling verification:', err);
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
      <BpmnEditor key={editorKey} onSave={saveDiagram} diagramToEdit={selectedDiagram} />
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
                  {diagram.name} ({diagram.isVerified ? 'Verified' : 'Not Verified'})
                  <div>
                    <button onClick={() => editDiagram(diagram)} className="ml-2 text-blue-500">Edit</button>
                    {mainUserToken && (
                      <>
                        <button onClick={() => deleteDiagram(diagram._id)} className="ml-2 text-red-500">Delete</button>
                        <button onClick={() => toggleVerification(diagram._id, diagram.isVerified)} className="ml-2 text-green-500">
                          {diagram.isVerified ? 'Unverify' : 'Verify'}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            } else {
              return (
                <li key={diagram._id} className='flex justify-between p-2'>
                  {diagram.name} ({diagram.isVerified ? 'Verified' : 'Not Verified'})
                  <div>
                    <button onClick={() => editDiagram(diagram)} className="ml-2 text-blue-500">Edit</button>
                    {mainUserToken && (
                      <>
                        <button onClick={() => deleteDiagram(diagram._id)} className="ml-2 text-red-500">Delete</button>
                        <button onClick={() => toggleVerification(diagram._id, diagram.isVerified)} className="ml-2 text-green-500">
                          {diagram.isVerified ? 'Unverify' : 'Verify'}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            }
          })}
        </ul>
      </div>
      {mainUserToken && (
        <div className="flex w-full justify-center space-x-4 mt-8">
          <Button className="bg-gray-500 w-1/3 text-white" onClick={() => window.location.href = '/employeesys'}>
            Back
          </Button>
          <Button className="bg-orange-500 w-1/3 text-white" onClick={() => window.location.href = '/ProcessManager'}>
            Next Step
          </Button>
        </div>
      )}
    </div>
  );
};

export default Home;
