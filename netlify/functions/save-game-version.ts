import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Supabase client (server-side with service role key)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SaveVersionRequest {
  sessionId: string;
  versionNumber: number;
  html: string;
  prompt: string;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // 1. Verify authentication
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }),
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized: Invalid token' }),
      };
    }

    // 2. Parse request body
    const body: SaveVersionRequest = JSON.parse(event.body || '{}');
    const { sessionId, versionNumber, html, prompt } = body;

    if (!sessionId || !versionNumber || !html || !prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: sessionId, versionNumber, html, prompt' }),
      };
    }

    // 3. Save version using RPC function
    const { data: versionId, error: saveError } = await supabase.rpc('save_game_version', {
      user_uuid: user.id,
      session_uuid: sessionId,
      version_num: versionNumber,
      game_html: html,
      user_prompt: prompt,
    });

    if (saveError) {
      console.error('Error saving game version:', saveError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save game version', details: saveError.message }),
      };
    }

    // 4. Return success with version ID
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        versionId: versionId,
        message: 'Game version saved successfully',
      }),
    };
  } catch (error: any) {
    console.error('Error in save-game-version function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      }),
    };
  }
};

export { handler };
