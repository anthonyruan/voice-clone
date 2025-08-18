import * as msgpack from 'msgpack-js';

// Types for Fish Audio API
export interface ReferenceAudio {
  audio: Uint8Array;
  text: string;
}

export interface TTSRequest {
  text: string;
  chunk_length?: number; // 100-300, default 200
  format?: 'wav' | 'pcm' | 'mp3'; // default 'mp3'
  mp3_bitrate?: 64 | 128 | 192; // default 128
  references?: ReferenceAudio[];
  reference_id?: string;
  normalize?: boolean; // default true
  latency?: 'normal' | 'balanced'; // default 'normal'
  temperature?: number; // Controls randomness, default 0.7
  top_p?: number; // Controls diversity, default 0.7
  prosody?: {
    speed?: number; // 0.5-2.0, default 1.0
    volume?: number; // dB adjustment, default 0
  };
}

export interface CreateVoiceModelRequest {
  title: string;
  description?: string;
  visibility?: 'public' | 'private'; // default 'private'
  type?: 'tts'; // default 'tts'
  train_mode?: 'fast' | 'full'; // default 'fast'
  enhance_audio_quality?: boolean; // default true
  voices: File[];
  texts: string[];
  cover_image?: File;
}

export interface VoiceModel {
  _id: string;
  title: string;
  description: string;
  visibility: string;
  type: string;
  created_at: string;
  updated_at: string;
  state: 'pending' | 'training' | 'trained' | 'failed';
  cover_image: string;
  train_mode: string;
  tags: string[];
  samples: any[];
  languages: string[];
  lock_visibility: boolean;
  default_text: string;
  like_count: number;
  mark_count: number;
  shared_count: number;
  task_count: number;
  unliked: boolean;
  liked: boolean;
  marked: boolean;
  author: {
    _id: string;
    nickname: string;
    avatar: string;
  };
}

export interface TTSResponse {
  audio: Uint8Array;
}

export interface ApiError {
  error: string;
  message: string;
  status: number;
}

// Fish Audio API Client
export class FishAudioClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.fish.audio';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FISH_AUDIO_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Fish Audio API key is required. Set FISH_AUDIO_API_KEY environment variable or pass it to constructor.');
    }
    
    // Basic API key validation
    if (this.apiKey.length < 10) {
      throw new Error('Invalid Fish Audio API key format.');
    }
  }

  private getHeaders(contentType: string = 'application/json'): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': contentType,
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    } else {
      // For binary data (audio)
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer) as unknown as T;
    }
  }

  /**
   * Create a voice model for cloning
   */
  async createVoiceModel(request: CreateVoiceModelRequest): Promise<VoiceModel> {
    const formData = new FormData();
    
    // Add basic fields
    formData.append('title', request.title);
    if (request.description) {
      formData.append('description', request.description);
    }
    formData.append('visibility', request.visibility || 'private');
    formData.append('type', request.type || 'tts');
    formData.append('train_mode', request.train_mode || 'fast');
    formData.append('enhance_audio_quality', String(request.enhance_audio_quality !== false));

    // Add voice files
    request.voices.forEach((voice) => {
      formData.append('voices', voice);
    });

    // Add corresponding texts
    request.texts.forEach((text) => {
      formData.append('texts', text);
    });

    // Add cover image if provided
    if (request.cover_image) {
      formData.append('cover_image', request.cover_image);
    }

    const response = await fetch(`${this.baseUrl}/model`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        // Don't set Content-Type for FormData, let the browser set it with boundary
      },
      body: formData,
    });

    return this.handleResponse<VoiceModel>(response);
  }

  /**
   * Generate speech from text using Fish Audio TTS
   */
  async textToSpeech(request: TTSRequest, model: string = 'speech-1.6'): Promise<Uint8Array> {
    // Prepare the request data
    const ttsData: any = {
      text: request.text,
      chunk_length: request.chunk_length || 200,
      format: request.format || 'mp3',
      references: request.references || [],
      normalize: request.normalize !== false,
      latency: request.latency || 'normal',
    };

    // Add format-specific parameters
    if (request.format === 'mp3') {
      ttsData.mp3_bitrate = request.mp3_bitrate || 128;
    }

    // Only add fields if they are defined
    if (request.reference_id) {
      ttsData.reference_id = request.reference_id;
    }
    if (request.temperature !== undefined) {
      ttsData.temperature = request.temperature;
    }
    if (request.top_p !== undefined) {
      ttsData.top_p = request.top_p;
    }
    if (request.prosody) {
      ttsData.prosody = request.prosody;
    }

    // Pack the data using msgpack
    const encodedData = msgpack.encode(ttsData);
    
    const response = await fetch(`${this.baseUrl}/v1/tts`, {
      method: 'POST',
      headers: {
        ...this.getHeaders('application/msgpack'),
        'model': model,
      },
      body: encodedData,
    });

    return this.handleResponse<Uint8Array>(response);
  }

  /**
   * Generate speech using a reference audio file and text
   */
  async textToSpeechWithReference(
    text: string,
    referenceAudio: Uint8Array,
    referenceText: string,
    options: Partial<TTSRequest> = {}
  ): Promise<Uint8Array> {
    const request: TTSRequest = {
      text,
      references: [
        {
          audio: referenceAudio,
          text: referenceText,
        },
      ],
      ...options,
    };

    return this.textToSpeech(request);
  }

  /**
   * Generate speech using a pre-trained voice model
   */
  async textToSpeechWithModel(
    text: string,
    modelId: string,
    options: Partial<TTSRequest> = {}
  ): Promise<Uint8Array> {
    const request: TTSRequest = {
      text,
      reference_id: modelId,
      ...options,
    };

    return this.textToSpeech(request);
  }

  /**
   * Get list of available voice models
   */
  async getModels(): Promise<VoiceModel[]> {
    const response = await fetch(`${this.baseUrl}/model`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<VoiceModel[]>(response);
  }

  /**
   * Get details of a specific voice model
   */
  async getModel(modelId: string): Promise<VoiceModel> {
    const response = await fetch(`${this.baseUrl}/model/${modelId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<VoiceModel>(response);
  }

  /**
   * Delete a voice model
   */
  async deleteModel(modelId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/model/${modelId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    await this.handleResponse<void>(response);
  }

  /**
   * Convert audio file to Uint8Array for use in API calls
   */
  static async fileToUint8Array(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(reader.result));
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Create a downloadable blob from audio data
   */
  static createAudioBlob(audioData: Uint8Array, mimeType: string = 'audio/mp3'): Blob {
    return new Blob([new Uint8Array(audioData)], { type: mimeType });
  }

  /**
   * Create a download URL for audio data
   */
  static createAudioUrl(audioData: Uint8Array, mimeType: string = 'audio/mp3'): string {
    const blob = this.createAudioBlob(audioData, mimeType);
    return URL.createObjectURL(blob);
  }
}

// Interface for cloning voice
interface CloneVoiceRequest {
  name: string;
  description?: string;
  audioData: Buffer;
  audioFormat: string;
}

interface CloneVoiceResponse {
  id: string;
  status: string;
  message: string;
}

// Interface for generating speech
interface GenerateSpeechRequest {
  text: string;
  voiceId: string;
  format: string;
  speed: number;
}

interface GenerateSpeechResponse {
  audioData?: Buffer;
  audioUrl?: string;
  format: string;
  duration?: number;
}

// Wrapper client for API routes compatibility
export class VoiceCloneClient {
  private fishAudio: FishAudioClient;

  constructor() {
    this.fishAudio = new FishAudioClient();
  }

  async cloneVoice(request: CloneVoiceRequest): Promise<CloneVoiceResponse> {
    try {
      // Convert Buffer to File for Fish Audio API
      const audioFile = new File([new Uint8Array(request.audioData)], `voice.${request.audioFormat}`, {
        type: `audio/${request.audioFormat}`
      });

      const voiceModel = await this.fishAudio.createVoiceModel({
        title: request.name,
        description: request.description,
        voices: [audioFile],
        texts: ["Sample text for voice training"], // Default text
        visibility: 'private',
        train_mode: 'fast'
      });

      return {
        id: voiceModel._id,
        status: voiceModel.state,
        message: `Voice model "${request.name}" created successfully`
      };
    } catch (error) {
      console.error('Fish Audio API error in cloneVoice:', error);
      throw new Error(`Fish Audio API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateSpeech(request: GenerateSpeechRequest): Promise<GenerateSpeechResponse> {
    try {
      const audioData = await this.fishAudio.textToSpeechWithModel(request.text, request.voiceId, {
        format: request.format as 'wav' | 'mp3',
        prosody: {
          speed: request.speed
        }
      });

      return {
        audioData: Buffer.from(audioData),
        format: request.format,
        duration: 0 // Fish Audio doesn't provide duration, would need to calculate
      };
    } catch (error) {
      throw new Error(`Fish Audio API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Convenience functions for easy usage
export const fishAudio = new FishAudioClient();

/**
 * Create a Fish Audio client for voice cloning API routes
 */
export function createFishAudioClient(): VoiceCloneClient {
  return new VoiceCloneClient();
}

/**
 * Create a voice model for cloning
 */
export async function createVoiceModel(request: CreateVoiceModelRequest): Promise<VoiceModel> {
  return fishAudio.createVoiceModel(request);
}

/**
 * Generate speech from text
 */
export async function textToSpeech(request: TTSRequest, model?: string): Promise<Uint8Array> {
  return fishAudio.textToSpeech(request, model);
}

/**
 * Generate speech using a reference audio file
 */
export async function textToSpeechWithReference(
  text: string,
  referenceAudio: Uint8Array,
  referenceText: string,
  options?: Partial<TTSRequest>
): Promise<Uint8Array> {
  return fishAudio.textToSpeechWithReference(text, referenceAudio, referenceText, options);
}

/**
 * Generate speech using a pre-trained voice model
 */
export async function textToSpeechWithModel(
  text: string,
  modelId: string,
  options?: Partial<TTSRequest>
): Promise<Uint8Array> {
  return fishAudio.textToSpeechWithModel(text, modelId, options);
}

export default FishAudioClient;