import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Supabase client (server-side with service role key)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface IncrementPlaysRequest {
  gameId: string;
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
    // Parse request body
    const body: IncrementPlaysRequest = JSON.parse(event.body || '{}');
    const { gameId } = body;

    if (!gameId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required field: gameId' }),
      };
    }

    // Call the Supabase function to atomically increment plays
    const { error } = await supabase.rpc('increment_game_plays', {
      game_uuid: gameId,
    });

    if (error) {
      console.error('Error incrementing plays:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to increment play count' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error: any) {
    console.error('Error in increment-plays function:', error);
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
