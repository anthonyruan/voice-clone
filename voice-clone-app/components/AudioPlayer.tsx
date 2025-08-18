'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, AlertCircle } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
  subtitle?: string;
  className?: string;
  onError?: (error: string) => void;
}

export default function AudioPlayer({ 
  audioUrl, 
  title, 
  subtitle, 
  className = '',
  onError 
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number | null>(null);

  // Calculate styles at component level, not in JSX
  const progressStyle = useMemo(() => {
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    return {
      background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${progressPercent}%, var(--muted) ${progressPercent}%, var(--muted) 100%)`
    };
  }, [currentTime, duration]);

  const volumeStyle = useMemo(() => {
    const volumePercent = (isMuted ? 0 : volume) * 100;
    return {
      background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${volumePercent}%, var(--muted) ${volumePercent}%, var(--muted) 100%)`
    };
  }, [isMuted, volume]);

  // Reset state when audio URL changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setError(null);
    // Cancel any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Handle audio loading
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  };

  // Simple progress update function
  const updateProgress = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  // Handle time updates (fallback for when animation is not running)
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && !isPlaying) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [isPlaying]);

  // Handle play/pause
  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        // Stop the animation when pausing
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Special handling for WAV files
        const isWav = audioUrl.toLowerCase().includes('.wav');
        
        if (isWav) {
          // Force reload for WAV files to ensure proper decoding
          audioRef.current.load();
          
          // Wait for the audio to be ready
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Audio loading timeout'));
            }, 10000); // 10 second timeout
            
            const handleCanPlayThrough = () => {
              clearTimeout(timeout);
              audioRef.current?.removeEventListener('canplaythrough', handleCanPlayThrough);
              audioRef.current?.removeEventListener('error', handleError);
              resolve(void 0);
            };
            
            const handleError = () => {
              clearTimeout(timeout);
              audioRef.current?.removeEventListener('canplaythrough', handleCanPlayThrough);
              audioRef.current?.removeEventListener('error', handleError);
              reject(new Error('Audio loading failed'));
            };
            
            audioRef.current?.addEventListener('canplaythrough', handleCanPlayThrough);
            audioRef.current?.addEventListener('error', handleError);
          });
        } else {
          // For non-WAV files, use lighter loading check
          if (audioRef.current.readyState < 2) {
            audioRef.current.load();
            await new Promise((resolve) => {
              const handleCanPlay = () => {
                audioRef.current?.removeEventListener('canplay', handleCanPlay);
                resolve(void 0);
              };
              audioRef.current?.addEventListener('canplay', handleCanPlay);
            });
          }
        }
        
        // Reset currentTime to 0 before playing
        audioRef.current.currentTime = 0;
        
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
          // Start animation when playing
          animationRef.current = requestAnimationFrame(updateProgress);
        }
      }
    } catch (err) {
      let errorMessage = 'Failed to play audio';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Audio playback requires user interaction. Please try clicking the play button again.';
        } else if (err.name === 'AbortError') {
          errorMessage = 'Audio playback was interrupted. Please try again.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Audio loading timed out. The WAV file may be incompatible. Try using MP3 format instead.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  // Handle mute toggle
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Handle audio end
  const handleEnded = () => {
    // Stop animation when audio ends
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // Handle audio error
  const handleError = () => {
    const isWav = audioUrl.toLowerCase().includes('.wav');
    let errorMessage = 'Failed to load audio file';
    
    if (audioRef.current?.error) {
      const error = audioRef.current.error;
      if (error.code === MediaError.MEDIA_ERR_DECODE && isWav) {
        errorMessage = 'WAV format is not supported by your browser. Please use MP3 format for better compatibility.';
      } else {
        errorMessage = `Audio error: ${error.message || 'Media failed to decode'}`;
      }
    }
    
    setError(errorMessage);
    setIsLoading(false);
    onError?.(errorMessage);
  };

  // Format time in MM:SS format
  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Download audio file
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = title ? `${title}.${audioUrl.split('.').pop()}` : `audio.${audioUrl.split('.').pop()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    const isWavError = error.includes('WAV format is not supported');
    
    return (
      <div className={`bg-red-500/10 border border-red-500/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-500">{error}</p>
            {isWavError && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-red-400">
                  Suggestion: Generate a new audio file using MP3 format instead.
                </p>
                <a
                  href={audioUrl}
                  download
                  className="inline-flex items-center text-xs text-red-600 hover:text-red-800 underline"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download WAV file anyway
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-lg border border-border/50 backdrop-blur-sm p-6 ${className}`}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        preload="auto"
        crossOrigin="anonymous"
        controls={false}
      />

      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center text-muted-foreground">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mr-3"></div>
            <span>Loading audio...</span>
          </div>
        </div>
      )}

      {/* Player Controls */}
      {!isLoading && (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="relative">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 slider-progress cursor-pointer"
                style={progressStyle}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-between">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* Volume Control */}
            <div className="flex items-center space-x-3 flex-1 max-w-xs ml-6">
              <button
                onClick={toggleMute}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${(isMuted ? 0 : volume) * 100}%, var(--muted) ${(isMuted ? 0 : volume) * 100}%, var(--muted) 100%)`
                  }}
                />
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="ml-4 p-2 text-muted-foreground hover:text-foreground border border-border/50 rounded-lg hover:bg-muted/50 transition-all duration-200"
              title="Download audio"
            >
              <Download className="w-5 h-5" />
            </button>
            
            {/* Direct Link Test */}
            <a
              href={audioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 p-2 text-muted-foreground hover:text-foreground border border-border/50 rounded-lg hover:bg-muted/50 transition-all duration-200 text-xs"
              title="Open audio in new tab"
            >
              🔗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}