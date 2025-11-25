import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Segment, TranscriptItem, AIEditResponse } from "../types";

const env = import.meta.env as Record<string, string | undefined>;
let apiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || "";

let ai = new GoogleGenAI({ apiKey });

export const updateApiKey = (key: string) => {
  apiKey = key;
  ai = new GoogleGenAI({ apiKey });
};

export const getApiKey = () => apiKey;

// Models
const TEXT_MODEL = "gemini-2.5-flash";
const VISION_MODEL = "gemini-3-pro-preview";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

/**
 * 1. VISUAL UNDERSTANDING
 * Analyzes video frames to provide visual context.
 */
export const analyzeVisualContent = async (base64Frames: string[]): Promise<string> => {
  if (!apiKey) throw new Error("API Key not set");

  const prompt = `
    Analyze these keyframes from a video. 
    Describe the visual content, setting, colors, objects, and action. 
    Be concise but descriptive. 
    This description will be used to help edit the video based on visual cues.
  `;

  // Prepare parts: text prompt + image parts
  const parts: any[] = [{ text: prompt }];

  base64Frames.forEach(frame => {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: frame
      }
    });
  });

  try {
    const response = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: {
        role: 'user',
        parts: parts
      }
    });
    return response.text || "No visual description available.";
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return "Visual analysis failed.";
  }
};

/**
 * 2. AUDIO TRANSCRIPTION (MICROPHONE)
 * Transcribes user voice input to text.
 */
export const transcribeMicAudio = async (audioBase64: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key not set");

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: {
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'audio/wav', data: audioBase64 } },
          { text: "Transcribe this audio request exactly as spoken. Return only the text." }
        ]
      }
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini Mic Transcription Error:", error);
    throw error;
  }
};

/**
 * 3. TEXT TO SPEECH
 * Generates audio from the AI's text response.
 */
export const generateSpeech = async (text: string): Promise<ArrayBuffer | null> => {
  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: { parts: [{ text: text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    // Convert Base64 to ArrayBuffer
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;

  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return null;
  }
};

/**
 * 4. GENERATE TRANSCRIPT (VIDEO AUDIO)
 */
export const generateTranscript = async (audioBase64: string): Promise<TranscriptItem[]> => {
  if (!apiKey) throw new Error("API Key not set");

  const prompt = `
    Analyze this audio file representing the soundtrack of a video.
    
    Task:
    1. Transcribe the spoken content word-for-word.
    2. Identify distinct segments including SILENCE, MUSIC, NOISE, or SPEECH.
    3. For silence longer than 0.5 seconds, create a separate segment categorized as 'silence'.
    4. Return a JSON array.

    Schema:
    Array of objects:
    - id: number (sequential)
    - start: number (start time in seconds, precise float)
    - end: number (end time in seconds, precise float)
    - text: string (the spoken text, or description of sound like "[Silence]", "[Upbeat Music]")
    - category: enum string ('speech', 'silence', 'music', 'noise', 'intro', 'outro')
  `;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: {
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'audio/wav', data: audioBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.NUMBER },
              start: { type: Type.NUMBER },
              end: { type: Type.NUMBER },
              text: { type: Type.STRING },
              category: { type: Type.STRING, enum: ['speech', 'silence', 'music', 'noise', 'intro', 'outro'] }
            },
            required: ["id", "start", "end", "text", "category"]
          }
        }
      }
    });

    const transcript = JSON.parse(response.text || "[]") as TranscriptItem[];
    return transcript;
  } catch (error) {
    console.error("Gemini Transcription Error:", error);
    throw error;
  }
};

/**
 * 5. PROCESS VIDEO EDIT
 * Updated to include Visual Context
 */
export const processVideoEdit = async (
  transcript: TranscriptItem[],
  currentSegments: Segment[],
  userPrompt: string,
  visualDescription?: string
): Promise<AIEditResponse> => {
  if (!apiKey) throw new Error("API Key not set");

  // We provide the full context to the model
  const simplifiedTranscript = transcript.map(t =>
    `{${t.start.toFixed(2)}-${t.end.toFixed(2)}} [${t.category}]: ${t.text}`
  ).join("\n");

  const systemInstruction = `
    You are ChatCut AI, an expert video editor.
    
    Your Goal:
    Transform the video timeline based on the user's request, the audio transcript, AND visual context.
    
    Inputs:
    1. TRANSCRIPT: Time-coded segments.
    2. VISUAL CONTEXT: A summary of what is seen in the video. Use this if the user refers to visual elements (e.g., "Cut when the red car appears").
    3. CURRENT SEGMENTS: Current timeline state.
    4. USER REQUEST: The command.
    
    Instructions:
    - Return a JSON object containing a friendly 'reply' to the user and the 'editedSegments'.
    - 'editedSegments' MUST cover the entire duration. Set 'active': false to cut.
    - If the user asks to remove silence, use the transcript categories.
    - If the user asks about visual things, refer to the VISUAL CONTEXT to guess the timestamps based on the transcript timing (correlation).
    - Precision is key.
  `;

  const prompt = `
    VISUAL CONTEXT (What happens in the video):
    ${visualDescription || "No visual analysis available."}

    TRANSCRIPT DATA:
    ${simplifiedTranscript}

    CURRENT SEGMENTS:
    ${JSON.stringify(currentSegments.map(s => ({ start: s.start, end: s.end, active: s.active, desc: s.description })))}

    USER REQUEST:
    "${userPrompt}"

    Produce the JSON response.
  `;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            editedSegments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  start: { type: Type.NUMBER },
                  end: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                  active: { type: Type.BOOLEAN },
                },
                required: ["start", "end", "active", "id", "description"],
              },
            },
          },
          required: ["reply", "editedSegments"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}") as AIEditResponse;

    if (result.editedSegments) {
      result.editedSegments.sort((a, b) => a.start - b.start);
    }

    return result;

  } catch (error) {
    console.error("Gemini Edit Error:", error);
    throw error;
  }
};