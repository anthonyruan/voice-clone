import { NextRequest } from 'next/server';
import { getDB } from '@/lib/db';
import { createFishAudioClient } from '@/lib/fish-audio';
import { handleCorsOptions, createCorsResponse } from '@/lib/cors';
import { sanitizeErrorMessage, sanitizeTextInput, checkRateLimit, getClientIP } from '@/lib/security';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Interface for the request body
interface TTSRequestBody {
  text: string;
  modelId?: string;
  modelName?: string;
  format?: 'wav' | 'mp3';
  speed?: number;
}

// Validation function
function validateTTSRequest(body: TTSRequestBody): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body.text || typeof body.text !== 'string' || body.text.trim().length === 0) {
    errors.push('Text is required and must be a non-empty string');
  }
  
  // Additional validation for malicious content
  if (body.text && body.text.includes('<script')) {
    errors.push('Text contains potentially malicious content');
  }

  if (body.text && body.text.length > 5000) {
    errors.push('Text must be less than 5000 characters');
  }

  if (!body.modelId && !body.modelName) {
    errors.push('Either modelId or modelName must be provided');
  }

  if (body.modelId && (typeof body.modelId !== 'string' || body.modelId.trim().length === 0)) {
    errors.push('modelId must be a non-empty string');
  }

  if (body.format && !['wav', 'mp3'].includes(body.format)) {
    errors.push('Format must be either "wav" or "mp3"');
  }

  if (body.speed && (typeof body.speed !== 'number' || body.speed <= 0 || body.speed > 3)) {
    errors.push('Speed must be a number between 0 and 3');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * POST /api/tts
 * 
 * Generates speech from text using a specified voice model
 * Request body:
 * - text: string (required) - Text to convert to speech
 * - modelId: number (optional) - Database ID of the voice model
 * - modelName: string (optional) - Name of the voice model
 * - format: 'wav' | 'mp3' (optional, default: 'wav') - Output audio format
 * - speed: number (optional, default: 1.0) - Speech speed multiplier
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP, 10, 60000); // 10 requests per minute
    
    if (!rateLimit.allowed) {
      return createCorsResponse({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      }, { status: 429, origin });
    }
    // Parse request body
    const body: TTSRequestBody = await request.json();
    
    // Sanitize text input
    if (body.text) {
      body.text = sanitizeTextInput(body.text);
    }
    
    // Validate request
    const validation = validateTTSRequest(body);
    if (!validation.isValid) {
      return createCorsResponse({
        success: false,
        error: 'Validation failed',
        message: 'Invalid request parameters',
        details: validation.errors
      }, { status: 400, origin });
    }

    // Get voice model from database
    const db = getDB();
    let voiceModel;

    if (body.modelId) {
      voiceModel = db.getModelById(body.modelId);
    } else if (body.modelName) {
      voiceModel = db.getModelByName(body.modelName);
    }

    if (!voiceModel) {
      return createCorsResponse({
        success: false,
        error: 'Model not found',
        message: 'The specified voice model was not found'
      }, { status: 404, origin });
    }

    if (!voiceModel.fish_model_id) {
      return createCorsResponse({
        success: false,
        error: 'Model not ready',
        message: 'Voice model is not ready for use'
      }, { status: 400, origin });
    }

    // Initialize Fish Audio client
    const fishAudioClient = createFishAudioClient();
    
    // Generate speech using Fish Audio API
    const ttsResponse = await fishAudioClient.generateSpeech({
      text: body.text.trim(),
      voiceId: voiceModel.fish_model_id,
      format: body.format || 'wav',
      speed: body.speed || 1.0,
    });

    // Handle different response types from Fish Audio API
    if (ttsResponse.audioData) {
      // Save audio file to public/audio directory
      const filename = `tts_${randomUUID()}.${body.format || 'wav'}`;
      const audioPath = path.join(process.cwd(), 'public', 'audio', filename);
      
      await fs.writeFile(audioPath, ttsResponse.audioData);
      
      // Return success response with local file URL
      return createCorsResponse({
        success: true,
        data: {
          audioUrl: `/audio/${filename}`,
          format: ttsResponse.format,
          duration: ttsResponse.duration,
          text: body.text.trim(),
          modelUsed: {
            id: voiceModel.id,
            title: voiceModel.title,
          }
        },
        message: 'Speech generated successfully'
      }, { status: 200, origin });
      
    } else if (ttsResponse.audioUrl) {
      // Return success response with external URL
      return createCorsResponse({
        success: true,
        data: {
          audioUrl: ttsResponse.audioUrl,
          format: ttsResponse.format,
          duration: ttsResponse.duration,
          text: body.text.trim(),
          modelUsed: {
            id: voiceModel.id,
            title: voiceModel.title,
          }
        },
        message: 'Speech generated successfully'
      }, { status: 200, origin });
      
    } else {
      throw new Error('No audio data received from Fish Audio API');
    }

  } catch (error) {
    console.error('Error generating speech:', error);
    
    // Handle specific error types with sanitized messages
    if (error instanceof Error) {
      // Handle JSON parsing errors
      if (error.message.includes('JSON')) {
        return createCorsResponse({
          success: false,
          error: 'Invalid request format',
          message: 'Request body must be valid JSON'
        }, { status: 400, origin });
      }
      
      // Handle Fish Audio API errors
      if (error.message.includes('Fish Audio API')) {
        return createCorsResponse({
          success: false,
          error: 'External API error',
          message: 'Failed to generate speech with external service'
        }, { status: 502, origin });
      }
      
      // Handle file system errors
      if (error.message.includes('ENOENT') || error.message.includes('permission')) {
        return createCorsResponse({
          success: false,
          error: 'File system error',
          message: 'Failed to save generated audio file'
        }, { status: 500, origin });
      }
    }
    
    return createCorsResponse({
      success: false,
      error: 'Internal server error',
      message: 'Failed to generate speech',
      details: sanitizeErrorMessage(error)
    }, { status: 500, origin });
  }
}

/**
 * OPTIONS /api/tts
 * 
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsOptions(origin);
}