'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { useForm, Controller } from 'react-hook-form';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const Signup = () => {
  const { register, handleSubmit, control } = useForm();
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignup = async (data) => {
    setErrorMessage('');
    setSuccessMessage('');
    if (data.password !== data.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_HOST}/api/auth/signup`, {
        fullName: data.fullName,
        businessMail: data.businessMail,
        companyName: data.companyName,
        companySize: data.companySize,
        phoneNumber: data.phoneNumber,
        password: data.password,
      });
      setSuccessMessage('Signup successful!');
    } catch (error) {
      setErrorMessage('Error signing up. Please try again.');
      console.error('Error signing up:', error);
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
                  Signup
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10 w-full max-w-xl p-5 xl:scale-105">
        <div className="relative z-10 bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center text-orange-500 mb-6">Signup</h2>
          {errorMessage && <p className="text-red-500 text-center mb-6">{errorMessage}</p>}
          {successMessage && <p className="text-green-500 text-center mb-6">{successMessage}</p>}
          <form onSubmit={handleSubmit(handleSignup)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                {...register('fullName', { required: true })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Email</label>
              <input
                type="email"
                {...register('businessMail', { required: true })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                type="text"
                {...register('companyName', { required: true })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Size</label>
              <select
                {...register('companySize', { required: true })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
              >
                <option value="">Select Company Size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1000 employees</option>
                <option value="1001-5000">1001-5000 employees</option>
                <option value="5001-10000">5001-10000 employees</option>
                <option value="10001+">10001+ employees</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    {...field}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
                    defaultCountry="US"
                    international
                    withCountryCallingCode
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                {...register('password', { required: true })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                {...register('confirmPassword', { required: true })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
              />
            </div>
            <button
              type="submit"
              className="w-full transition-all flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Signup
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

export default Signup;
