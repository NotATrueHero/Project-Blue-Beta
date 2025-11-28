
// Native fetch implementation to avoid dependency issues
export interface ChatSession {
  history: { role: string; parts: { text: string }[] }[];
}

export const createOracleChat = (): ChatSession => {
  return {
    history: [
      {
        role: "user",
        parts: [{ text: 'You are "Oracle", a high-level system AI for Project Blue. You are helpful, concise, and speak with a slightly robotic, secure-terminal tone. Keep answers brief. Do not output internal thought traces or reasoning steps.' }]
      },
      {
        role: "model",
        parts: [{ text: "Oracle System Online. Ready for directives." }]
      }
    ]
  };
};

export const sendMessageToOracle = async (chat: ChatSession, message: string, model: string = 'gemini-1.5-flash'): Promise<string> => {
  const apiKey = process.env.API_KEY || localStorage.getItem('blue_api_key') || '';
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  
  if (!apiKey) {
      console.error("Oracle Error: API Key is missing.");
      return "System Error: API Key not configured.";
  }

  // Add user message to history
  const newHistory = [
      ...chat.history,
      { role: "user", parts: [{ text: message }] }
  ];

  try {
    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: newHistory.slice(1) // Send history excluding system prompt logic if needed, but here sending all logic as conversation
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
        const errorMsg = data.error?.message || response.statusText;
        console.error("Oracle API Error:", errorMsg);
        return `Connection Failed: ${errorMsg} (Model: ${model})`;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response data.";
    
    // Update local history object (mutating for persistence in session)
    chat.history.push({ role: "user", parts: [{ text: message }] });
    chat.history.push({ role: "model", parts: [{ text: text }] });
    
    return text;
  } catch (error: any) {
    console.error("Oracle Network Error:", error);
    return `Network Error: ${error.message}`;
  }
};
