import { Message, GenAIResponse } from "../types";
import { supabase } from './supabaseClient';

// Get Supabase URL from environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

/**
 * Generate a game using streaming from Supabase Edge Function with Claude API
 * This function streams the response in real-time, providing progress updates
 *
 * @param currentHistory - Conversation history
 * @param prompt - User's prompt for game generation
 * @param existingHtml - Existing game HTML (for iterations)
 * @param onProgress - Callback for progress updates (status messages and chunks)
 */
export const generateGame = async (
  currentHistory: Message[],
  prompt: string,
  existingHtml?: string,
  onProgress?: (status: string, chunk?: string) => void
): Promise<GenAIResponse> => {
  try {
    // Get the current session token for authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('You must be logged in to generate games');
    }

    // Call the Supabase Edge Function with streaming
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/generate-game-stream`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        prompt,
        currentHistory,
        existingHtml,
      }),
    });

    if (!response.ok) {
      let errorData: any;
      let errorMessage: string;

      try {
        // Try to parse error response as JSON
        errorData = await response.json();
        errorMessage = errorData.error || errorData.message;
      } catch (parseError) {
        // Response is not JSON - likely a timeout or system error
        const textError = await response.text().catch(() => 'Unknown error');

        // Detect timeout errors
        if (textError.includes('TimeoutError') || textError.includes('timed out')) {
          errorMessage = 'The AI is taking longer than expected to generate your game. This usually happens with complex requests.\n\nTry:\n• Simplifying your prompt\n• Breaking changes into smaller iterations\n• Trying again in a moment';
        } else if (textError.includes('fetch failed')) {
          errorMessage = 'Network connection failed. Please check your internet and try again.';
        } else {
          errorMessage = `Server error: ${textError.substring(0, 100)}`;
        }
      }

      // Handle specific error cases
      if (response.status === 402 && errorData) {
        throw new Error(`Insufficient credits. You need ${errorData.required} credits but only have ${errorData.available}.`);
      }

      if (response.status === 403 && errorData) {
        throw new Error(errorData.error || 'Access denied');
      }

      throw new Error(errorMessage || 'Failed to generate game');
    }

    // Read the SSE stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Unable to read response stream');
    }

    let buffer = '';
    let finalResult: GenAIResponse | null = null;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (separated by \n\n)
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep incomplete message in buffer

        for (const message of messages) {
          if (!message.trim() || !message.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(message.substring(6)); // Remove "data: " prefix

            if (data.type === 'status') {
              // Status update
              onProgress?.(data.message);
            } else if (data.type === 'chunk') {
              // Progress chunk from Claude
              onProgress?.(data.accumulated || 'Generating...', data.text);
            } else if (data.type === 'complete') {
              // Final complete response
              finalResult = {
                message: data.message,
                html: data.html,
                suggestedTitle: data.suggestedTitle,
                suggestedDescription: data.suggestedDescription,
              };
            } else if (data.type === 'error') {
              throw new Error(data.error || 'An error occurred during generation');
            }
          } catch (parseError) {
            console.error('Failed to parse SSE message:', message, parseError);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!finalResult) {
      throw new Error('No complete response received from server');
    }

    return finalResult;
  } catch (error: any) {
    console.error('Error generating game:', error);
    throw error;
  }
};

// Export for backwards compatibility (not used in new implementation)
export const COST_NEW_GAME = 50;
export const COST_ITERATION = 10;
