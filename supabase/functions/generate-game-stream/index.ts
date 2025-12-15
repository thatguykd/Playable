import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk@0.32.1';

// Constants
const COST_NEW_GAME = 50;
const COST_ITERATION = 10;

// Initialize Supabase client with service role key
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Initialize Claude API
const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '',
});

// System instruction for game generation
const SYSTEM_INSTRUCTION = `You are Playable, an elite AI game engine. Your goal is to generate high-quality, performant HTML5 games in a single file.

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
You MUST respond with ONLY valid JSON (no markdown, no code fences, no extra text):

{
  "message": "Short hype message (e.g., 'Initializing physics engine...')",
  "html": "Complete HTML5 game code as a properly escaped JSON string",
  "suggestedTitle": "Catchy game title",
  "suggestedDescription": "Brief description"
}

CRITICAL JSON ESCAPING RULES:
- Escape double quotes in HTML: \\"
- Escape backslashes: \\\\
- Escape newlines: \\n
- Escape tabs: \\t
- Escape carriage returns: \\r
- DO NOT escape single quotes (') - they can appear literally in JSON strings
- DO NOT escape forward slashes (/) - keep them as regular forward slashes
- ONLY escape these characters: " \\ \\n \\t \\r
- Ensure the JSON is syntactically valid and can be parsed by JSON.parse()

### CODING RULES
- Do not use external assets (images/sounds) unless they are data URIs or reliable CDNs.
- Ensure the game resizes to fit the window (\`window.innerWidth\`, \`window.innerHeight\`).
- Write efficient, bug-free code.
- Test logic carefully (especially physics, collision detection, and array filtering).

### CRITICAL RULES FOR GAME LOGIC
- **Array filtering**: When using \`.filter()\`, remember it KEEPS elements that match the condition.
  - Example: \`platforms.filter(p => p.y < cameraY + canvas.height)\` keeps platforms ABOVE the bottom edge.
  - Double-check your filter logic matches your intent (keep vs. remove).
- **Physics values**: Use reasonable constants:
  - Gravity: 0.3-0.8 (higher = faster falling)
  - Jump power: 10-20 (negative Y velocity for upward movement)
  - Speed/velocity: 3-7 for smooth movement
- **Camera systems**: Ensure camera correctly tracks player movement (not inverted).
- **Collision detection**: Check player is FALLING onto platform (\`player.dy > 0\`) before landing.

### PHYSICS ENGINE REQUIREMENTS
- **Gravity**: Apply consistently every frame: \`player.dy += gravity;\`
- **Jump**: Only allow when \`player.onGround === true\`
- **Collision**: Player lands ON TOP of platforms, not inside them
- **Velocity**: Apply to position AFTER gravity: \`player.y += player.dy;\`

### BEFORE RETURNING CODE
- Review platform filtering logic - does your \`.filter()\` condition keep or remove?
- Verify gravity pulls downward (positive Y direction in canvas coordinates)
- Check that player can actually jump when on a platform
- Ensure camera follows player correctly (not inverted)
- Test that collision detection prevents player from falling through platforms
`;

// Screenshot script to inject into generated games
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

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to send SSE events
function sendSSE(controller: ReadableStreamDefaultController, data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(message));
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { prompt, currentHistory, existingHtml } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: prompt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine cost and check credits
    const isIteration = !!existingHtml;
    const cost = isIteration ? COST_ITERATION : COST_NEW_GAME;

    // Get user's current credits and tier
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits, tier, games_created')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has enough credits (applies to all tiers)
    // New game costs 50 credits, iteration costs 10 credits
    if (userData.credits < cost) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits',
          required: cost,
          available: userData.credits,
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the prompt for Claude
    let finalPrompt = prompt;
    if (existingHtml) {
      finalPrompt = `THE USER WANTS TO MODIFY THE EXISTING GAME.
HERE IS THE CURRENT SOURCE CODE:
\`\`\`html
${existingHtml}
\`\`\`

REQUEST: ${prompt}

INSTRUCTIONS:
1. Analyze the current source code.
2. Implement the requested changes while preserving existing features.
3. Return the FULLY UPDATED source code (do not return just the diff).`;
    }

    // Build messages array for Claude
    const messages: any[] = [];

    // Add conversation history if provided
    if (currentHistory && currentHistory.length > 0) {
      for (const msg of currentHistory) {
        messages.push({
          role: msg.role === 'model' ? 'assistant' : 'user',
          content: msg.text,
        });
      }
    }

    // Add current prompt
    messages.push({
      role: 'user',
      content: finalPrompt,
    });

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          sendSSE(controller, { type: 'status', message: 'Connecting to AI...' });

          let fullResponse = '';

          // Call Claude API with streaming
          const claudeStream = await anthropic.messages.stream({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 8192,
            system: SYSTEM_INSTRUCTION,
            messages: messages,
          });

          sendSSE(controller, { type: 'status', message: 'Generating game...' });

          // Stream chunks from Claude
          for await (const chunk of claudeStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text;
              fullResponse += text;

              // Send progress chunk to client (don't show code, just progress %)
              sendSSE(controller, {
                type: 'chunk',
                progress: Math.min(100, Math.floor((fullResponse.length / 5000) * 100))
              });
            }
          }

          // Parse the complete response
          sendSSE(controller, { type: 'status', message: 'Processing response...' });

          // Clean up the response
          let cleanedResponse = fullResponse
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim()
            .replace(/^\uFEFF/, ''); // Remove BOM

          // Validate JSON structure
          if (!cleanedResponse.startsWith('{') && !cleanedResponse.startsWith('[')) {
            throw new Error('AI response is not valid JSON');
          }

          let parsed;
          try {
            parsed = JSON.parse(cleanedResponse);
          } catch (parseError: any) {
            console.error('JSON parse error:', parseError.message);
            console.error('Response preview:', cleanedResponse.substring(0, 500));
            throw new Error(`Failed to parse AI response: ${parseError.message}`);
          }

          // Validate required fields
          if (!parsed.html || !parsed.message) {
            throw new Error('AI response missing required fields (html, message)');
          }

          // Inject screenshot script
          if (parsed.html.includes('</body>')) {
            parsed.html = parsed.html.replace('</body>', `${SCREENSHOT_SCRIPT}</body>`);
          } else {
            parsed.html += SCREENSHOT_SCRIPT;
          }

          // 1. DEDUCT CREDITS FIRST (before Finalizing status)
          sendSSE(controller, { type: 'status', message: 'Processing payment...' });

          let creditsDeducted = false;
          let retries = 0;
          const maxRetries = 2;

          while (!creditsDeducted && retries <= maxRetries) {
            try {
              const { data: deductSuccess, error: deductError } = await supabase.rpc('deduct_user_credits', {
                user_uuid: user.id,
                credit_amount: cost,
                transaction_type: isIteration ? 'game_iteration' : 'game_generation',
                transaction_description: isIteration
                  ? `Game iteration: ${prompt.substring(0, 50)}`
                  : `New game: ${parsed.suggestedTitle || prompt.substring(0, 50)}`,
              });

              if (deductError) {
                throw new Error(`RPC error: ${deductError.message}`);
              }

              if (!deductSuccess) {
                throw new Error('RPC returned falsy value');
              }

              creditsDeducted = true;
            } catch (rpcError: any) {
              retries++;
              console.error(`Credit deduction attempt ${retries} failed:`, rpcError);

              if (retries > maxRetries) {
                // After max retries, log error but don't block game delivery
                console.error('CRITICAL: Failed to deduct credits after retries. Manual reconciliation needed.');
                console.error('User ID:', user.id, 'Cost:', cost);

                // Send game anyway with error flag
                sendSSE(controller, {
                  type: 'complete',
                  message: parsed.message,
                  html: parsed.html,
                  suggestedTitle: parsed.suggestedTitle,
                  suggestedDescription: parsed.suggestedDescription,
                  creditsDeducted: 0,  // Indicate credits weren't deducted
                  creditsRemaining: userData.credits,  // Show original balance
                  paymentError: true,  // Flag for manual review
                });

                controller.close();
                return; // Exit early
              }

              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 500 * retries));
            }
          }

          // 2. NOW send Finalizing status
          sendSSE(controller, { type: 'status', message: 'Finalizing...' });

          // Increment games_created for new games (not iterations)
          if (!isIteration) {
            // Don't await - fire and forget, don't block on this
            supabase
              .from('users')
              .update({ games_created: userData.games_created + 1 })
              .eq('id', user.id)
              .then(() => console.log('Updated games_created'))
              .catch(err => console.error('Failed to update games_created:', err));
          }

          // Send final complete event
          sendSSE(controller, {
            type: 'complete',
            message: parsed.message,
            html: parsed.html,
            suggestedTitle: parsed.suggestedTitle,
            suggestedDescription: parsed.suggestedDescription,
            creditsDeducted: cost,
            creditsRemaining: userData.credits - cost,
          });

          controller.close();
        } catch (error: any) {
          console.error('Error in stream:', error);
          sendSSE(controller, {
            type: 'error',
            error: error.message || 'An error occurred during generation',
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Error in generate-game-stream:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
