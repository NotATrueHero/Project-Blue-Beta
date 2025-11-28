import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Safe accessor for API Key
export const getApiKey = (): string | undefined => {
  const localKey = localStorage.getItem('blue_api_key');
  if (localKey && localKey.trim().length > 0) return localKey.trim();

  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      // @ts-ignore
      return process.env.API_KEY.trim();
    }
  } catch (e) {}
  return undefined;
};

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text?: string; inlineData?: { mimeType: string; data: string } }[];
}

interface StreamChatParams {
    apiKey: string;
    model: string;
    history: ChatMessage[];
    message: string;
    files: { mimeType: string; data: string }[]; // Base64 without prefix
    systemInstruction?: string;
    useSearch?: boolean;
    thinkingBudget?: number;
}

export const streamChat = async ({
    apiKey,
    model,
    history,
    message,
    files,
    systemInstruction,
    useSearch,
    thinkingBudget
}: StreamChatParams) => {
    const ai = new GoogleGenAI({ apiKey });

    // Filter valid config options based on model family
    const tools = useSearch ? [{ googleSearch: {} }] : undefined;
    
    // Thinking config is only for 2.5 models and when budget > 0
    const thinkingConfig = (thinkingBudget && thinkingBudget > 0 && model.includes('2.5')) 
        ? { thinkingBudget } 
        : undefined;

    const chat = ai.chats.create({
        model,
        config: {
            systemInstruction,
            tools,
            thinkingConfig
        },
        history: history.map(h => ({
            role: h.role,
            parts: h.parts.map(p => {
                if (p.inlineData) {
                     return { inlineData: { mimeType: p.inlineData.mimeType, data: p.inlineData.data } };
                }
                return { text: p.text };
            })
        }))
    });

    const userParts: any[] = [];
    if (message) userParts.push({ text: message });
    files.forEach(f => {
        userParts.push({ inlineData: { mimeType: f.mimeType, data: f.data } });
    });

    const result = await chat.sendMessageStream({ message: userParts });
    return { stream: result };
};

export const generateSpeech = async (apiKey: string, text: string): Promise<string | undefined> => {
    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text }] },
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (e) {
        console.error("TTS Generation failed", e);
        return undefined;
    }
};