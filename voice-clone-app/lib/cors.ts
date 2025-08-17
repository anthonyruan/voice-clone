import { NextResponse } from 'next/server';
import { getCorsOrigins } from './config';

/**
 * CORS headers configuration
 */
export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigins = getCorsOrigins();
  
  // In development, allow localhost origins
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isOriginAllowed = origin && (
    allowedOrigins.includes(origin) || 
    (isDevelopment && origin.startsWith('http://localhost'))
  );

  return {
    'Access-Control-Allow-Origin': isOriginAllowed ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsOptions(origin?: string | null): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(origin),
  });
}

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders(response: NextResponse, origin?: string | null): NextResponse {
  const corsHeaders = getCorsHeaders(origin);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Create a JSON response with CORS headers
 */
export function createCorsResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  options: { status?: number; origin?: string | null } = {}
): NextResponse {
  const { status = 200, origin } = options;
  
  const response = NextResponse.json(data, { status });
  return addCorsHeaders(response, origin);
}