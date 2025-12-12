import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// Constants from storageService
const COST_NEW_GAME = 50;
const COST_ITERATION = 10;

// Supabase client (server-side with service role key)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Gemini API key
const geminiApiKey = process.env.GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `
You are Playable, an elite AI game engine. Your goal is to generate high-quality, performant HTML5 games in a single file.

### CORE REQUIREMENTS
1. **CONTAINED:** Output a single HTML file with embedded CSS/JS.
2. **SCORING:**
   - You MUST implement score tracking.
   - When the game ends or a high score is reached, send the score to the parent:
     \`window.parent.postMessage({ type: 'GAME_OVER', score: finalScore }, '*');\`
3. **CONTROLS:**
   - Use \`window.addEventListener\` for keyboard inputs (Arrow keys, WASD, Space).
   - Ensure controls are responsive and do not require focusing a specific element if possible.
4. **VISUALS:** Use a dark, neon, cyberpunk, or arcade aesthetic. Use Canvas API for performance.

### OUTPUT FORMAT
Return strictly raw JSON (no markdown formatting) with these fields:
- \`message\`: A short, hype-up message (e.g., "Initializing physics engine...").
- \`html\`: The complete HTML5 code.
- \`suggestedTitle\`: A catchy title.
- \`suggestedDescription\`: A short description.

### CODING RULES
- Do not use external assets (images/sounds) unless they are data URIs or reliable CDNs.
- Ensure the game resizes to fit the window (\`window.innerWidth\`).
- Write efficient, bug-free code.
`;

const SCREENSHOT_SCRIPT = `
<script>
(function() {
  setTimeout(function() {
    try {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        window.parent.postMessage({ type: 'SCREENSHOT', image: dataUrl }, '*');
      }
    } catch(e) {
      console.error('Screenshot capture failed:', e);
    }
  }, 3000);
})();
</script>
`;

interface GenerateGameRequest {
  prompt: string;
  currentHistory: Array<{ role: string; text: string }>;
  existingHtml?: string;
}

interface GenerateGameResponse {
  message: string;
  html: string;
  suggestedTitle?: string;
  suggestedDescription?: string;
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
    const body: GenerateGameRequest = JSON.parse(event.body || '{}');
    const { prompt, currentHistory, existingHtml } = body;

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required field: prompt' }),
      };
    }

    // 3. Determine cost and check credits
    const isIteration = !!existingHtml;
    const cost = isIteration ? COST_ITERATION : COST_NEW_GAME;

    // Get user's current credits and tier
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits, tier, games_created')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch user data' }),
      };
    }

    // Check if user has enough credits
    if (userData.credits < cost) {
      return {
        statusCode: 402,
        body: JSON.stringify({
          error: 'Insufficient credits',
          required: cost,
          available: userData.credits,
        }),
      };
    }

    // Check free tier limits (1 game max)
    if (userData.tier === 'free' && !isIteration && userData.games_created >= 1) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Free tier limit reached. Upgrade to create more games.',
          limit: 1,
        }),
      };
    }

    // Check if free tier is trying to iterate (not allowed)
    if (userData.tier === 'free' && isIteration) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Game iteration is not available on the free tier. Upgrade to edit your games.',
        }),
      };
    }

    // 4. Call Gemini API
    if (!geminiApiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Gemini API key not configured' }),
      };
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const contents = currentHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    // If we have an existing game, inject it into the prompt to allow iteration
    let finalPrompt = prompt;
    if (existingHtml) {
      finalPrompt = `
THE USER WANTS TO MODIFY THE EXISTING GAME.
HERE IS THE CURRENT SOURCE CODE:
\`\`\`html
${existingHtml}
\`\`\`

REQUEST: ${prompt}

INSTRUCTIONS:
1. Analyze the current source code.
2. Implement the requested changes while preserving existing features.
3. Return the FULLY UPDATED source code (do not return just the diff).
`;
    }

    contents.push({
      role: 'user',
      parts: [{ text: finalPrompt }],
    });

    // Call Gemini API with streaming to get faster first response
    let text = '';
    try {
      const stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
        },
      });

      // Accumulate chunks from stream
      for await (const chunk of stream) {
        if (chunk.text) {
          text += chunk.text;
        }
      }
    } catch (apiError: any) {
      console.error('Gemini API error:', apiError);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Error during AI generation. Please try again.',
          details: apiError.message
        }),
      };
    }

    if (!text) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'No response from AI' }),
      };
    }

    // CLEANUP: Remove markdown code fences if the model adds them despite instructions
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Additional cleanup for common JSON issues
    // Fix common escape sequence issues from Gemini
    try {
      // Remove any BOM (Byte Order Mark) characters
      text = text.replace(/^\uFEFF/, '');

      // Fix common problematic escape sequences
      // Replace triple backslashes with single backslash
      text = text.replace(/\\\\\\/g, '\\');

      // Fix invalid escape sequences like \v, \f, etc in string values
      // We need to be careful not to break valid escapes like \n, \t, \", \\
      text = text.replace(/\\([^"\\\/bfnrtu])/g, '\\\\$1');
    } catch (cleanupError) {
      console.warn('Error during JSON cleanup:', cleanupError);
    }

    // Validate and parse JSON response with error handling
    let parsed: GenerateGameResponse;
    try {
      // Check if response looks like JSON before parsing
      if (!text.startsWith('{') && !text.startsWith('[')) {
        console.error('AI response is not JSON:', text.substring(0, 200));
        return {
          statusCode: 500,
          body: JSON.stringify({
            error: 'AI returned invalid response format. This may be due to a timeout or service issue. Please try again.',
            details: text.substring(0, 100)
          }),
        };
      }

      parsed = JSON.parse(text);
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError.message);
      console.error('Error position:', parseError.message.match(/position (\d+)/)?.[1]);

      // Log a window around the error position for debugging
      const posMatch = parseError.message.match(/position (\d+)/);
      if (posMatch) {
        const pos = parseInt(posMatch[1]);
        const start = Math.max(0, pos - 50);
        const end = Math.min(text.length, pos + 50);
        console.error('Context around error:', text.substring(start, end));
      }

      // Try aggressive cleanup
      try {
        let cleanedText = text
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters except newline/tab
          .replace(/\r\n/g, '\n') // Normalize line endings
          .replace(/\r/g, '\n');

        // Try to fix common JSON issues
        // Fix trailing commas before closing braces/brackets
        cleanedText = cleanedText.replace(/,(\s*[}\]])/g, '$1');

        // Fix unescaped quotes in string values (very aggressive)
        // This is risky but can help recover from badly formatted responses
        cleanedText = cleanedText.replace(/([^\\])"(\s*[^:,}\]])/g, '$1\\"$2');

        parsed = JSON.parse(cleanedText);
        console.log('✅ Recovered from parse error with aggressive cleanup');
      } catch (secondError: any) {
        // Still failed - return error to user with helpful info
        return {
          statusCode: 500,
          body: JSON.stringify({
            error: 'Failed to parse AI response. The AI returned malformed JSON. Please try again.',
            details: parseError.message,
            sample: text.substring(0, 300)
          }),
        };
      }
    }

    // Inject screenshot script safely
    if (parsed.html) {
      if (parsed.html.includes('</body>')) {
        parsed.html = parsed.html.replace('</body>', `${SCREENSHOT_SCRIPT}</body>`);
      } else {
        parsed.html += SCREENSHOT_SCRIPT;
      }
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Generated JSON missing HTML property' }),
      };
    }

    // 5. Deduct credits using the database function
    const { data: deductSuccess, error: deductError } = await supabase.rpc('deduct_user_credits', {
      user_uuid: user.id,
      credit_amount: cost,
      transaction_type: isIteration ? 'game_iteration' : 'game_generation',
      transaction_description: isIteration
        ? `Game iteration: ${prompt.substring(0, 50)}`
        : `New game: ${parsed.suggestedTitle || prompt.substring(0, 50)}`,
    });

    if (deductError || !deductSuccess) {
      console.error('Failed to deduct credits:', deductError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to deduct credits' }),
      };
    }

    // 6. Increment games_created for new games (not iterations)
    if (!isIteration) {
      await supabase
        .from('users')
        .update({ games_created: userData.games_created + 1 })
        .eq('id', user.id);
    }

    // 7. Return the generated game
    return {
      statusCode: 200,
      body: JSON.stringify({
        ...parsed,
        creditsDeducted: cost,
        creditsRemaining: userData.credits - cost,
      }),
    };
  } catch (error: any) {
    console.error('Error in generate-game function:', error);
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
