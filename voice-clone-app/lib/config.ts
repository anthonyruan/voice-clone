import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  FISH_AUDIO_API_KEY: z.string().min(1, 'FISH_AUDIO_API_KEY is required'),
  CORS_ALLOWED_ORIGINS: z.string().optional().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MAX_FILE_SIZE_MB: z.coerce.number().min(1).max(50).default(10),
});

// Validation error class
export class ConfigValidationError extends Error {
  constructor(message: string, public errors: z.ZodError) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

// Validate environment variables
export function validateConfig() {
  try {
    const config = envSchema.parse(process.env);
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      ).join('\n');
      
      throw new ConfigValidationError(
        `Environment variable validation failed:\n${errorMessages}`,
        error
      );
    }
    throw error;
  }
}

// Get validated configuration
export const config = (() => {
  try {
    return validateConfig();
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      console.error('Configuration Error:', error.message);
      process.exit(1);
    }
    throw error;
  }
})();

// CORS configuration helper
export function getCorsOrigins(): string[] {
  const origins = config.CORS_ALLOWED_ORIGINS;
  if (!origins) return [];
  
  return origins
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
}

// File size helper
export function getMaxFileSizeBytes(): number {
  return config.MAX_FILE_SIZE_MB * 1024 * 1024;
}

export default config;