import { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
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

    // Get query parameters
    const sessionId = event.queryStringParameters?.sessionId;

    if (sessionId) {
      // Get specific session by ID
      const { data: session, error: sessionError } = await supabase
        .from('studio_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .single();

      if (sessionError) {
        // Session not found is not an error, just return null
        if (sessionError.code === 'PGRST116') {
          return {
            statusCode: 200,
            body: JSON.stringify({ session: null }),
          };
        }

        console.error('Error fetching studio session:', sessionError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to fetch studio session', details: sessionError.message }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ session }),
      };
    } else {
      // Get most recent active session
      const { data: sessions, error: sessionError } = await supabase
        .from('studio_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_updated_at', { ascending: false })
        .limit(1);

      if (sessionError) {
        console.error('Error fetching active studio session:', sessionError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to fetch active studio session', details: sessionError.message }),
        };
      }

      const session = sessions && sessions.length > 0 ? sessions[0] : null;

      return {
        statusCode: 200,
        body: JSON.stringify({ session }),
      };
    }
  } catch (error) {
    console.error('Error in get-studio-session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
    };
  }
};
