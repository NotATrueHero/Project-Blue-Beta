
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI | null => {
  if (ai) return ai;
  
  // Safe check for process.env to prevent crashes in browsers where process is undefined
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      // @ts-ignore
      ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
  } catch (e) {
    console.warn("Environment check failed during AI initialization", e);
  }
  return ai;
};

export const createOracleChat = (): Chat | null => {
  const client = getAiClient();
  if (!client) return null;

  return client.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: 'You are "Oracle", a high-level system AI for Project Blue. You are helpful, concise, and speak with a slightly robotic, secure-terminal tone. Keep answers brief. Do not output internal thought traces or reasoning steps.',
    },
  });
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
