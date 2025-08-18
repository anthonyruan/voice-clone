'use client';

import { useState, useRef } from 'react';
import { Mic, Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface VoiceModelCreatorProps {
  onModelCreated?: () => void;
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

export function VoiceModelCreator({ onModelCreated }: VoiceModelCreatorProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    audioFile: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File validation
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/wave'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload an MP3 or WAV file';
    }

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
    setSuccess(false);

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
        setSuccess(true);
        // Reset form
        setFormData({ name: '', description: '', audioFile: null });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Call success callback
        setTimeout(() => {
          onModelCreated?.();
          setSuccess(false);
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to create voice model');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Mic className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">Upload Audio File</h3>
            <p className="text-sm text-muted-foreground">
              Upload an MP3 or WAV file (max 10MB) to create your voice model
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <p className="text-green-500 text-sm font-medium">
              Voice model created successfully!
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Model Information Section */}
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-2">Model Information</h4>
            <p className="text-sm text-muted-foreground">Provide details about your voice model</p>
          </div>

          {/* Model Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Model Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-4 py-3 rounded-lg border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                errors.name ? 'border-red-500 focus:ring-red-500' : 'border-border'
              }`}
              placeholder="Enter model name (2-50 characters)"
              disabled={isLoading}
            />
            <div className="flex justify-between items-center">
              {errors.name ? (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.name}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {formData.name.length}/50 characters
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-foreground">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className={`w-full px-4 py-3 rounded-lg border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none ${
                errors.description ? 'border-red-500 focus:ring-red-500' : 'border-border'
              }`}
              placeholder="Describe your voice model (max 200 characters)"
              disabled={isLoading}
            />
            <div className="flex justify-between items-center">
              {errors.description ? (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {formData.description.length}/200 characters
                </p>
              )}
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          <div
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
              dragActive
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : errors.audioFile
                ? 'border-red-500 bg-red-500/5'
                : 'border-border hover:border-primary/50 hover:bg-card/50'
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
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="bg-green-500/10 p-4 rounded-full">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-foreground text-lg">
                    {formData.audioFile.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(formData.audioFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, audioFile: null }));
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                  disabled={isLoading}
                >
                  Choose different file
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <div className="bg-muted p-6 rounded-full">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <p className="text-foreground font-medium text-lg mb-2">
                    Drop your audio file here, or{' '}
                    <span className="text-primary">click to select</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports MP3 and WAV files up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {errors.audioFile && (
            <p className="text-sm text-red-500 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.audioFile}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
              Create Voice Model
            </div>
          ) : (
            'Create Voice Model'
          )}
        </button>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-red-500 text-sm">{errors.submit}</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}