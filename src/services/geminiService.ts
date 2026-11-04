export interface ChatMessagePart {
  text: string;
}

export interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: ChatMessagePart[];
}

export interface FunctionCallItem {
  name: string;
  args: Record<string, any>;
}

export interface ChatResponse {
  text: string;
  functionCalls?: FunctionCallItem[];
}

export async function chatWithAI(
  message: string, 
  history: ChatHistoryItem[] = [], 
  userName: string = "Adventurer"
): Promise<ChatResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      history,
      userName,
    }),
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorData = await response.json();
      errorDetail = errorData.error || response.statusText;
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail || `Oracle request failed with status ${response.status}`);
  }

  return response.json();
}
