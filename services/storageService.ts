import { PublishedGame, LeaderboardEntry, User, SubscriptionTier } from "../types";
import { supabase } from './supabaseClient';

// Costs & Limits (kept as constants for easy configuration)
export const COST_NEW_GAME = 50;
export const COST_ITERATION = 10;
// Note: Free tier game limit is now credit-based (credits / COST_NEW_GAME)
// This constant is kept for backwards compatibility but should not be used for new limit checks
export const LIMIT_FREE_GAMES = 200;

// ==========================================
// AUTH & USER MANAGEMENT
// ==========================================

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // Get current session from Supabase Auth
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return null;
    }

    // Fetch user profile from public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return null;
    }

    // Map database user to app User type
    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      avatar: userData.avatar || undefined,
      tier: userData.tier as SubscriptionTier,
      credits: userData.credits,
      gamesCreated: userData.games_created,
      joinedAt: new Date(userData.joined_at).getTime(),
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const login = async (email: string, password: string): Promise<User> => {
  try {
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Fetch user profile
    const user = await getCurrentUser();
    if (!user) throw new Error('Failed to fetch user profile');

    return user;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Login failed');
  }
};

export const signup = async (email: string, password: string, name: string): Promise<User> => {
  try {
    // Sign up with Supabase Auth (trigger will auto-create profile)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('Signup failed - no user returned');

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fetch user profile
    const user = await getCurrentUser();
    if (!user) throw new Error('Failed to fetch user profile');

    return user;
  } catch (error: any) {
    console.error('Signup error:', error);
    throw new Error(error.message || 'Signup failed');
  }
};

export const loginWithGoogle = async (): Promise<User> => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw error;

    // Note: This will redirect, so we won't reach here
    // The user will be automatically logged in after redirect
    throw new Error('OAuth redirect initiated');
  } catch (error: any) {
    console.error('Google login error:', error);
    throw new Error(error.message || 'Google login failed');
  }
};

export const updateUser = async (updates: Partial<User>): Promise<User> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('No user logged in');

    // Map User type updates to database schema
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;

    // Update in database
    const { error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', user.id);

    if (error) throw error;

    // Return updated user
    const updatedUser = await getCurrentUser();
    if (!updatedUser) throw new Error('Failed to fetch updated user');

    return updatedUser;
  } catch (error: any) {
    console.error('Update user error:', error);
    throw new Error(error.message || 'Failed to update user');
  }
};

export const logout = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error: any) {
    console.error('Logout error:', error);
    throw new Error(error.message || 'Logout failed');
  }
};

export const upgradeTier = async (tier: SubscriptionTier): Promise<User> => {
  // This function is now handled by Stripe webhooks
  // Keep for backwards compatibility but it should not be called directly
  throw new Error('Tier upgrades must be done through Stripe checkout');
};

export const buyCredits = async (amount: number): Promise<User> => {
  // This function is now handled by Stripe webhooks
  // Keep for backwards compatibility but it should not be called directly
  throw new Error('Credit purchases must be done through Stripe checkout');
};

export const deductCredits = async (amount: number): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    // Use Supabase RPC function for atomic credit deduction
    const { data, error } = await supabase.rpc('deduct_user_credits', {
      user_uuid: user.id,
      credit_amount: amount,
      transaction_type: amount === COST_NEW_GAME ? 'game_generation' : 'game_iteration',
      transaction_description: amount === COST_NEW_GAME ? 'New game creation' : 'Game iteration',
    });

    if (error) {
      console.error('Credit deduction error:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error deducting credits:', error);
    return false;
  }
};

// ==========================================
// GAME DATA
// ==========================================

export const getPublishedGames = async (): Promise<PublishedGame[]> => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map database games to app PublishedGame type
    return data.map(game => ({
      id: game.id,
      title: game.title,
      description: game.description,
      author: game.author_name,
      authorId: game.author_id || undefined,
      html: game.html,
      thumbnail: game.thumbnail || undefined,
      category: game.category as PublishedGame['category'],
      plays: game.plays,
      isOfficial: game.is_official,
      timestamp: new Date(game.created_at).getTime(),
    }));
  } catch (error) {
    console.error('Error fetching games:', error);
    return [];
  }
};

export const publishGame = async (
  game: Omit<PublishedGame, 'id' | 'timestamp' | 'plays' | 'isOfficial' | 'category' | 'authorId'>
): Promise<PublishedGame> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in to publish games');

    const { data, error } = await supabase
      .from('games')
      .insert({
        title: game.title,
        description: game.description,
        author_id: user.id,
        author_name: user.name,
        html: game.html,
        thumbnail: game.thumbnail,
        category: 'Arcade', // Default category
        is_official: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Map back to PublishedGame type
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      author: data.author_name,
      authorId: data.author_id || undefined,
      html: data.html,
      thumbnail: data.thumbnail || undefined,
      category: data.category as PublishedGame['category'],
      plays: data.plays,
      isOfficial: data.is_official,
      timestamp: new Date(data.created_at).getTime(),
    };
  } catch (error: any) {
    console.error('Error publishing game:', error);
    throw new Error(error.message || 'Failed to publish game');
  }
};

// ==========================================
// SOCIAL & LEADERBOARDS
// ==========================================

export const getLeaderboard = async (gameId: string): Promise<LeaderboardEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('game_id', gameId)
      .order('score', { ascending: false })
      .limit(10);

    if (error) throw error;

    return data.map(entry => ({
      playerName: entry.player_name,
      score: entry.score,
      date: new Date(entry.created_at).getTime(),
    }));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
};

export const saveScore = async (gameId: string, playerName: string, score: number): Promise<void> => {
  try {
    const user = await getCurrentUser();

    const { error } = await supabase
      .from('leaderboard')
      .insert({
        game_id: gameId,
        player_name: playerName,
        score: score,
        user_id: user?.id || null,
      });

    if (error) throw error;
  } catch (error: any) {
    console.error('Error saving score:', error);
    throw new Error(error.message || 'Failed to save score');
  }
};

export const incrementPlays = async (gameId: string): Promise<void> => {
  try {
    // Call serverless function for atomic increment
    const response = await fetch('/.netlify/functions/increment-plays', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameId }),
    });

    if (!response.ok) {
      throw new Error('Failed to increment play count');
    }
  } catch (error) {
    console.error('Error incrementing plays:', error);
    // Don't throw - this is a non-critical feature
  }
};

// ==========================================
// SAVED GAMES (USER LIBRARY)
// ==========================================

export const getSavedGameIds = async (): Promise<string[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('saved_games')
      .select('game_id')
      .eq('user_id', user.id);

    if (error) throw error;

    return data.map(row => row.game_id);
  } catch (error) {
    console.error('Error fetching saved game IDs:', error);
    return [];
  }
};

export const toggleSaveGame = async (gameId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    // Check if already saved
    const { data: existing } = await supabase
      .from('saved_games')
      .select('*')
      .eq('user_id', user.id)
      .eq('game_id', gameId)
      .single();

    if (existing) {
      // Remove from saved games
      const { error } = await supabase
        .from('saved_games')
        .delete()
        .eq('user_id', user.id)
        .eq('game_id', gameId);

      if (error) throw error;
      return false; // No longer saved
    } else {
      // Add to saved games
      const { error } = await supabase
        .from('saved_games')
        .insert({
          user_id: user.id,
          game_id: gameId,
        });

      if (error) throw error;
      return true; // Now saved
    }
  } catch (error: any) {
    console.error('Error toggling save game:', error);
    return false;
  }
};

export const getSavedGames = async (): Promise<PublishedGame[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    // Join saved_games with games table
    const { data, error } = await supabase
      .from('saved_games')
      .select(`
        game_id,
        games (*)
      `)
      .eq('user_id', user.id);

    if (error) throw error;

    // Map to PublishedGame type
    return data
      .filter(row => row.games) // Filter out null games (deleted games)
      .map((row: any) => {
        const game = row.games;
        return {
          id: game.id,
          title: game.title,
          description: game.description,
          author: game.author_name,
          authorId: game.author_id || undefined,
          html: game.html,
          thumbnail: game.thumbnail || undefined,
          category: game.category as PublishedGame['category'],
          plays: game.plays,
          isOfficial: game.is_official,
          timestamp: new Date(game.created_at).getTime(),
        };
      });
  } catch (error) {
    console.error('Error fetching saved games:', error);
    return [];
  }
};

// ==========================================
// USER PREFERENCES & SESSION MANAGEMENT (STUBS)
// ==========================================

export const getCurrentUserWithRetry = async (): Promise<User | null> => {
  // Simple retry logic for getCurrentUser
  let attempts = 0;
  while (attempts < 3) {
    const user = await getCurrentUser();
    if (user) return user;
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return null;
};

export const getUserPreferences = async (): Promise<any | null> => {
  // Stub: Return null for now
  return null;
};

export const saveUserPreferences = async (prefs: any): Promise<void> => {
  // Stub: Do nothing for now
  console.log('saveUserPreferences called (stub):', prefs);
};

export const getActiveStudioSession = async (): Promise<any | null> => {
  // Stub: Return null for now
  return null;
};

export const saveStudioSession = async (session: any): Promise<void> => {
  // Stub: Do nothing for now
  console.log('saveStudioSession called (stub):', session);
};

export const deactivateStudioSession = async (sessionId: string): Promise<void> => {
  // Stub: Do nothing for now
  console.log('deactivateStudioSession called (stub):', sessionId);
};

export const getPlayHistory = async (limit: number = 6): Promise<PublishedGame[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    // Query play_history table with join to games table
    const { data, error } = await supabase
      .from('play_history')
      .select(`
        game_id,
        last_played_at,
        play_count,
        games (*)
      `)
      .eq('user_id', user.id)
      .order('last_played_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching play history:', error);
      return [];
    }

    // Map to PublishedGame type
    return data
      .filter(row => row.games) // Filter out deleted games
      .map((row: any) => {
        const game = row.games;
        return {
          id: game.id,
          title: game.title,
          description: game.description,
          author: game.author_name,
          authorId: game.author_id || undefined,
          html: game.html,
          thumbnail: game.thumbnail || undefined,
          category: game.category as PublishedGame['category'],
          plays: game.plays,
          isOfficial: game.is_official,
          timestamp: new Date(game.created_at).getTime(),
        };
      });
  } catch (error) {
    console.error('Error fetching play history:', error);
    return [];
  }
};

export const recordGamePlay = async (gameId: string): Promise<void> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      // Only record for logged-in users
      return;
    }

    // Get current session token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Call serverless function to record play
    const response = await fetch('/.netlify/functions/record-play', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ gameId }),
    });

    if (!response.ok) {
      console.error('Failed to record play:', await response.text());
    }
  } catch (error) {
    console.error('Error recording game play:', error);
    // Don't throw - this is a non-critical feature
  }
};
