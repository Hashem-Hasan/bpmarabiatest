import React from 'react';

const Modal = ({ isOpen, onClose, title, children, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black text-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        <div className="mb-4">
          {children}
        </div>
        <div className="flex justify-center space-x-4">
          <button onClick={onClose} className="bg-gray-300 text-black py-2 px-4 rounded hover:bg-gray-400 transition-all ">Cancel</button>
          <button onClick={onConfirm} className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-all">Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
