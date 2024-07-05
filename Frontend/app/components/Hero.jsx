"use client"
import React, { createContext } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@nextui-org/button'; // Adjusted import based on your UI library

const Hero = ({ listUser = [] }) => {
  const scrollAnimation = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className="max-w-screen py-16 bg-black" id="about">
      <div className="grid grid-flow-row sm:grid-flow-col lg:px-32 xl:px-96 ">
        <motion.div
          className="flex px-10 flex-col justify-center items-center text-center md:items-start md:text-start row-start-2 sm:row-start-1"
          initial="hidden"
          animate="visible"
          variants={scrollAnimation}
        >
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-medium text-white">
            Want anything to be easy with <strong>BPMN Arabia</strong>.
          </h1>
          <p className="text-white mt-4 mb-6">
            Provide a network for all your needs with ease and fun using BPMN Arabia. Discover interesting features from us.
          </p>
          <Link href="/Structure">
            <Button className="bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600">Get Started</Button>
          </Link>
        </motion.div>
        <div className="flex w-full">
          <motion.div
            className="h-full w-full"
            initial="hidden"
            animate="visible"
            variants={scrollAnimation}
          >
            <img
              src="https://camunda.com/wp-content/uploads/2023/02/bpmn-bg-rhs.svg"
              alt="VPN Illustration"
              className="hidden md:block md:object-cover h-full w-full"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
