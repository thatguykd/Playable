import { Message, GenAIResponse } from "../types";
import { supabase } from './supabaseClient';

/**
 * Generate a game using the backend Netlify function
 * This function now proxies through the serverless backend to:
 * - Keep the Gemini API key secure
 * - Enforce credit limits server-side
 * - Atomically deduct credits
 */
export const generateGame = async (
  currentHistory: Message[],
  prompt: string,
  existingHtml?: string
): Promise<GenAIResponse> => {
  try {
    // Get the current session token for authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('You must be logged in to generate games');
    }

    // Call the Netlify function
    const response = await fetch('/.netlify/functions/generate-game', {
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

    let data: any;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error('Received invalid response from server. Please try again.');
    }

    return {
      message: data.message,
      html: data.html,
      suggestedTitle: data.suggestedTitle,
      suggestedDescription: data.suggestedDescription,
    };
  } catch (error: any) {
    console.error('Error generating game:', error);
    throw error;
  }
};

// Export for backwards compatibility (not used in new implementation)
export const COST_NEW_GAME = 50;
export const COST_ITERATION = 10;
