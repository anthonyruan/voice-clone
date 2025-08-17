import { NextRequest } from 'next/server';
import { getDB } from '@/lib/db';
import { handleCorsOptions, createCorsResponse } from '@/lib/cors';
import { sanitizeErrorMessage } from '@/lib/security';

/**
 * GET /api/models
 * 
 * Returns a list of all voice models from the database
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    const db = getDB();
    const models = db.getAllModels();

    return createCorsResponse({
      success: true,
      data: models,
      count: models.length,
    }, { status: 200, origin });

  } catch (error) {
    console.error('Error fetching models:', error);
    
    return createCorsResponse({
      success: false,
      error: 'Failed to fetch voice models',
      message: sanitizeErrorMessage(error)
    }, { status: 500, origin });
  }
}

/**
 * OPTIONS /api/models
 * 
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsOptions(origin);
}