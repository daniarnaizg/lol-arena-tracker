"use client"
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Champion } from '@/services/ddragon';

interface ChampionInfoModalProps {
  isOpen: boolean;
  champion: Champion | null;
  onClose: () => void;
}

export const ChampionInfoModal: React.FC<ChampionInfoModalProps> = ({
  isOpen,
  champion,
  onClose
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key and prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && champion && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            ref={modalRef}
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-auto p-5 md:p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with close button */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{champion.name}</h2>
              <button 
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Close"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content - Champion Arena Info */}
            <div className="text-gray-700 space-y-4">
              <p className="text-lg">Arena statistics for {champion.name}</p>
              
              {/* Placeholder content - replace with actual data in the future */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="italic text-gray-500">Champion arena statistics will be displayed here.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
