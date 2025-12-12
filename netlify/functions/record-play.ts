import { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

interface RecordPlayRequest {
  gameId: string;
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

    // Create Supabase client with service role key
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
    const body: RecordPlayRequest = JSON.parse(event.body || '{}');
    const { gameId } = body;

    // Validate required fields
    if (!gameId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'gameId is required' }),
      };
    }

    // Call the database function to record the play
    const { error: playError } = await supabase.rpc('record_game_play', {
      p_user_id: user.id,
      p_game_id: gameId,
    });

    if (playError) {
      console.error('Error recording game play:', playError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to record game play', details: playError.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Play recorded successfully',
      }),
    };
  } catch (error) {
    console.error('Error in record-play:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
    };
  }
};
