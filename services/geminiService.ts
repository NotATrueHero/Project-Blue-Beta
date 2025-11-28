
// Native Fetch Implementation for Gemini API
// No external SDK dependencies required

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text?: string; inlineData?: { mimeType: string; data: string } }[];
}

export interface StreamChatParams {
    apiKey: string;
    model: string;
    history: ChatMessage[];
    message: string;
    files: { mimeType: string; data: string }[]; // Base64 without prefix
    systemInstruction?: string;
    useSearch?: boolean;
}

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

export const streamChat = async ({
    apiKey,
    model,
    history,
    message,
    files,
    systemInstruction,
    useSearch
}: StreamChatParams) => {
    
    // Construct request body for REST API
    const contents = history.map(h => ({
        role: h.role,
        parts: h.parts.map(p => {
            if (p.inlineData) {
                return { inline_data: { mime_type: p.inlineData.mimeType, data: p.inlineData.data } };
            }
            return { text: p.text };
        })
    }));

    // Add current message
    const currentParts: any[] = [];
    if (files && files.length > 0) {
        files.forEach(f => {
            currentParts.push({ inline_data: { mime_type: f.mimeType, data: f.data } });
        });
    }
    if (message) {
        currentParts.push({ text: message });
    }
    
    if (currentParts.length > 0) {
        contents.push({ role: 'user', parts: currentParts });
    }

    const tools = useSearch ? [{ google_search: {} }] : undefined;

    const body = {
        contents,
        system_instruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        tools
    };

    // Use SSE (Server-Sent Events) endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
    }

    if (!response.body) throw new Error("No response body received");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // Generator function to yield parsed chunks
    const stream = (async function* () {
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            const lines = buffer.split('\n');
            // Keep the last partial line in the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6);
                    if (jsonStr === '[DONE]') continue;
                    
                    try {
                        const data = JSON.parse(jsonStr);
                        // Map structure to match what Oracle.tsx expects
                        // Oracle expects chunk.text and chunk.candidates[0].groundingMetadata
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        
                        yield {
                            text,
                            candidates: data.candidates,
                            // Pass through raw data just in case
                            raw: data
                        };
                    } catch (e) {
                        // Ignore parse errors for partial chunks
                    }
                }
            }
        }
    })();

    return { stream };
};
