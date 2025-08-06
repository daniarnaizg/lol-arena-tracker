/**
 * Import Modal Component
 */

"use client"
import React, { useState, useRef } from 'react';
import { ValidationResult } from './types';
import { validateImportData } from './validation';
import { Champion } from '@/services/ddragon';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (champions: Champion[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [importContent, setImportContent] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      setValidationResult({ isValid: false, error: 'Please select a JSON file' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportContent(content);
      setIsValidating(true);
      
      // Validate with a small delay for UX
      setTimeout(() => {
        const result = validateImportData(content);
        setValidationResult(result);
        setIsValidating(false);
      }, 300);
    };
    reader.readAsText(file);
  };

  const handleTextareaChange = (content: string) => {
    setImportContent(content);
    if (content.trim()) {
      setIsValidating(true);
      // Debounced validation
      setTimeout(() => {
        const result = validateImportData(content);
        setValidationResult(result);
        setIsValidating(false);
      }, 500);
    } else {
      setValidationResult(null);
    }
  };

  const handleImportConfirm = () => {
    if (validationResult?.isValid && validationResult.data) {
      onImport(validationResult.data);
      handleClose();
    }
  };

  const handleClose = () => {
    setImportContent('');
    setValidationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Import Champion Progress</h2>
          <p className="text-gray-600 mt-1">
            Import your champion tracking data from a JSON file or paste the content directly.
          </p>
        </div>
        
        <div className="p-6">
          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              title="Select JSON file to import"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
          </div>

          {/* Text Area */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste JSON Content
            </label>
            <textarea
              value={importContent}
              onChange={(e) => handleTextareaChange(e.target.value)}
              placeholder="Paste your champion progress JSON data here..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Validation Status */}
          {isValidating && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <div className="animate-spin h-4 w-4 border-2 border-blue-700 border-t-transparent rounded-full"></div>
                Validating data...
              </div>
            </div>
          )}

          {validationResult && !isValidating && (
            <div className={`mb-4 p-3 rounded-lg border ${
              validationResult.isValid 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              {validationResult.isValid ? (
                <div className="text-green-700">
                  <div className="flex items-center gap-2 font-medium">
                    <span>✅</span>
                    Valid champion data found!
                  </div>
                  {validationResult.data && (
                    <div className="text-sm mt-1">
                      {validationResult.data.length} champions will be imported
                    </div>
                  )}
                  {validationResult.warnings && (
                    <div className="text-sm mt-2 space-y-1">
                      {validationResult.warnings.map((warning, index) => (
                        <div key={index} className="text-amber-700">⚠️ {warning}</div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-700">
                  <div className="flex items-center gap-2 font-medium">
                    <span>❌</span>
                    Validation failed
                  </div>
                  <div className="text-sm mt-1">{validationResult.error}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImportConfirm}
            disabled={!validationResult?.isValid}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              validationResult?.isValid
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Import Data
          </button>
        </div>
      </div>
    </div>
  );
};
