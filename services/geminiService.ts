
import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";

// Safe accessor for API Key that prevents ReferenceError in browsers
export const getApiKey = (): string | undefined => {
  // 1. Check Local Storage (User configured)
  const localKey = localStorage.getItem('blue_api_key');
  if (localKey && localKey.trim().length > 0) return localKey.trim();

  // 2. Check Environment Variables (Build time)
  try {
    // Check if process exists safely (Node.js/Webpack envs)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      // @ts-ignore
      return process.env.API_KEY.trim();
    }
  } catch (e) {
    // Ignore ReferenceError
  }
  return undefined;
};

export const createOracleChat = (): ChatSession | null => {
  const key = getApiKey();
  if (!key) return null;

  try {
    const genAI = new GoogleGenerativeAI(key);
    // Updated to gemini-2.5-flash for better performance and stability
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: 'You are "Oracle", a high-level system AI for Project Blue. You are helpful, concise, and speak with a slightly robotic, secure-terminal tone. Keep answers brief. Do not output internal thought traces or reasoning steps.',
    });
    
    return model.startChat({
        history: [],
        generationConfig: {
            maxOutputTokens: 1000,
        }
    });
  } catch (e) {
    console.error("Failed to create chat session", e);
    return null;
  }
};

export const sendMessageToOracle = async (chat: ChatSession, message: string): Promise<string> => {
  try {
    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Oracle Connection Failure:", error);
    // Return the actual error message if safe, or a generic one
    return `ERR: Connection Lost. Server responded with: ${error instanceof Error ? error.message : 'Unknown Error'}`;
  }
};
