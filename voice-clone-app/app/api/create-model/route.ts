import { NextRequest } from 'next/server';
import { getDB } from '@/lib/db';
import { createFishAudioClient } from '@/lib/fish-audio';
import { handleCorsOptions, createCorsResponse } from '@/lib/cors';
import { sanitizeErrorMessage, sanitizeTextInput, validateAudioFile, checkRateLimit, getClientIP } from '@/lib/security';
import { getMaxFileSizeBytes } from '@/lib/config';
import { promises as fs } from 'fs';
// path import removed as it's not used

// Interface for the request body
interface CreateModelRequestBody {
  name: string;
  description?: string;
}

// Helper function to parse form data with file uploads using native FormData
async function parseFormData(request: NextRequest): Promise<{
  fields: CreateModelRequestBody;
  files: { audio?: { filepath: string; originalFilename?: string; mimetype?: string; size: number } };
}> {
  try {
    const formData = await request.formData();
    
    // Extract fields
    const name = formData.get('name')?.toString() || '';
    const description = formData.get('description')?.toString();
    
    // Extract audio file
    const audioFile = formData.get('audio') as File | null;
    
    if (!audioFile) {
      return {
        fields: {
          name: sanitizeTextInput(name),
          description: description ? sanitizeTextInput(description) : undefined,
        },
        files: {}
      };
    }

    // Check file size
    if (audioFile.size > getMaxFileSizeBytes()) {
      throw new Error(`File size exceeds maximum allowed size of ${getMaxFileSizeBytes() / (1024 * 1024)}MB`);
    }

    // Check file type
    if (!audioFile.type.startsWith('audio/')) {
      throw new Error('File is not a valid audio format');
    }

    // Create temporary file
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const tempFilePath = `/tmp/upload_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    await fs.writeFile(tempFilePath, buffer);

    return {
      fields: {
        name: sanitizeTextInput(name),
        description: description ? sanitizeTextInput(description) : undefined,
      },
      files: {
        audio: {
          filepath: tempFilePath,
          originalFilename: audioFile.name,
          mimetype: audioFile.type,
          size: audioFile.size
        }
      }
    };
  } catch (error) {
    throw new Error(`Failed to parse form data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * POST /api/create-model
 * 
 * Creates a new voice model by uploading audio file and processing with Fish Audio API
 * Expects multipart/form-data with:
 * - name: string (required) - Name of the voice model
 * - description: string (optional) - Description of the voice model  
 * - audio: File (required) - Audio file for voice cloning
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP, 5, 60000); // 5 requests per minute
    
    if (!rateLimit.allowed) {
      return createCorsResponse({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      }, { status: 429, origin });
    }
    // Parse the multipart form data
    const { fields, files } = await parseFormData(request);
    
    // Validate required fields
    if (!fields.name || fields.name.length < 1) {
      return createCorsResponse({
        success: false,
        error: 'Validation failed',
        message: 'Name is required and must not be empty'
      }, { status: 400, origin });
    }

    if (fields.name.length > 100) {
      return createCorsResponse({
        success: false,
        error: 'Validation failed',
        message: 'Name must be less than 100 characters'
      }, { status: 400, origin });
    }

    if (!files.audio) {
      return createCorsResponse({
        success: false,
        error: 'Validation failed',
        message: 'Audio file is required'
      }, { status: 400, origin });
    }

    // Validate audio file using magic numbers
    const audioValidation = await validateAudioFile(files.audio.filepath);
    if (!audioValidation.isValid) {
      // Clean up uploaded file
      try {
        await fs.unlink(files.audio.filepath);
      } catch {}
      
      return createCorsResponse({
        success: false,
        error: 'Invalid file format',
        message: audioValidation.error || 'File is not a valid audio format'
      }, { status: 400, origin });
    }

    // Check if model with same name already exists
    const db = getDB();
    const existingModel = db.getModelByName(fields.name);
    
    if (existingModel) {
      return createCorsResponse({
        success: false,
        error: 'Model already exists',
        message: 'A voice model with this name already exists'
      }, { status: 409, origin });
    }

    // Read the uploaded audio file
    const audioBuffer = await fs.readFile(files.audio.filepath);
    
    // Use detected format from validation
    const audioFormat = audioValidation.detectedFormat || 'wav';
    
    // Note: sanitized filename could be used for logging or metadata storage
    // const sanitizedFilename = sanitizeFileName(files.audio.originalFilename || 'audio');

    // Initialize Fish Audio client
    const fishAudioClient = createFishAudioClient();
    
    // Create voice clone using Fish Audio API
    const cloneResponse = await fishAudioClient.cloneVoice({
      name: fields.name,
      description: fields.description,
      audioData: audioBuffer,
      audioFormat: audioFormat,
    });

    // Validate the response before saving to database
    if (!cloneResponse || !cloneResponse.id) {
      throw new Error('Fish Audio API did not return a valid model ID');
    }

    // Save model information to database
    const newModel = db.createModel({
      name: fields.name,
      description: fields.description,
      fishAudioId: cloneResponse.id,
    });

    // Clean up temporary file
    try {
      await fs.unlink(files.audio.filepath);
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file:', cleanupError);
    }

    return createCorsResponse({
      success: true,
      data: {
        model: newModel,
        cloneStatus: {
          status: cloneResponse.status,
          message: cloneResponse.message,
        }
      },
      message: 'Voice model created successfully'
    }, { status: 201, origin });

  } catch (error) {
    console.error('Error creating voice model:', error);
    
    // Handle specific error types with sanitized messages
    if (error instanceof Error) {
      if (error.message.includes('Fish Audio API')) {
        return createCorsResponse({
          success: false,
          error: 'External API error',
          message: 'Failed to process voice cloning with external service'
        }, { status: 502, origin });
      }
      
      if (error.message.includes('UNIQUE constraint')) {
        return createCorsResponse({
          success: false,
          error: 'Model already exists',
          message: 'A voice model with this name already exists'
        }, { status: 409, origin });
      }
      
      if (error.message.includes('maxFileSize')) {
        return createCorsResponse({
          success: false,
          error: 'File too large',
          message: `File size exceeds maximum allowed size of ${getMaxFileSizeBytes() / (1024 * 1024)}MB`
        }, { status: 413, origin });
      }
    }
    
    return createCorsResponse({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create voice model',
      details: sanitizeErrorMessage(error)
    }, { status: 500, origin });
  }
}

/**
 * OPTIONS /api/create-model
 * 
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsOptions(origin);
}