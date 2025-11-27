
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

let ai: GoogleGenAI | null = null;

// Safe accessor for API Key that prevents ReferenceError in browsers
const getApiKey = (): string | undefined => {
  try {
    // Check if process exists safely (Node.js/Webpack envs)
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore ReferenceError
  }
  return undefined;
};

const getAiClient = (): GoogleGenAI | null => {
  if (ai) return ai;
  
  const key = getApiKey();
  if (key) {
    try {
      ai = new GoogleGenAI({ apiKey: key });
    } catch (e) {
      console.warn("Failed to initialize GoogleGenAI client", e);
    }
  }
  return ai;
};

export const createOracleChat = (): Chat | null => {
  const client = getAiClient();
  if (!client) return null;

  try {
    return client.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: 'You are "Oracle", a high-level system AI for Project Blue. You are helpful, concise, and speak with a slightly robotic, secure-terminal tone. Keep answers brief. Do not output internal thought traces or reasoning steps.',
      },
    });
  } catch (e) {
    console.error("Failed to create chat session", e);
    return null;
  }
};

export const sendMessageToOracle = async (chat: Chat, message: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await chat.sendMessage({ message });
    return response.text || "System Error: No text response received.";
  } catch (error) {
    console.error("Oracle Connection Failure:", error);
    return "Connection Lost. Secure channel unavailable.";
  }
};