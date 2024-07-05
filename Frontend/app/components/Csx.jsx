"use client";
import React from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const Csx = () => {
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
      <div className="bg-white w-full px-4 py-16" id="faq">
        <h2 className="text-4xl font-bold text-center">Happy Customers</h2>
        <p className="pt-6 pb-8 text-base max-w-2xl text-center m-auto">
          Lorem ipsum dolor sit amet consectetur adipisicing elit nam maxime quas fugiat tempore blanditiis, eveniet quia accusantium.
        </p>
        <div className="mx-auto w-full max-w-4xl bg-white justify-center items-center grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <a target="_blank" href="">
            <img alt="" className="h-20 mx-auto" src="https://www.svgrepo.com/show/442910/brand-apple.svg" />
          </a>
          <a target="_blank" href="">
            <img alt="" className="h-20 mx-auto" src="https://www.svgrepo.com/show/443329/brand-pixar.svg" />
          </a>
          <a target="_blank" href="">
            <img alt="" className="h-20 mx-auto" src="https://www.svgrepo.com/show/443079/brand-geforce.svg" />
          </a>
          <a target="_blank" href="">
            <img alt="" className="h-20 mx-auto" src="https://www.svgrepo.com/show/443042/brand-ethereum.svg" />
          </a>
          <a target="_blank" href="">
            <img alt="" className="h-20 mx-auto" src="https://www.svgrepo.com/show/443206/brand-line.svg" />
          </a>
          <a target="_blank" href="">
            <img alt="" className="h-20 mx-auto" src="https://www.svgrepo.com/show/519278/slack.svg" />
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default Csx;
