import { promises as fs } from 'fs';

/**
 * Sanitize error messages to prevent information disclosure
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Remove file paths and sensitive information
    let message = error.message;
    
    // Remove file system paths
    message = message.replace(/\/[^\s]*\/[^\s]*/g, '[FILE_PATH]');
    
    // Remove stack traces
    message = message.split('\n')[0];
    
    // Remove specific API keys or tokens that might leak
    message = message.replace(/[a-f0-9]{32,}/gi, '[TOKEN]');
    
    return message;
  }
  return 'An unknown error occurred';
}

/**
 * Sanitize text input to prevent XSS and injection attacks
 */
export function sanitizeTextInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 5000); // Limit length
}

/**
 * Validate file name to prevent path traversal
 */
export function sanitizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') return 'unknown';
  
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe characters
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255); // Limit length
}

/**
 * Audio file magic numbers for validation
 */
const AUDIO_MAGIC_NUMBERS = {
  // WAV files
  wav: [0x52, 0x49, 0x46, 0x46], // "RIFF"
  // MP3 files
  mp3: [0xFF, 0xFB], // MP3 frame sync (most common)
  mp3_alt1: [0xFF, 0xFA], // MP3 frame sync (alternative)
  mp3_alt2: [0x49, 0x44, 0x33], // "ID3" tag
  // OGG files
  ogg: [0x4F, 0x67, 0x67, 0x53], // "OggS"
  // FLAC files
  flac: [0x66, 0x4C, 0x61, 0x43], // "fLaC"
  // M4A/AAC files
  m4a: [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], // MP4 container
};

/**
 * Validate audio file by checking magic numbers
 */
export async function validateAudioFile(filePath: string): Promise<{
  isValid: boolean;
  detectedFormat?: string;
  error?: string;
}> {
  try {
    const buffer = await fs.readFile(filePath);
    
    if (buffer.length < 8) {
      return { isValid: false, error: 'File too small to be a valid audio file' };
    }

    // Check for WAV
    if (buffer.subarray(0, 4).equals(Buffer.from(AUDIO_MAGIC_NUMBERS.wav))) {
      return { isValid: true, detectedFormat: 'wav' };
    }

    // Check for MP3
    const firstTwoBytes = buffer.subarray(0, 2);
    if (firstTwoBytes.equals(Buffer.from(AUDIO_MAGIC_NUMBERS.mp3)) ||
        firstTwoBytes.equals(Buffer.from(AUDIO_MAGIC_NUMBERS.mp3_alt1))) {
      return { isValid: true, detectedFormat: 'mp3' };
    }

    // Check for ID3 tag (MP3)
    if (buffer.subarray(0, 3).equals(Buffer.from(AUDIO_MAGIC_NUMBERS.mp3_alt2))) {
      return { isValid: true, detectedFormat: 'mp3' };
    }

    // Check for OGG
    if (buffer.subarray(0, 4).equals(Buffer.from(AUDIO_MAGIC_NUMBERS.ogg))) {
      return { isValid: true, detectedFormat: 'ogg' };
    }

    // Check for FLAC
    if (buffer.subarray(0, 4).equals(Buffer.from(AUDIO_MAGIC_NUMBERS.flac))) {
      return { isValid: true, detectedFormat: 'flac' };
    }

    // Check for M4A (basic check)
    if (buffer.length >= 8 && buffer.subarray(4, 8).toString() === 'ftyp') {
      return { isValid: true, detectedFormat: 'm4a' };
    }

    return { isValid: false, error: 'File does not appear to be a valid audio format' };
    
  } catch (error) {
    return { 
      isValid: false, 
      error: `Failed to validate file: ${sanitizeErrorMessage(error)}` 
    };
  }
}

/**
 * Rate limiting in-memory store (for basic protection)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiting check
 */
export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    // Reset or create new entry
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, resetTime: entry.resetTime };
  }

  // Increment counter
  entry.count++;
  return { allowed: true };
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}