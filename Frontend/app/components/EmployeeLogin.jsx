"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const EmployeeLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const employeeToken = localStorage.getItem('employeeToken');

    if (token || employeeToken) {
      router.push('/');
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(''); // Reset error message
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_HOST}/api/employeess/login`, { email, password });
      if (response.status === 200) {
        console.log('Login Response:', response.data); // Add this line for debugging
        localStorage.setItem('employeeToken', response.data.token); // Save token to local storage
        window.location.href = '/employee-dashboard'; // Redirect to employee dashboard
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setErrorMessage('Password or email is incorrect');
      } else if (error.response && error.response.status === 403) {
        setErrorMessage('Your account is disabled, please contact your system administrator for support');
      } else {
        console.error('Error logging in:', error);
        setErrorMessage('An error occurred, please contact your system administrator');
      }
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-r from-white to-orange-100 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-full h-full flex flex-col justify-center items-center -space-y-10">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className={`whitespace-nowrap text-[12rem] font-bold ${i % 2 === 0 ? 'animation-background-1' : 'animation-background-2'}`}
            >
              {Array.from({ length: 50 }, (_, j) => (
                <span
                  key={j}
                  className={`${j % 2 === 0 ? 'text-orange-200' : 'text-transparent'}`}
                  style={j % 2 !== 0 ? { WebkitTextStroke: '1px #F97316', WebkitTextStrokeWidth: '2px' } : {}}
                >
                  Login
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10 w-full max-w-xl p-5 xl:scale-125 text-black">
        <div className="relative z-10 bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center text-orange-500 mb-6">Employee Login</h2>
          {errorMessage && <p className="text-red-500 text-center mb-6">{errorMessage}</p>}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full transition-all flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Login
            </button>
          </form>
        </div>
      </div>
      <style jsx>{`
        .animation-background-1 {
          animation: scrollBackground1 120s linear infinite;
        }
        .animation-background-2 {
          animation: scrollBackground2 120s linear infinite;
        }
        @keyframes scrollBackground1 {
          0% { transform: translateX(0); }
          45% { transform: translateX(-45%); }
        }
        @keyframes scrollBackground2 {
          0% { transform: translateX(0); }
          45% { transform: translateX(45%); }
        }
      `}</style>
    </div>
  );
};

export default EmployeeLogin;
