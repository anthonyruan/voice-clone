'use client';

import { useState, useRef } from 'react';

interface VoiceCloneFormProps {
  onSuccess?: (model: { model: { name: string } }) => void;
  onError?: (error: string) => void;
}

interface FormData {
  name: string;
  description: string;
  audioFile: File | null;
}

interface ApiResponse {
  success: boolean;
  data?: { model: { name: string } };
  error?: string;
  message?: string;
  details?: string[];
}

export default function VoiceCloneForm({ onSuccess, onError }: VoiceCloneFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    audioFile: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File validation
  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/wave'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload an MP3 or WAV file';
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    return null;
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Model name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Model name must be at least 2 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Model name must be less than 50 characters';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    if (!formData.audioFile) {
      newErrors.audioFile = 'Audio file is required';
    } else {
      const fileError = validateFile(formData.audioFile);
      if (fileError) {
        newErrors.audioFile = fileError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const fileError = validateFile(file);
    if (fileError) {
      setErrors(prev => ({ ...prev, audioFile: fileError }));
      return;
    }

    setFormData(prev => ({ ...prev, audioFile: file }));
    setErrors(prev => ({ ...prev, audioFile: '' }));
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      if (formData.description.trim()) {
        formDataToSend.append('description', formData.description.trim());
      }
      formDataToSend.append('audio', formData.audioFile!);

      const response = await fetch('/api/create-model', {
        method: 'POST',
        body: formDataToSend,
      });

      const result: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to create voice model');
      }

      if (result.success) {
        // Reset form
        setFormData({ name: '', description: '', audioFile: null });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Call success callback
        if (result.data) {
          onSuccess?.(result.data);
        }
      } else {
        throw new Error(result.message || 'Failed to create voice model');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrors({ submit: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Create Voice Model
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Model Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Model Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter a name for your voice model"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe your voice model (optional)"
            disabled={isLoading}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
          )}
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Audio File * (MP3 or WAV, max 10MB)
          </label>
          
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : errors.audioFile
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,audio/mp3,audio/wav,audio/mpeg,audio/wave"
              onChange={handleFileInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isLoading}
            />
            
            {formData.audioFile ? (
              <div className="space-y-2">
                <div className="text-green-600 dark:text-green-400">
                  <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {formData.audioFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(formData.audioFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-gray-400">
                  <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    MP3 or WAV files only, up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {errors.audioFile && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.audioFile}</p>
          )}
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Model...
              </div>
            ) : (
              'Create Voice Model'
            )}
          </button>
        </div>

        {/* General Error Display */}
        {errors.submit && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 dark:text-red-200">{errors.submit}</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}