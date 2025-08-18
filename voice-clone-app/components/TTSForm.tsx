'use client';

import { useState, useEffect, useCallback } from 'react';

interface VoiceModel {
  id: string;
  title: string;
  description?: string;
  fish_model_id: string;
  created_at: string;
}

interface GeneratedAudioData {
  audioUrl: string;
  format: string;
  duration?: number;
  text: string;
  modelUsed?: {
    id: string;
    title: string;
  };
}

interface TTSFormProps {
  onSuccess?: (audioUrl: string, data: GeneratedAudioData) => void;
  onError?: (error: string) => void;
}

interface FormData {
  text: string;
  modelId: string | null;
  format: 'wav' | 'mp3';
  speed: number;
}

interface ModelsApiResponse {
  success: boolean;
  data?: VoiceModel[];
  error?: string;
  message?: string;
  details?: string[];
}

interface TTSApiResponse {
  success: boolean;
  data?: GeneratedAudioData;
  error?: string;
  message?: string;
  details?: string[];
}

export default function TTSForm({ onSuccess, onError }: TTSFormProps) {
  const [formData, setFormData] = useState<FormData>({
    text: '',
    modelId: null,
    format: 'mp3',
    speed: 1.0,
  });
  const [voiceModels, setVoiceModels] = useState<VoiceModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadVoiceModels = useCallback(async () => {
    try {
      setIsLoadingModels(true);
      const response = await fetch('/api/models');
      const result: ModelsApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to load voice models');
      }

      if (result.success && result.data) {
        setVoiceModels(result.data);
        // Auto-select first model if available
        if (result.data.length > 0) {
          setFormData(prev => ({ ...prev, modelId: result.data![0].id }));
        }
      } else {
        throw new Error(result.message || 'Failed to load voice models');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load voice models';
      setErrors({ models: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoadingModels(false);
    }
  }, [onError]);

  // Load voice models on component mount
  useEffect(() => {
    loadVoiceModels();
  }, [loadVoiceModels]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.text.trim()) {
      newErrors.text = 'Text is required';
    } else if (formData.text.length > 5000) {
      newErrors.text = 'Text must be less than 5000 characters';
    }

    if (!formData.modelId) {
      newErrors.modelId = 'Please select a voice model';
    }

    if (formData.speed < 0.1 || formData.speed > 3.0) {
      newErrors.speed = 'Speed must be between 0.1 and 3.0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      const requestBody = {
        text: formData.text.trim(),
        modelId: formData.modelId,
        format: formData.format,
        speed: formData.speed,
      };

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result: TTSApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to generate speech');
      }

      if (result.success && result.data) {
        // Call success callback with audio URL and data
        onSuccess?.(result.data.audioUrl, result.data);
      } else {
        throw new Error(result.message || 'Failed to generate speech');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrors({ submit: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh models
  const handleRefreshModels = () => {
    loadVoiceModels();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Text-to-Speech
        </h2>
        <button
          onClick={handleRefreshModels}
          disabled={isLoadingModels}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
        >
          {isLoadingModels ? 'Loading...' : 'Refresh Models'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Voice Model Selection */}
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Voice Model *
          </label>
          {isLoadingModels ? (
            <div className="flex items-center justify-center py-4 bg-gray-100 dark:bg-gray-700 rounded-md">
              <svg className="animate-spin h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-gray-500">Loading voice models...</span>
            </div>
          ) : voiceModels.length === 0 ? (
            <div className="py-4 px-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                No voice models available. Create a voice model first to use text-to-speech.
              </p>
            </div>
          ) : (
            <select
              id="model"
              value={formData.modelId || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, modelId: e.target.value || null }))}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.modelId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            >
              <option value="">Select a voice model</option>
              {voiceModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.title} {model.description && `- ${model.description}`}
                </option>
              ))}
            </select>
          )}
          {errors.modelId && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.modelId}</p>
          )}
          {errors.models && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.models}</p>
          )}
        </div>

        {/* Text Input */}
        <div>
          <label htmlFor="text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Text to Convert *
          </label>
          <textarea
            id="text"
            value={formData.text}
            onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              errors.text ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter the text you want to convert to speech..."
            disabled={isLoading}
          />
          <div className="flex justify-between mt-1">
            {errors.text ? (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.text}</p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formData.text.length}/5000 characters
              </p>
            )}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Output Format */}
          <div>
            <label htmlFor="format" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Output Format
            </label>
            <select
              id="format"
              value={formData.format}
              onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value as 'wav' | 'mp3' }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
            >
              <option value="mp3">MP3 (Recommended)</option>
              <option value="wav">WAV (Higher Quality)</option>
            </select>
          </div>

          {/* Speech Speed */}
          <div>
            <label htmlFor="speed" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Speech Speed: {formData.speed}x
            </label>
            <input
              type="range"
              id="speed"
              min="0.1"
              max="3.0"
              step="0.1"
              value={formData.speed}
              onChange={(e) => setFormData(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Slow (0.1x)</span>
              <span>Normal (1.0x)</span>
              <span>Fast (3.0x)</span>
            </div>
            {errors.speed && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.speed}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isLoading || voiceModels.length === 0}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Speech...
              </div>
            ) : (
              'Generate Speech'
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