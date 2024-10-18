"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Spinner } from '@nextui-org/react';

const Login = () => {
  const [businessMail, setBusinessMail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false); 
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const employeeToken = localStorage.getItem('employeeToken');

      // Redirect to the appropriate dashboard if a token is found
      if (token) {
        router.push('/Dashboard');
      } else if (employeeToken) {
        router.push('/employee-dashboard');
      }

      // Set overflow hidden on body to prevent scrolling
      document.body.style.overflow = 'hidden';

      // Cleanup function to reset overflow when component unmounts
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
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_HOST}/api/auth/login`, { businessMail, password });
      if (response.status === 200) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', response.data.token); 
        }
        router.push('/Dashboard'); // Redirect to dashboard after login
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          setErrorMessage('Password or email is incorrect');
        } else if (error.response.status === 403) {
          setErrorMessage('Your account is disabled, please contact customer service team for support');
        } else {
          setErrorMessage('An unexpected error occurred. Please try again later.');
        }
      } else {
        console.error('Error logging in:', error);
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
         style={{ backgroundImage: `url('https://s3-alpha-sig.figma.com/img/4d2f/74a5/053ec6179a7e5f4edef49e6efdd2115d?Expires=1729468800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=qWUYEdVqHqPT963FTuaBbi3yzsYZvIZFGnZ3N5Lu8m7W0oWHxHyR4T1diM8LzJ7M4iesXPbXCNDhaKhRo2XYDvaf5JSTFOPIDRODGLWI9QD~wMUYsSpfAA175J5VdEgjW8bg0T716uo~jKRz2DqKW6VEKyocUKYwfha4ecwXgaNfSQMzjELzXdyZc9Td~QBUqPCgoHzGtRBNtO82iV2RLKlSkjwiAHmKNS8E~l1ZInJf8WLEj~uJkcLTH5JEvTQ-MwQiOvohXaW1--ysikY~39HAjKZ8T~ZgmAcwHtRzycA4bwGiCtZ61d3W95ER6SIgEMRq~qVxFWGrzPRoGO7hzQ__')` }}
    >
      <div className="flex flex-col justify-center items-center w-full max-w-xl h-[550px] bg-white bg-opacity-50 rounded-3xl p-10 shadow-lg backdrop-filter backdrop-blur-md">
        <h2 className="text-4xl font-bold text-center text-[#1C997F] mb-6">Process Mapping with us<br/>Process Notation with us</h2>
        <p className="text-center text-gray-600 mb-6">Provide a network for all your needs with ease and fun using BPMN Arabia. Discover interesting features from us.</p>
        
        {/* Error Message */}
        {errorMessage && <p className="text-red-500 text-center mb-6">{errorMessage}</p>}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={businessMail}
              onChange={(e) => setBusinessMail(e.target.value)}
              required
              placeholder="Enter your email address"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-transparent rounded-xl shadow-sm focus:outline-none focus:ring-[#1C997F] focus:border-[#1C997F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="mt-1 block w-full px-4 py-2 border bg-transparent border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-[#1C997F] focus:border-[#1C997F]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[#1C997F] text-white rounded-full shadow hover:bg-[#168b70] transition-colors"
          >
            {loading ? <Spinner size="sm" color="white" /> : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
