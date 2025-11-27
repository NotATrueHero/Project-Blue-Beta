
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

// Initialize the client strictly according to guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const createOracleChat = (): Chat => {
  return ai.chats.create({
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
