'use client';

import { useState } from 'react';
import VoiceCloneForm from '@/components/VoiceCloneForm';
import TTSForm from '@/components/TTSForm';
import AudioPlayer from '@/components/AudioPlayer';

interface GeneratedAudioData {
  audioUrl: string;
  format: string;
  duration?: number;
  text: string;
  modelUsed?: {
    id: number;
    name: string;
  };
}

interface GeneratedAudio {
  audioUrl: string;
  data: GeneratedAudioData;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'clone' | 'tts'>('clone');
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Handle successful voice model creation
  const handleVoiceCloneSuccess = (model: { model: { name: string } }) => {
    setSuccessMessage(`Voice model "${model.model.name}" created successfully!`);
    setErrorMessage('');
    // Switch to TTS tab after successful model creation
    setTimeout(() => {
      setActiveTab('tts');
      setSuccessMessage('');
    }, 2000);
  };

  // Handle successful TTS generation
  const handleTTSSuccess = (audioUrl: string, data: GeneratedAudioData) => {
    setGeneratedAudio({ audioUrl, data });
    setSuccessMessage('Speech generated successfully!');
    setErrorMessage('');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Handle errors
  const handleError = (error: string) => {
    setErrorMessage(error);
    setSuccessMessage('');
    setTimeout(() => setErrorMessage(''), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Voice Clone App
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Create custom voice models and generate speech
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 justify-center">
            <button
              onClick={() => setActiveTab('clone')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'clone'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              1. Create Voice Model
            </button>
            <button
              onClick={() => setActiveTab('tts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tts'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              2. Generate Speech
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2">
            {activeTab === 'clone' ? (
              <VoiceCloneForm 
                onSuccess={handleVoiceCloneSuccess}
                onError={handleError}
              />
            ) : (
              <TTSForm 
                onSuccess={handleTTSSuccess}
                onError={handleError}
              />
            )}
          </div>

          {/* Right Column - Audio Player */}
          <div className="lg:col-span-1">
            {generatedAudio ? (
              <AudioPlayer
                audioUrl={generatedAudio.audioUrl}
                title="Generated Speech"
                subtitle={`Model: ${generatedAudio.data.modelUsed?.name || 'Unknown'} | Format: ${generatedAudio.data.format?.toUpperCase() || 'Unknown'}`}
                onError={handleError}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Audio Player
                </h3>
                <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <p className="text-sm">
                      Generate speech to see the audio player
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-4">
            How to Use
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-300">
            <li>
              <strong>Create a Voice Model:</strong> Upload an audio file (MP3 or WAV) with a voice sample. 
              The system will analyze the voice characteristics to create a custom model.
            </li>
            <li>
              <strong>Generate Speech:</strong> Once you have a voice model, enter text and select the model 
              to generate speech in that voice.
            </li>
            <li>
              <strong>Play and Download:</strong> Use the audio player to listen to generated speech 
              and download the audio files.
            </li>
          </ol>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            Voice Clone App - Powered by Fish Audio API
          </p>
        </div>
      </footer>
    </div>
  );
}