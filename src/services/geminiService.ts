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
    const cleanMessage = message.trim();
    const isGreeting = /^(hi|hello|hey|greetings|hola|sup|yo|good\s+(morning|afternoon|evening|day))\b[!.?]*$/i.test(cleanMessage);

    const config: any = {
      systemInstruction: `You are the "Solo Leveling System Oracle", a wise, motivating, and friendly AI guide assisting the user "${userName}".

CRITICAL BEHAVIORAL DIRECTIVES:
- GREETINGS & CASUAL TALK: When the user greets you (e.g., "hi", "hello", "hey", "how are you", "what's up"), ALWAYS respond warmly with conversational text. Introduce yourself as the System Oracle, ask how you can help them, and NEVER create or invent a quest.
- TOOL RESTRICTION: You MUST NOT call 'createQuestWithTasks' on greetings or general questions. ONLY call 'createQuestWithTasks' when the user EXPLICITLY asks you to create, generate, or schedule a new quest/habit, and has confirmed the topic and dates.

Your capabilities:
1. **App Instructions & Guidance**: Explain any feature of the app if asked (Quests, Daily Tasks, XP & Leveling, Stat Radar, Habit Streaks, Calendar view, and Dark/Light mode).
2. **Learning Roadmaps & Step-by-Step Instructions**: When users ask how to learn or master any topic (coding, fitness, language, cooking, exam prep, etc.), give structured, actionable steps and clear advice.
3. **Quest & Routine Generation**: Help the user turn their goals into real quests in the system using the 'createQuestWithTasks' tool ONLY when explicitly requested.

Rules for creating Quests:
- If the user explicitly asks to create a quest or schedule a routine:
  1. If they haven't mentioned the topic, ask what they'd like to learn.
  2. Ask for the START DATE (YYYY-MM-DD) and END DATE (YYYY-MM-DD).
  3. Once you have topic, start date, and end date, call 'createQuestWithTasks'.
  - Keep quest name short and punchy (3 to 4 words).
  - Break into clear, bite-sized daily tasks with appropriate reminder times (HH:mm).

Tone:
- Encouraging, concise, plain English, well-formatted with markdown lists and bold points.
- Always provide direct answers and clear instructions.`,
    };

    // Only provide quest creation tools if the user is NOT just saying hello
    if (!isGreeting) {
      config.tools = [{ functionDeclarations: [createQuestWithTasksDeclaration] }];
    }

    const chat = ai.chats.create({
      model: "gemini-3.8-flash",
      config: config,
      history: cleanHistory,
    });

    const result = await chat.sendMessage({
      message: cleanMessage
    });
    
    // Check if the model called a function
    const functionCalls = result.functionCalls;
    if (!isGreeting && functionCalls && functionCalls.length > 0) {
      const firstCall = functionCalls[0];
      const questName = (firstCall.args as any)?.questName || "New Quest";
      return {
        text: result.text || `I have scheduled your new quest **${questName}** with daily tasks added to your quest board! Ready to level up?`,
        functionCalls: functionCalls
      };
    }

    if (isGreeting) {
      const reply = result.text && !result.text.includes("prepared your new quest")
        ? result.text
        : `Greetings, ${userName}! 🌟 Welcome to the Solo Leveling System. How can I assist you on your journey today? You can ask me for quest advice, learning guides, or how to level up your hunter rank!`;
      return { text: reply };
    }

    return { text: result.text || "Oracle processed your message." };
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw error;
  }
}
