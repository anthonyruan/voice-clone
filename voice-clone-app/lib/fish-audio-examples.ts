// Example usage of Fish Audio API wrapper

import { 
  FishAudioClient, 
  createVoiceModel, 
  textToSpeech, 
  textToSpeechWithModel,
  textToSpeechWithReference 
} from './fish-audio';

/**
 * Example: Create a voice model from audio files
 */
export async function createVoiceModelExample() {
  // Example assumes you have File objects from file inputs
  const voiceFiles: File[] = []; // Add your audio files here
  const texts = [
    "Hello, this is my voice sample one.",
    "This is another voice sample for training."
  ];

  try {
    const model = await createVoiceModel({
      title: "My Custom Voice",
      description: "A cloned voice model",
      voices: voiceFiles,
      texts: texts,
      visibility: 'private',
      train_mode: 'fast',
      enhance_audio_quality: true
    });

    console.log('Voice model created:', model);
    return model;
  } catch (error) {
    console.error('Failed to create voice model:', error);
    throw error;
  }
}

/**
 * Example: Generate speech with a trained model
 */
export async function generateSpeechWithModel(modelId: string, text: string) {
  try {
    const audioData = await textToSpeechWithModel(text, modelId, {
      format: 'mp3',
      mp3_bitrate: 128,
      temperature: 0.7,
      top_p: 0.7,
      prosody: {
        speed: 1.0,
        volume: 0
      }
    });

    // Create a downloadable blob
    const audioBlob = FishAudioClient.createAudioBlob(audioData, 'audio/mp3');
    const audioUrl = FishAudioClient.createAudioUrl(audioData, 'audio/mp3');

    console.log('Audio generated successfully');
    return { audioData, audioBlob, audioUrl };
  } catch (error) {
    console.error('Failed to generate speech:', error);
    throw error;
  }
}

/**
 * Example: Generate speech with reference audio
 */
export async function generateSpeechWithReference(
  text: string, 
  referenceAudioFile: File, 
  referenceText: string
) {
  try {
    // Convert file to Uint8Array
    const referenceAudio = await FishAudioClient.fileToUint8Array(referenceAudioFile);

    const audioData = await textToSpeechWithReference(
      text, 
      referenceAudio, 
      referenceText,
      {
        format: 'mp3',
        mp3_bitrate: 128,
        normalize: true,
        latency: 'normal'
      }
    );

    // Create downloadable URL
    const audioUrl = FishAudioClient.createAudioUrl(audioData, 'audio/mp3');

    console.log('Audio generated with reference successfully');
    return { audioData, audioUrl };
  } catch (error) {
    console.error('Failed to generate speech with reference:', error);
    throw error;
  }
}

/**
 * Example: Basic TTS without voice cloning
 */
export async function basicTextToSpeech(text: string) {
  try {
    const audioData = await textToSpeech({
      text,
      format: 'mp3',
      mp3_bitrate: 128,
      chunk_length: 200,
      normalize: true,
      latency: 'normal'
    });

    const audioUrl = FishAudioClient.createAudioUrl(audioData, 'audio/mp3');

    console.log('Basic TTS generated successfully');
    return { audioData, audioUrl };
  } catch (error) {
    console.error('Failed to generate basic TTS:', error);
    throw error;
  }
}

/**
 * Example: List all voice models
 */
export async function listVoiceModels() {
  const client = new FishAudioClient();
  
  try {
    const models = await client.getModels();
    console.log('Available voice models:', models);
    return models;
  } catch (error) {
    console.error('Failed to list voice models:', error);
    throw error;
  }
}

/**
 * Example: Get model details
 */
export async function getModelDetails(modelId: string) {
  const client = new FishAudioClient();
  
  try {
    const model = await client.getModel(modelId);
    console.log('Model details:', model);
    return model;
  } catch (error) {
    console.error('Failed to get model details:', error);
    throw error;
  }
}

/**
 * Example: Delete a voice model
 */
export async function deleteVoiceModel(modelId: string) {
  const client = new FishAudioClient();
  
  try {
    await client.deleteModel(modelId);
    console.log('Model deleted successfully');
    return true;
  } catch (error) {
    console.error('Failed to delete model:', error);
    throw error;
  }
}

/**
 * Example: Handle file input from HTML form
 */
export function handleFileInput(files: FileList | null): File[] {
  if (!files) return [];
  
  const audioFiles: File[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Check if it's an audio file
    if (file.type.startsWith('audio/')) {
      audioFiles.push(file);
    } else {
      console.warn(`Skipping non-audio file: ${file.name}`);
    }
  }
  
  return audioFiles;
}

/**
 * Example: Play audio in browser
 */
export function playAudio(audioData: Uint8Array, mimeType: string = 'audio/mp3') {
  const audioUrl = FishAudioClient.createAudioUrl(audioData, mimeType);
  const audio = new Audio(audioUrl);
  
  audio.play().catch(error => {
    console.error('Failed to play audio:', error);
  });
  
  // Clean up URL when audio ends
  audio.addEventListener('ended', () => {
    URL.revokeObjectURL(audioUrl);
  });
  
  return audio;
}

/**
 * Example: Download audio file
 */
export function downloadAudio(
  audioData: Uint8Array, 
  filename: string = 'generated-audio.mp3',
  mimeType: string = 'audio/mp3'
) {
  const audioBlob = FishAudioClient.createAudioBlob(audioData, mimeType);
  const audioUrl = URL.createObjectURL(audioBlob);
  
  const downloadLink = document.createElement('a');
  downloadLink.href = audioUrl;
  downloadLink.download = filename;
  downloadLink.style.display = 'none';
  
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  
  // Clean up URL
  URL.revokeObjectURL(audioUrl);
}