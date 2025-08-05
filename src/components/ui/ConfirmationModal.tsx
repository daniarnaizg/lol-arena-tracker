"use client"
import React, { useEffect, useRef } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  className = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management and escape key handling
  useEffect(() => {
    if (isOpen) {
      // Focus the confirm button when modal opens
      confirmButtonRef.current?.focus();
      
      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCancel();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onCancel}
    >
      <div 
        ref={modalRef}
        className={`
          bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6
          transform transition-all duration-200 scale-100
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {title}
        </h2>
        
        {/* Message */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {message}
        </p>
        
        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="
              px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200
              rounded-lg font-medium transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-gray-300
            "
          >
            {cancelText}
          </button>
          
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className="
              px-4 py-2 text-white bg-red-600 hover:bg-red-700
              rounded-lg font-medium transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-red-300
            "
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
