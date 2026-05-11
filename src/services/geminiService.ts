import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

export async function chatWithAI(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = [], userName: string = "Adventurer") {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `You are the "Solo Leveling System", a friendly and simple AI assistant that helps people learn new topics and stay organized.
        The person you are helping is named "${userName}".
        Your job is to provide easy-to-follow steps, simple summaries, and helpful tips.
        Avoid complex words or technical jargon. Use clear and plain English.
        Use your Google Search tool to find reliable information if the user asks for a learning plan or steps.
        
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
          { googleSearch: {} },
          { functionDeclarations: [createQuestWithTasksDeclaration] }
        ],
        toolConfig: { includeServerSideToolInvocations: true }
      },
      history: history,
    });

    const result = await chat.sendMessage({
        message: message
    });
    
    // Check if the model called a function
    const functionCalls = result.functionCalls;
    if (functionCalls) {
      return {
        text: result.text,
        functionCalls: functionCalls
      };
    }

    return { text: result.text };
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw error;
  }
}
