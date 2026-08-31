import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

export function getApiKey(): string {
  const key = 
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
    (typeof window !== 'undefined' && (window as any).__GEMINI_API_KEY__) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('gemini_api_key')) ||
    '';
  return key.trim();
}

export function setCustomApiKey(key: string) {
  if (typeof localStorage !== 'undefined') {
    if (key.trim()) {
      localStorage.setItem('gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  }
}

const createQuestWithTasksDeclaration: FunctionDeclaration = {
  name: "createQuestWithTasks",
  description: "Create a new learning quest (project) with a title, description, start date, end date, and a simple list of daily steps to reach the quest.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      questName: { 
        type: Type.STRING, 
        description: "The name of the quest. Keep it very simple, between 3 to 4 words only (e.g., 'Learn to Cook Meals')." 
      },
      description: { 
        type: Type.STRING, 
        description: "A simple and helpful description of the quest." 
      },
      startDate: { 
        type: Type.STRING, 
        description: "The date when the quest starts (YYYY-MM-DD)." 
      },
      endDate: { 
        type: Type.STRING, 
        description: "The date when the quest should be finished (YYYY-MM-DD)." 
      },
      tasks: {
        type: Type.ARRAY,
        description: "A list of daily steps to take between the start and end date.",
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "The simple thing the user needs to do." },
            dayNumber: { type: Type.NUMBER, description: "Which day after the start date this is for (0 for start date, 1 for next day, etc.)" },
            reminderTime: { type: Type.STRING, description: "HH:mm format for the daily reminder (e.g., '09:00', '18:30')." }
          },
          required: ["text", "dayNumber"]
        }
      }
    },
    required: ["questName", "description", "startDate", "endDate", "tasks"]
  }
};

function sanitizeHistory(rawHistory: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  const filtered = rawHistory.filter(item => {
    const text = item.parts?.[0]?.text?.trim();
    return Boolean(text);
  });

  while (filtered.length > 0 && filtered[0].role !== 'user') {
    filtered.shift();
  }

  const cleaned: { role: 'user' | 'model', parts: { text: string }[] }[] = [];
  for (const item of filtered) {
    if (cleaned.length === 0) {
      cleaned.push({ role: item.role, parts: [{ text: item.parts[0].text }] });
    } else {
      const prev = cleaned[cleaned.length - 1];
      if (prev.role === item.role) {
        prev.parts[0].text += `\n${item.parts[0].text}`;
      } else {
        cleaned.push({ role: item.role, parts: [{ text: item.parts[0].text }] });
      }
    }
  }

  return cleaned;
}

export async function chatWithAI(
  message: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[] = [], 
  userName: string = "Adventurer"
) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING: Gemini API key is not configured in this environment.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const cleanHistory = sanitizeHistory(history);

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: `You are the "Solo Leveling System", a friendly and simple AI assistant that helps people learn new topics and stay organized.
The person you are helping is named "${userName}".
Your job is to provide easy-to-follow steps, simple summaries, and helpful tips.
Avoid complex words or technical jargon. Use clear and plain English.

CRITICAL: If the user wants to start a new quest or learn something new:
1. First, ask them WHAT topic they want to master if they haven't specified it.
2. Once they tell you the topic, ask them for the START DATE and the END DATE for this quest.
3. ONLY after they provide the topic, start date, and end date, use the 'createQuestWithTasks' tool to generate the daily plan.

When using 'createQuestWithTasks':
- Keep the quest name short and simple, strictly between 3 and 4 words.
- Break the topic into small, easy daily steps that fit within the time between the start and end date.
- Set a specific time (HH:mm) for each step so the user knows when to work on it.
- Keep names and info very simple and encouraging.

After calling the tool, send a final friendly message saying the plan is ready!`,
        tools: [
          { functionDeclarations: [createQuestWithTasksDeclaration] }
        ],
      },
      history: cleanHistory,
    });

    const result = await chat.sendMessage({
      message: message
    });
    
    // Check if the model called a function
    const functionCalls = result.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      return {
        text: result.text || "I have prepared your new quest!",
        functionCalls: functionCalls
      };
    }

    return { text: result.text || "Oracle processed your message." };
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw error;
  }
}
