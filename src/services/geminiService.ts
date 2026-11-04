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
  let response: Response;
  try {
    response = await fetch('/api/chat', {
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
  } catch (networkErr: any) {
    throw new Error(`Network connection error: ${networkErr?.message || 'Could not reach server'}`);
  }

  // Read response stream EXACTLY ONCE to prevent "body stream already read" TypeError
  const rawText = await response.text();
  let data: any = null;

  if (rawText && rawText.trim().length > 0) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    let errorDetail = '';
    if (data) {
      if (typeof data.error === 'string') {
        errorDetail = data.error;
      } else if (typeof data.error?.message === 'string') {
        errorDetail = data.error.message;
      } else if (typeof data.message === 'string') {
        errorDetail = data.message;
      } else {
        errorDetail = JSON.stringify(data.error || data);
      }
    } else {
      // If server returned non-JSON (e.g., HTML 504 Gateway Timeout or 502/503 from proxy)
      const trimmed = (rawText || '').trim();
      if (trimmed && !trimmed.startsWith('<')) {
        errorDetail = trimmed;
      } else {
        errorDetail = `Server returned HTTP ${response.status}: ${response.statusText || 'Oracle service unavailable'}`;
      }
    }
    throw new Error(errorDetail || `Oracle request failed with status ${response.status}`);
  }

  // If status is 200 OK but body is not valid JSON (e.g. static host served index.html)
  if (!data || typeof data !== 'object') {
    throw new Error('Received invalid non-JSON response from server. Check that /api/chat is routed to the server.');
  }

  return data as ChatResponse;
}

