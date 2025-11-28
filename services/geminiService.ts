
// Native Fetch Implementation for Gemini API
// Designed to mimic the structure requested by the user without external dependencies

export interface ChatSession {
    history: {
        role: 'user' | 'model';
        parts: any[]; // Changed from strict text type to allow inlineData
    }[];
    model: string;
}

export interface Attachment {
    mimeType: string;
    data: string; // Base64 string without prefix
}

// Safe accessor for API Key from LocalStorage
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

// Factory function to create a chat session state
export const createOracleChat = (): ChatSession => {
    return {
        history: [],
        model: 'gemini-1.5-flash' // Using 1.5 Flash as it is the current stable standard
    };
};

// Stateless send function that appends to history and calls API
export const sendMessageToOracle = async (chat: ChatSession, message: string, attachment?: Attachment): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "System Error: API Key missing or invalid.";

    // 1. Prepare User Message Parts
    const userParts: any[] = [];
    
    // Add text if present
    if (message.trim()) {
        userParts.push({ text: message });
    }
    
    // Add attachment if present
    if (attachment) {
        userParts.push({
            inlineData: {
                mimeType: attachment.mimeType,
                data: attachment.data
            }
        });
    }

    if (userParts.length === 0) return "Error: Empty message";

    // 2. Update local history
    chat.history.push({
        role: 'user',
        parts: userParts
    });

    try {
        // 3. Prepare Payload
        const payload = {
            contents: chat.history,
            systemInstruction: {
                parts: [{ text: 'You are "Oracle", a high-level system AI for Project Blue. You are helpful, concise, and speak with a slightly robotic, secure-terminal tone. Keep answers brief. Do not output internal thought traces or reasoning steps.' }]
            }
        };

        // 4. Native Fetch Call
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${chat.model}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Gemini API Error:", errText);
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        // 5. Extract Response
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
            // 6. Update history with model response
            chat.history.push({
                role: 'model',
                parts: [{ text }]
            });
            return text;
        } else {
            return "ERR: No data received from Oracle Core.";
        }

    } catch (error) {
        console.error("Oracle Connection Failure:", error);
        return "Connection Lost. Secure channel unavailable.";
    }
};
