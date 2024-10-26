"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Spinner } from '@nextui-org/react';

const EmployeeLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const employeeToken = localStorage.getItem('employeeToken');

      // Redirect to the appropriate dashboard if a token or employee token is found
      if (token) {
        router.push('/Dashboard');
      } else if (employeeToken) {
        router.push('/employee-dashboard');
      }

      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'auto';
      };
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_HOST}/api/employeess/login`, {
        email,
        password,
        companyName,
      });
      if (response.status === 200) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('employeeToken', response.data.token);
        }
        router.push('/employee-dashboard'); // Redirect to employee dashboard after login
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          setErrorMessage('Password, email, or company name is incorrect');
        } else if (error.response.status === 403) {
          setErrorMessage('Your account is disabled, please contact your system administrator for support');
        } else {
          setErrorMessage('An unexpected error occurred. Please try again later.');
        }
      } else {
        setErrorMessage('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Return null or a loading spinner if the page shouldn't render due to an existing token
  if (typeof window !== 'undefined' && (localStorage.getItem('token') || localStorage.getItem('employeeToken'))) {
    return null; // Prevent the page from rendering if a token is found
  }

  return (
    <div className="flex items-center justify-center h-screen bg-cover bg-center text-black overflow-hidden"
    style={{ backgroundImage: `url("/Back.png")` }}
    >
      <div className="flex flex-col justify-center items-center w-full max-w-xl h-[650px] bg-white bg-opacity-50 rounded-3xl p-10 shadow-lg backdrop-filter backdrop-blur-md">
        <h2 className="text-4xl font-bold text-center text-[#14BAB6] mb-6">WE MADE YOUR TASKS EASY</h2>
        <p className="text-center text-gray-600 mb-6">Provide a network for all your needs with ease and fun using BPM Arabia.</p>

        {/* Error Message */}
        {errorMessage && <p className="text-red-500 text-center mb-6">{errorMessage}</p>}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your employee email address"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-transparent rounded-xl shadow-sm focus:outline-none focus:ring-[#14BAB6] focus:border-[#14BAB6]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your employee password"
              className="mt-1 block w-full px-4 py-2 border bg-transparent border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-[#14BAB6] focus:border-[#14BAB6]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="Enter your company name"
              className="mt-1 block w-full px-4 py-2 border bg-transparent border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-[#14BAB6] focus:border-[#14BAB6]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[#14BAB6] text-white rounded-full shadow hover:bg-[#2c9b99] transition-colors"
          >
            {loading ? <Spinner size="sm" color="white" /> : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmployeeLogin;
