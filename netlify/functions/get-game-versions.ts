import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Supabase client (server-side with service role key)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
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

    // 2. Get sessionId from query parameters
    const sessionId = event.queryStringParameters?.sessionId;

    if (!sessionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameter: sessionId' }),
      };
    }

    // 3. Fetch versions using RPC function
    const { data: versions, error: fetchError } = await supabase.rpc('get_game_versions', {
      session_uuid: sessionId,
      user_uuid: user.id,
    });

    if (fetchError) {
      console.error('Error fetching game versions:', fetchError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch game versions', details: fetchError.message }),
      };
    }

    // 4. Return versions
    return {
      statusCode: 200,
      body: JSON.stringify({
        versions: versions || [],
      }),
    };
  } catch (error: any) {
    console.error('Error in get-game-versions function:', error);
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
