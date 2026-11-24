import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

import express from 'express';
import { configureProxy, apiSecurity } from '../backend/security';
import { chatRequest, questArguments } from '../src/lib/chatSchemas';

const MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

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

function sanitizeHistory(rawHistory: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  const filtered = (rawHistory || []).filter(item => {
    const text = item.parts?.[0]?.text?.trim();
    if (!text) return false;
    if (
      text.startsWith('⚠️') ||
      text.startsWith('⚡') ||
      text.startsWith('⏳') ||
      text.includes('Oracle Connection Notice') ||
      text.includes('Oracle Connection Configuration') ||
      text.includes('Oracle Key Required') ||
      text.includes('Oracle Cooldown') ||
      text.includes('Communication Signal Mismatch') ||
      text.includes('Forgive me, the magical connection is weak') ||
      text.includes('This model is currently experiencing high demand') ||
      text.includes('{"error"') ||
      text.includes('"code":503') ||
      text.includes('"code":429')
    ) {
      return false;
    }
    return true;
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

  if (cleaned.length > 0 && cleaned[cleaned.length - 1].role === 'user') {
    cleaned.pop();
  }

  return cleaned;
}

const app = express();
app.disable('x-powered-by');
configureProxy(app);
app.use(apiSecurity(15));
app.post('*', async (req, res) => {
  try {
    const currentApiKey = process.env.GEMINI_API_KEY;
    if (!currentApiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY_MISSING: Gemini API key is not configured on the server.'
      });
    }

    const parsed = chatRequest.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid chat request.' });
    const { message, history, userName, mode } = parsed.data;
    const ai = new GoogleGenAI({
      apiKey: currentApiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const cleanHistory = sanitizeHistory(history);
    const cleanMessage = message.trim();
    const isGreeting = /^(hi|hello|hey|greetings|hola|sup|yo|good\s+(morning|afternoon|evening|day))\b[!.?]*$/i.test(cleanMessage);
    const isQuestCreationIntent = mode === 'chat' && !isGreeting && /(create|schedule|add|make|plan|start|generate|setup|set up)\s+(a\s+)?(new\s+)?(quest|routine|task|project|habit|goal)/i.test(cleanMessage);

    const config: any = {
      systemInstruction: `You are the "Solo Leveling System Oracle", a wise, motivating, and friendly AI guide assisting the user "${userName}".

CRITICAL BEHAVIORAL DIRECTIVES:
- GREETINGS & CASUAL TALK: When the user greets you (e.g., "hi", "hello", "hey", "how are you", "what's up"), ALWAYS respond warmly with conversational text. Introduce yourself as the System Oracle, ask how you can help them, and NEVER create or invent a quest.
- TOOL RESTRICTION: You MUST NOT call 'createQuestWithTasks' on greetings or general questions. ONLY call 'createQuestWithTasks' when the user EXPLICITLY asks you to create, generate, or schedule a new quest/habit, and has confirmed the topic and dates.

Your capabilities:
1. **App Instructions & Guidance**: Explain any feature of the app if asked (Quests, Daily Tasks, XP & Leveling, Stat Radar, Habit Streaks, Calendar view, and Dark/Light mode).
2. **Learning Roadmaps & Step-by-Step Instructions**: When users ask how to learn or master any topic (coding, fitness, language, cooking, exam prep, CBSE syllabus, operating systems, etc.), give structured, actionable steps and clear advice.
3. **Quest & Routine Generation**: Help the user turn their goals into real quests in the system using the 'createQuestWithTasks' tool ONLY when explicitly requested.

Tone:
- Encouraging, concise, plain English, well-formatted with markdown lists and bold points.
- Always provide direct answers and clear instructions.`,
    };

    if (isQuestCreationIntent) {
      config.tools = [{ functionDeclarations: [createQuestWithTasksDeclaration] }];
    }

    if (mode === 'tip') {
      config.systemInstruction = 'Return one friendly quest tip in plain text, in at most 15 words.';
    }

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let lastError: any = null;
    let result: any = null;

    for (const model of MODELS) {
      try {
        const chat = ai.chats.create({
          model: model,
          config: config,
          history: cleanHistory,
        });

        result = await chat.sendMessage({
          message: cleanMessage,
        });
        if (result && (result.text || (result.functionCalls && result.functionCalls.length > 0))) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed in serverless function:`, err?.message || err);

        if (config.tools) {
          try {
            await sleep(200);
            const noToolConfig = { ...config };
            delete noToolConfig.tools;
            const plainChat = ai.chats.create({
              model: model,
              config: noToolConfig,
              history: cleanHistory,
            });
            result = await plainChat.sendMessage({
              message: cleanMessage,
            });
            if (result && result.text) {
              break;
            }
          } catch (plainErr: any) {
            lastError = plainErr;
          }
        }
        await sleep(250);
      }
    }

    if (!result) {
      throw lastError || new Error('All model endpoints were unreachable.');
    }

    const proposed = result.functionCalls?.find((call: { name?: string }) => call.name === 'createQuestWithTasks');
    if (isQuestCreationIntent && proposed) {
      const parsedQuest = questArguments.safeParse(proposed.args);
      if (!parsedQuest.success) {
        return res.status(502).json({ error: 'The generated quest was invalid. Please try again.' });
      }
      return res.json({
        text: result.text || `Prepared **${parsedQuest.data.questName}** with daily tasks.`,
        functionCalls: [{ name: 'createQuestWithTasks', args: parsedQuest.data }],
      });
    }

    if (isGreeting) {
      const reply = result.text && !result.text.includes('prepared your new quest')
        ? result.text
        : `Greetings, ${userName}! 🌟 Welcome to the Solo Leveling System. How can I assist you on your journey today? You can ask me for quest advice, learning guides, or how to level up your hunter rank!`;
      return res.json({ text: reply });
    }

    return res.json({ text: result.text || 'Oracle processed your message.' });
  } catch (error: any) {
    console.error('Serverless Gemini Error:', error);
    const rawMsg = error?.message || String(error || '');
    let userFriendlyMsg = 'The AI Oracle is currently experiencing temporary high demand. Please try asking again in a few moments.';
    if (rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('API key not valid') || rawMsg.includes('403')) {
      userFriendlyMsg = 'The Gemini API key is missing or invalid. Please check the server configuration.';
    } else if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
      userFriendlyMsg = 'The AI quota was temporarily reached. Please wait a moment and try again.';
    } else if (rawMsg.includes('400') || rawMsg.includes('INVALID_ARGUMENT')) {
      userFriendlyMsg = 'Signal mismatch with the Oracle. Please try asking your question again.';
    }
    return res.status(500).json({ error: userFriendlyMsg });
  }
});

export default app;
