import { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

interface SaveSessionRequest {
  sessionId: string;
  messages: any[];
  currentGameHtml?: string;
  currentVersion?: number;
  suggestedTitle?: string;
  suggestedDescription?: string;
  isActive?: boolean;
}

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Get JWT token from Authorization header
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing or invalid authorization header' }),
      };
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid token or user not found' }),
      };
    }

    // Parse request body
    const body: SaveSessionRequest = JSON.parse(event.body || '{}');
    const {
      sessionId,
      messages,
      currentGameHtml,
      currentVersion,
      suggestedTitle,
      suggestedDescription,
      isActive = true,
    } = body;

    // Validate required fields
    if (!sessionId || !messages) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'sessionId and messages are required' }),
      };
    }

    // Upsert studio session
    const { data: session, error: sessionError } = await supabase
      .from('studio_sessions')
      .upsert(
        {
          user_id: user.id,
          session_id: sessionId,
          messages: messages,
          current_game_html: currentGameHtml,
          current_version: currentVersion,
          suggested_title: suggestedTitle,
          suggested_description: suggestedDescription,
          is_active: isActive,
          last_updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,session_id',
        }
      )
      .select()
      .single();

    if (sessionError) {
      console.error('Error saving studio session:', sessionError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save studio session', details: sessionError.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        session,
      }),
    };
  } catch (error) {
    console.error('Error in save-studio-session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
    };
  }
};
