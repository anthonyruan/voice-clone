'use client';

import { useState } from 'react';
import { AudioWaveform, Mic, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { VoiceModelCreator } from '@/components/VoiceModelCreator';
import { TextToSpeechGenerator } from '@/components/TextToSpeechGenerator';
import AudioPlayer from '@/components/AudioPlayer';

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

interface GeneratedAudio {
  audioUrl: string;
  data: GeneratedAudioData;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'create' | 'generate'>('create');
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);

  // Handle successful voice model creation
  const handleModelCreated = () => {
    setActiveTab('generate');
  };

  // Handle successful TTS generation
  const handleTTSSuccess = (audioUrl: string, data: GeneratedAudioData) => {
    setGeneratedAudio({ audioUrl, data });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-gradient-primary p-2.5 rounded-xl">
                  <AudioWaveform className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Voice Clone Studio
                </h1>
                <p className="text-sm text-muted-foreground">
                  Create and manage AI voice models
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-card px-3 py-1.5 rounded-full border border-border">
                <Sparkles className="h-3 w-3 text-primary" />
                <span>AI Powered</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
              Clone Any Voice with{' '}
              <span className="text-primary">
                AI Precision
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Upload audio samples to create custom voice models, then generate natural-sounding speech 
              from any text with advanced AI technology.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex bg-card border border-border rounded-lg p-1">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === 'create'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Mic className="h-4 w-4" />
                Create Model
              </button>
              <button
                onClick={() => setActiveTab('generate')}
                className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === 'generate'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <AudioWaveform className="h-4 w-4" />
                Generate Speech
              </button>
            </div>
          </div>

          {/* Main Interface */}
          <Card className="bg-card border-border shadow-card">
            <CardContent className="p-8">
              {activeTab === 'create' ? (
                <VoiceModelCreator onModelCreated={handleModelCreated} />
              ) : (
                <TextToSpeechGenerator onSuccess={handleTTSSuccess} />
              )}
            </CardContent>
          </Card>

          {/* Audio Player Section */}
          {generatedAudio && (
            <div className="mt-8">
              <Card className="shadow-card border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <AudioPlayer
                    audioUrl={generatedAudio.audioUrl}
                    title="Generated Speech"
                    subtitle={`Model: ${generatedAudio.data.modelUsed?.title || 'Unknown'} | Format: ${generatedAudio.data.format?.toUpperCase() || 'Unknown'}`}
                    onError={(error) => console.error(error)}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <div className="bg-primary/10 p-4 rounded-xl">
                  <Mic className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">High-Quality Models</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Create voice models from MP3 or WAV files with advanced AI processing
                </p>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <div className="bg-primary/10 p-4 rounded-xl">
                  <AudioWaveform className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Natural Speech</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Generate natural-sounding speech with customizable speed and format
                </p>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <div className="bg-primary/10 p-4 rounded-xl">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">AI Powered</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Leveraging cutting-edge AI technology for professional results
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>Voice Clone Studio - Create AI voice models with precision</p>
          </div>
        </div>
      </footer>
    </div>
  );
}