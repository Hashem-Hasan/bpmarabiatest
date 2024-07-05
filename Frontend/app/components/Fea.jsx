"use client";
import React from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const Fea = () => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true, // Animation will only trigger once
    threshold: 0.5, // Trigger animation when 10% of the element is in view
  });

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

  React.useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={scrollAnimation}
    >
      <div className="py-16 px-4 bg-white">
        <div className="max-w-xl px-4 mx-auto sm:px-6 lg:max-w-screen-xl lg:px-8">
          <div>
            <h3 className="text-3xl font-extrabold leading-8 tracking-tight text-center text-gray-900 sm:text-4xl sm:leading-10">
              Packed with features
            </h3>
            <p className="max-w-3xl mx-auto mt-4 text-xl leading-7 text-center text-gray-500">
              This product has the most features that you will need out of all box.
            </p>
          </div>

          <div className="mt-12 lg:grid lg:grid-cols-3 lg:gap-8 items-center">
            <div className="text-center flex flex-col items-center">
              <div className="flex items-center justify-center w-12 h-12 text-white bg-orange-500 rounded-md">
                <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z">
                  </path>
                </svg>
              </div>
              <div className="mt-5">
                <h5 className="text-lg font-medium leading-6 text-gray-900">Advanced Encryption</h5>
                <p className="mt-2 text-base leading-6 text-gray-600">
                  Encrypt your files and folders with military-grade encryption algorithms, ensuring that only authorized
                  users can access your data.
                </p>
              </div>
            </div>
            <div className="mt-10 lg:mt-0 text-center flex flex-col items-center">
              <div className="flex items-center justify-center w-12 h-12 text-white bg-orange-500 rounded-md">
                <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z">
                  </path>
                </svg>
              </div>
              <div className="mt-5">
                <h5 className="text-lg font-medium leading-6 text-gray-900">Access Control</h5>
                <p className="mt-2 text-base leading-6 text-gray-600">
                  Set up granular access controls and permissions to determine who can view, edit, or share your data, giving
                  you full control over who has access to your information.
                </p>
              </div>
            </div>
            <div className="mt-10 lg:mt-0 text-center flex flex-col items-center">
              <div className="flex items-center justify-center w-12 h-12 text-white bg-orange-500 rounded-md">
                <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                </svg>
              </div>
              <div className="mt-5">
                <h5 className="text-lg font-medium leading-6 text-gray-900">Real-time Monitoring</h5>
                <p className="mt-2 text-base leading-6 text-gray-600">
                  Stay informed about the security of your data with real-time monitoring and alerts, so you can respond
                  quickly to any suspicious activity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Fea;
