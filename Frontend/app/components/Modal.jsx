// Modal.jsx
import React from 'react';

const Modal = ({ isOpen, onClose, title, children, hideFooter, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="modal-container bg-white rounded shadow-lg p-6 w-full max-w-md">
        {/* Modal Header */}
        <div className="modal-header flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 font-bold text-2xl leading-none focus:outline-none"
          >
            &times;
          </button>
        </div>
        {/* Modal Body */}
        <div className="modal-body mt-4">{children}</div>
        {/* Modal Footer */}
        {!hideFooter && (
          <div className="modal-footer mt-6 flex justify-end space-x-2">
            <button
              className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              onClick={onConfirm}
            >
              Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
