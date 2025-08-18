'use client';

import { useState, useEffect, useCallback } from 'react';
import { AudioWaveform, RefreshCw, AlertCircle, CheckCircle, Play, ChevronDown } from 'lucide-react';

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

interface TextToSpeechGeneratorProps {
  onSuccess?: (audioUrl: string, data: GeneratedAudioData) => void;
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

export function TextToSpeechGenerator({ onSuccess }: TextToSpeechGeneratorProps) {
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
  const [success, setSuccess] = useState(false);

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
    } finally {
      setIsLoadingModels(false);
    }
  }, []);

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
    setSuccess(false);

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
        setSuccess(true);
        // Call success callback with audio URL and data
        onSuccess?.(result.data.audioUrl, result.data);
        
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(result.message || 'Failed to generate speech');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh models
  const handleRefreshModels = () => {
    loadVoiceModels();
  };

  const selectedModel = voiceModels.find(model => model.id === formData.modelId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <AudioWaveform className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">Generate Speech</h3>
            <p className="text-sm text-muted-foreground">
              Convert text to speech using your custom voice models
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
              Speech generated successfully!
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Voice Model Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="model" className="block text-sm font-medium">
              Voice Model *
            </label>
            <button
              type="button"
              onClick={handleRefreshModels}
              disabled={isLoadingModels}
              className="flex items-center text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingModels ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          {isLoadingModels ? (
            <div className="flex items-center justify-center py-8 bg-muted/50 rounded-lg border border-dashed border-border">
              <div className="flex items-center text-muted-foreground">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent mr-3"></div>
                Loading voice models...
              </div>
            </div>
          ) : voiceModels.length === 0 ? (
            <div className="py-8 px-6 bg-muted/30 border border-border rounded-lg text-center">
              <AudioWaveform className="h-12 w-12 text-primary mx-auto mb-3" />
              <p className="text-sm text-foreground font-medium mb-1">
                No voice models available
              </p>
              <p className="text-xs text-muted-foreground">
                Create a voice model first to use text-to-speech
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <select
                  id="model"
                  value={formData.modelId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, modelId: e.target.value || null }))}
                  className={`w-full px-4 py-3 pr-10 rounded-lg border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none ${
                    errors.modelId ? 'border-red-500 focus:ring-red-500' : 'border-border'
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
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              
              {selectedModel && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-center text-sm">
                    <AudioWaveform className="h-4 w-4 text-primary mr-2" />
                    <span className="font-medium text-foreground">{selectedModel.title}</span>
                    {selectedModel.description && (
                      <span className="text-muted-foreground ml-2">- {selectedModel.description}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created: {new Date(selectedModel.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {errors.modelId && (
            <p className="text-sm text-red-500 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.modelId}
            </p>
          )}
          {errors.models && (
            <p className="text-sm text-red-500 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.models}
            </p>
          )}
        </div>

        {/* Text Input */}
        <div className="space-y-2">
          <label htmlFor="text" className="block text-sm font-medium">
            Text to Convert *
          </label>
          <textarea
            id="text"
            value={formData.text}
            onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
            rows={4}
            className={`w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none ${
              errors.text ? 'border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="Enter the text you want to convert to speech..."
            disabled={isLoading}
          />
          <div className="flex justify-between items-center">
            {errors.text ? (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.text}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {formData.text.length}/5000 characters
              </p>
            )}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Output Format */}
          <div className="space-y-2">
            <label htmlFor="format" className="block text-sm font-medium">
              Output Format
            </label>
            <div className="relative">
              <select
                id="format"
                value={formData.format}
                onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value as 'wav' | 'mp3' }))}
                className="w-full px-4 py-3 pr-10 rounded-lg border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none border-border"
                disabled={isLoading}
              >
                <option value="mp3">MP3 (Recommended - Best Compatibility)</option>
                <option value="wav">WAV (Higher Quality - May have playback issues in some browsers)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {formData.format === 'wav' && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-orange-600 dark:text-orange-400 font-medium">
                      WAV Compatibility Warning
                    </p>
                    <p className="text-orange-600/80 dark:text-orange-400/80 mt-1">
                      WAV files generated by Fish Audio may not play in all browsers due to encoding differences. 
                      MP3 format is recommended for better compatibility.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Speech Speed */}
          <div className="space-y-2">
            <label htmlFor="speed" className="block text-sm font-medium">
              Speech Speed: {formData.speed}x
            </label>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="range"
                  id="speed"
                  min="0.1"
                  max="3.0"
                  step="0.1"
                  value={formData.speed}
                  onChange={(e) => setFormData(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((formData.speed - 0.1) / (3.0 - 0.1)) * 100}%, var(--muted) ${((formData.speed - 0.1) / (3.0 - 0.1)) * 100}%, var(--muted) 100%)`
                  }}
                  disabled={isLoading}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.1x</span>
                <span>1.0x</span>
                <span>3.0x</span>
              </div>
            </div>
            {errors.speed && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.speed}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || voiceModels.length === 0}
          className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
              Generating Speech...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Play className="h-5 w-5 mr-2" />
              Generate Speech
            </div>
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