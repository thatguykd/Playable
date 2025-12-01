
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatArea } from './components/ChatArea';
import { GamePreview } from './components/GamePreview';
import { Feed } from './components/Feed';
import { Leaderboard } from './components/Leaderboard';
import { LandingPage } from './components/LandingPage';
import { Library } from './components/Library';
import { AuthPage } from './components/AuthPage';
import { PricingModal } from './components/PricingModal';
import { SettingsPage } from './components/SettingsPage';
import { Message, GameData, GameStatus, ViewMode, PublishedGame, LeaderboardEntry, User, GameVersion } from './types';
import { generateGame } from './services/geminiService';
import {
    getPublishedGames,
    incrementPlays,
    getLeaderboard,
    saveScore,
    getSavedGameIds,
    toggleSaveGame,
    getSavedGames,
    getCurrentUser,
    getCurrentUserWithRetry,
    logout,
    COST_NEW_GAME,
    COST_ITERATION,
    LIMIT_FREE_GAMES,
    getUserPreferences,
    saveUserPreferences,
    getActiveStudioSession,
    saveStudioSession,
    deactivateStudioSession,
    getPlayHistory,
    recordGamePlay
} from './services/storageService';
import { supabase } from './services/supabaseClient';
import { LayoutGrid, PenTool, Gamepad2, Bookmark, LogIn, Coins, ChevronUp, Settings, Layers, MonitorPlay } from 'lucide-react';

const App: React.FC = () => {
  // Always show landing page initially for non-logged-in users
  // Will be hidden in useEffect if user is logged in
  const [showLanding, setShowLanding] = useState(true);
  const [view, setView] = useState<ViewMode>('feed');
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [pricingAction, setPricingAction] = useState<'upgrade' | 'refill' | undefined>(undefined);

  // App State
  const [messages, setMessages] = useState<Message[]>([]);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [suggestedTitle, setSuggestedTitle] = useState('');
  const [suggestedDesc, setSuggestedDesc] = useState('');

  // Version Control State
  const [sessionId, setSessionId] = useState<string>('');
  const [gameVersions, setGameVersions] = useState<GameVersion[]>([]);

  // View States
  const [activeGame, setActiveGame] = useState<PublishedGame | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [publishedGames, setPublishedGames] = useState<PublishedGame[]>([]);
  const [savedGameIds, setSavedGameIds] = useState<string[]>([]);
  const [savedGamesList, setSavedGamesList] = useState<PublishedGame[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<PublishedGame[]>([]);
  
  // Score Modal
  const [showScoreInput, setShowScoreInput] = useState(false);
  const [tempScore, setTempScore] = useState(0);
  const [playerName, setPlayerName] = useState('');

  // INITIALIZATION
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load published games
        const games = await getPublishedGames();
        setPublishedGames(games);

        // Check for existing user session with retry logic
        const currentUser = await getCurrentUserWithRetry();
        console.log('🔍 Current user check:', currentUser ? 'User logged in' : 'No user');
        if (currentUser) {
          setUser(currentUser);
          // If user is logged in, hide landing page and enter app
          console.log('✅ User is logged in - hiding landing page');
          setShowLanding(false);
          const savedIds = await getSavedGameIds();
          setSavedGameIds(savedIds);

          // RESTORE USER PREFERENCES AND STATE
          try {
            const prefs = await getUserPreferences();
            if (prefs) {
              // Restore view (but don't restore 'settings' view)
              if (prefs.currentView && prefs.currentView !== 'settings') {
                setView(prefs.currentView as ViewMode);
              }

              // Restore active game if in gaming view
              if (prefs.activeGameId && prefs.currentView === 'gaming') {
                const game = games.find(g => g.id === prefs.activeGameId);
                if (game) {
                  const leaderboardData = await getLeaderboard(game.id);
                  setActiveGame(game);
                  setLeaderboard(leaderboardData);
                }
              }
            }
          } catch (error) {
            console.error('Error loading user preferences:', error);
            // Continue without preferences - not critical for app functionality
          }

          // Load play history for recently played games
          try {
            const playHistory = await getPlayHistory(6);
            setRecentlyPlayed(playHistory);
          } catch (error) {
            console.error('Error loading play history:', error);
            // Continue without play history - not critical for app functionality
          }

          // RESTORE STUDIO SESSION if active
          try {
            const activeSession = await getActiveStudioSession();
            if (activeSession && activeSession.isActive) {
              setSessionId(activeSession.sessionId);
              setMessages(activeSession.messages || []);
              if (activeSession.currentGameHtml) {
                setGameData({
                  html: activeSession.currentGameHtml,
                  version: activeSession.currentVersion,
                });
                setStatus(GameStatus.PLAYING);
              }
              if (activeSession.suggestedTitle) setSuggestedTitle(activeSession.suggestedTitle);
              if (activeSession.suggestedDescription) setSuggestedDesc(activeSession.suggestedDescription);

              // Fetch game versions for this session - pass sessionId explicitly
              setTimeout(async () => {
                await fetchGameVersions(activeSession.sessionId);
              }, 500);

              // If there was an active session and user wasn't already in studio, switch to studio
              const prefs = await getUserPreferences();
              if (prefs?.currentView !== 'studio' && activeSession.messages.length > 0) {
                setView('studio');
              }
            }
          } catch (error) {
            console.error('Error loading studio session:', error);
            // Continue without studio session - not critical for app functionality
          }
        }
      } catch (error) {
        console.error('Error during app initialization:', error);
        // App can still function even if initialization fails
      }
    };

    initializeApp();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // User logged in - refresh user data with retry logic
        // This handles race conditions where database trigger creating user profile
        // hasn't completed yet (common with OAuth flows)
        const currentUser = await getCurrentUserWithRetry();
        if (currentUser) {
          setUser(currentUser);
          const savedIds = await getSavedGameIds();
          setSavedGameIds(savedIds);

          // Load play history
          const playHistory = await getPlayHistory(6);
          setRecentlyPlayed(playHistory);
        } else {
          console.error('Failed to fetch user profile after authentication');
        }
      } else {
        // User logged out
        setUser(null);
        setSavedGameIds([]);
        setRecentlyPlayed([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Update saved games list
  useEffect(() => {
    const loadSavedGames = async () => {
      if (view === 'play') {
        const games = await getSavedGames();
        setSavedGamesList(games);
      }
    };
    loadSavedGames();
  }, [view, savedGameIds]);

  // AUTO-SAVE STUDIO SESSION
  useEffect(() => {
    // Only auto-save if user is logged in and there's a session
    if (!user || !sessionId || messages.length === 0) return;

    const saveSession = async () => {
      await saveStudioSession({
        sessionId,
        messages,
        currentGameHtml: gameData?.html,
        currentVersion: gameData?.version,
        suggestedTitle,
        suggestedDescription: suggestedDesc,
        isActive: view === 'studio', // Mark as active only if in studio view
      });
    };

    // Debounce the save by 2 seconds
    const timeoutId = setTimeout(saveSession, 2000);
    return () => clearTimeout(timeoutId);
  }, [user, sessionId, messages, gameData, suggestedTitle, suggestedDesc, view]);

  // SAVE VIEW PREFERENCE
  useEffect(() => {
    if (!user) return;

    const saveView = async () => {
      await saveUserPreferences({
        currentView: view,
        activeGameId: view === 'gaming' ? activeGame?.id : undefined,
      });
    };

    // Debounce to avoid excessive saves
    const timeoutId = setTimeout(saveView, 500);
    return () => clearTimeout(timeoutId);
  }, [user, view, activeGame]);

  // Handle Score Messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'GAME_OVER') {
        if (view === 'gaming' && activeGame) {
           setTempScore(Number(event.data.score));
           setShowScoreInput(true);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [view, activeGame]);

  // LOGOUT
  const handleLogout = async () => {
      await logout();
      setUser(null);
      setSavedGameIds([]);
      setView('feed');
      // Show landing page after logout
      setShowLanding(true);
  };

  const handleAuthSuccess = async (u: User) => {
      setUser(u);
      setShowAuth(false);
      const savedIds = await getSavedGameIds();
      setSavedGameIds(savedIds);
      // If user logs in from landing page, enter the app
      if (showLanding) {
          setShowLanding(false);
      }
  };

  // SEND MESSAGE / GENERATE GAME
  const handleSendMessage = async (text: string) => {
    // DEV MODE: Skip all frontend checks for testing (REMOVE BEFORE PRODUCTION)
    const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

    if (!isDevMode) {
      // 1. Check Auth
      if (!user) {
          setShowAuth(true);
          return;
      }

      // 2. Check Limits (Free Tier)
      const isNewGame = !gameData;
      if (isNewGame && user.tier === 'free' && user.gamesCreated >= LIMIT_FREE_GAMES) {
          setMessages(prev => [...prev, { id: uuidv4(), role: 'model', text: "Free Tier Limit Reached. Upgrade to create more games.", timestamp: Date.now() }]);
          setPricingAction('upgrade');
          setShowPricing(true);
          return;
      }

      if (!isNewGame && user.tier === 'free') {
           setMessages(prev => [...prev, { id: uuidv4(), role: 'model', text: "Iterations are a Pro feature. Upgrade to edit this game.", timestamp: Date.now() }]);
           setPricingAction('upgrade');
           setShowPricing(true);
           return;
      }
    } else {
      console.log('🔧 DEV MODE: Skipping frontend auth and tier checks');
    }

    // Note: Credit checking and deduction is now handled by the backend API

    const newUserMsg: Message = { id: uuidv4(), role: 'user', text, timestamp: Date.now() };
    setMessages((prev) => [...prev, newUserMsg]);
    setStatus(GameStatus.GENERATING);

    try {
      const existingHtml = gameData?.html;
      const isNewGame = !gameData;

      // Generate new session ID for new games
      if (isNewGame && !sessionId) {
        setSessionId(uuidv4());
      }

      const response = await generateGame(messages.concat(newUserMsg), text, existingHtml);

      const newVersion = (gameData?.version || 0) + 1;
      setMessages((prev) => [...prev, { id: uuidv4(), role: 'model', text: response.message, timestamp: Date.now() }]);
      setGameData({ html: response.html, version: newVersion });

      if (response.suggestedTitle) setSuggestedTitle(response.suggestedTitle);
      if (response.suggestedDescription) setSuggestedDesc(response.suggestedDescription);

      // Save version to database (async, don't wait)
      if (sessionId || isNewGame) {
        const currentSessionId = sessionId || uuidv4();
        if (isNewGame && !sessionId) {
          setSessionId(currentSessionId);
        }
        // Pass currentSessionId to both save and fetch to avoid race conditions
        saveGameVersion(response.html, newVersion, text, currentSessionId);
        // Fetch updated version list - pass currentSessionId to avoid race condition
        setTimeout(() => fetchGameVersions(currentSessionId), 500);
      }

      // Refresh user data to update credits
      const updatedUser = await getCurrentUser();
      if (updatedUser) {
        setUser(updatedUser);
      }

      setStatus(GameStatus.PLAYING);
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || "Error generating game.";
      setMessages((prev) => [...prev, { id: uuidv4(), role: 'model', text: errorMessage, timestamp: Date.now() }]);
      setStatus(GameStatus.ERROR);

      // If error is about insufficient credits, show pricing modal
      if (errorMessage.includes('Insufficient credits') || errorMessage.includes('credits')) {
        setPricingAction('refill');
        setShowPricing(true);
      }
    }
  };

  const handlePlayGame = async (game: PublishedGame) => {
    setActiveGame(game);
    await incrementPlays(game.id);
    const leaderboardData = await getLeaderboard(game.id);
    setLeaderboard(leaderboardData);

    // Record play in database (for logged-in users)
    if (user) {
      await recordGamePlay(game.id);
      // Refresh play history
      const playHistory = await getPlayHistory(6);
      setRecentlyPlayed(playHistory);
    } else {
      // For non-logged-in users, keep in-memory list
      setRecentlyPlayed(prev => {
        const filtered = prev.filter(g => g.id !== game.id);
        return [game, ...filtered].slice(0, 6);
      });
    }

    setView('gaming');
  };

  const handleToggleSave = async (gameId: string) => {
    if (!user) {
        setShowAuth(true);
        return;
    }
    await toggleSaveGame(gameId);
    const savedIds = await getSavedGameIds();
    setSavedGameIds(savedIds);
  };

  const submitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeGame && user) {
        const finalPlayerName = playerName || user.name;
        await saveScore(activeGame.id, finalPlayerName, tempScore);
        const leaderboardData = await getLeaderboard(activeGame.id);
        setLeaderboard(leaderboardData);
        setShowScoreInput(false);
        setPlayerName('');
    }
  };

  // VERSION CONTROL FUNCTIONS
  const saveGameVersion = async (html: string, versionNum: number, prompt: string, targetSessionId?: string) => {
    const sessionIdToUse = targetSessionId || sessionId;
    console.log('[saveGameVersion] Attempting to save version:', { versionNum, sessionIdToUse, promptLength: prompt.length });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[saveGameVersion] No session found - cannot save version');
        return;
      }

      if (!sessionIdToUse) {
        console.error('[saveGameVersion] No sessionId available - cannot save version');
        return;
      }

      const response = await fetch('/.netlify/functions/save-game-version', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sessionId: sessionIdToUse,
          versionNumber: versionNum,
          html: html,
          prompt: prompt,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[saveGameVersion] Failed to save game version:', response.status, errorText);
      } else {
        const data = await response.json();
        console.log('[saveGameVersion] Successfully saved version:', data);
      }
    } catch (error) {
      console.error('[saveGameVersion] Error saving game version:', error);
    }
  };

  const fetchGameVersions = async (specificSessionId?: string) => {
    console.log('[fetchGameVersions] Called with:', { specificSessionId, currentSessionId: sessionId });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const targetSessionId = specificSessionId || sessionId;

      if (!session) {
        console.error('[fetchGameVersions] No session found - cannot fetch versions');
        return;
      }

      if (!targetSessionId) {
        console.error('[fetchGameVersions] No targetSessionId available - cannot fetch versions');
        return;
      }

      console.log('[fetchGameVersions] Fetching versions for sessionId:', targetSessionId);

      const response = await fetch(`/.netlify/functions/get-game-versions?sessionId=${targetSessionId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      console.log('[fetchGameVersions] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[fetchGameVersions] Received data:', { versionsCount: data.versions?.length, versions: data.versions });

        const mappedVersions = data.versions.map((v: any) => ({
          id: v.id,
          versionNumber: v.version_number,
          html: v.html,
          prompt: v.prompt,
          timestamp: new Date(v.created_at).getTime(),
        }));

        console.log('[fetchGameVersions] Setting gameVersions state with', mappedVersions.length, 'versions');
        setGameVersions(mappedVersions);
      } else {
        const errorText = await response.text();
        console.error('[fetchGameVersions] Failed to fetch versions:', response.status, errorText);
      }
    } catch (error) {
      console.error('[fetchGameVersions] Error fetching game versions:', error);
    }
  };

  const restoreVersion = async (version: GameVersion) => {
    setGameData({ html: version.html, version: version.versionNumber });
    setStatus(GameStatus.PLAYING);
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'model',
      text: `Restored version ${version.versionNumber}`,
      timestamp: Date.now(),
    }]);
  };

  const handleNewGame = async () => {
    // Deactivate current session if exists
    if (sessionId && user) {
      await deactivateStudioSession(sessionId);
    }

    // Reset all game state
    setMessages([]);
    setGameData(null);
    setStatus(GameStatus.IDLE);
    setSuggestedTitle('');
    setSuggestedDesc('');
    setSessionId(uuidv4());
    setGameVersions([]);
  };

  return (
    <>
      {/* Global Modals */}
      {showAuth && <AuthPage onSuccess={handleAuthSuccess} onCancel={() => setShowAuth(false)} />}
      {showPricing && user && <PricingModal user={user} onClose={() => setShowPricing(false)} onUpdateUser={setUser} requiredAction={pricingAction} />}

      {showLanding ? (
         <LandingPage
            onEnter={() => {
              setShowLanding(false);
            }}
            onSignIn={() => setShowAuth(true)}
         />
      ) : (
        <div className="flex h-screen w-screen overflow-hidden bg-gray-950 text-gray-100 font-sans">
            {/* SIDEBAR */}
            <div className="w-20 md:w-64 bg-gray-950 border-r border-gray-800 flex flex-col shrink-0 z-20 transition-all duration-300 group">
                
                {/* Logo Area */}
                <div className="h-20 flex items-center px-6 border-b border-gray-800">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20 mr-3 shrink-0">
                        <Gamepad2 size={20} />
                    </div>
                    <span className="text-lg font-bold tracking-tight hidden md:block">Playable</span>
                </div>
                
                {/* Navigation */}
                <nav className="flex-1 flex flex-col gap-2 p-4">
                    <button 
                        onClick={() => setView('feed')} 
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'feed' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/50'}`}
                    >
                        <LayoutGrid size={22} />
                        <span className="hidden md:block font-medium">Discover</span>
                    </button>
                    <button
                        onClick={() => {
                            if (!user) { setShowAuth(true); return; }
                            setView('studio');
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'studio' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/50'}`}
                    >
                        <PenTool size={22} />
                        <span className="hidden md:block font-medium">Studio</span>
                    </button>
                    <button
                        onClick={() => {
                            if (!user) { setShowAuth(true); return; }
                            setView('gaming');
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'gaming' ? 'bg-gray-900 text-green-500' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/50'}`}
                    >
                        <MonitorPlay size={22} className={view === 'gaming' ? 'text-green-500' : ''} />
                        <span className="hidden md:block font-medium">Gaming</span>
                    </button>
                    <button
                        onClick={() => {
                            if (!user) { setShowAuth(true); return; }
                            setView('play');
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${view === 'play' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/50'}`}
                    >
                        <Bookmark size={22} />
                        <span className="hidden md:block font-medium">Library</span>
                    </button>
                </nav>

                {/* User Profile / Auth Button */}
                <div className="p-4 border-t border-gray-800 bg-gray-950">
                    {user ? (
                        <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700" />
                                    <div className="hidden md:block overflow-hidden">
                                        <p className="text-sm font-bold truncate w-24">{user.name}</p>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">{user.tier} Plan</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setView('settings')}
                                    className="text-gray-500 hover:text-white transition-colors"
                                >
                                    <Settings size={16} />
                                </button>
                            </div>
                            
                            {/* Credits Display */}
                            <div className="flex items-center justify-between bg-gray-950 rounded-lg p-2 border border-gray-800 mb-2 cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => setShowPricing(true)}>
                                <div className="flex items-center gap-2 text-yellow-500">
                                    <Coins size={14} />
                                    <span className="text-xs font-mono font-bold hidden md:block">{user.credits.toLocaleString()}</span>
                                </div>
                                <div className="w-5 h-5 bg-gray-800 rounded flex items-center justify-center text-gray-400">
                                    <ChevronUp size={12} />
                                </div>
                            </div>
                            
                            <button onClick={handleLogout} className="w-full text-[10px] text-center text-gray-600 hover:text-gray-400 py-1 hidden md:block">
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setShowAuth(true)}
                            className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
                        >
                            <LogIn size={18} />
                            <span className="hidden md:block">Sign In</span>
                        </button>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex overflow-hidden relative">
                
                {/* VIEW: FEED */}
                {view === 'feed' && (
                    <Feed 
                        games={publishedGames} 
                        onPlay={handlePlayGame} 
                        savedGameIds={savedGameIds}
                        onToggleSave={handleToggleSave}
                    />
                )}

                {/* VIEW: SETTINGS */}
                {view === 'settings' && user && (
                    <SettingsPage 
                        user={user} 
                        onUpdateUser={setUser} 
                        onOpenPricing={() => setShowPricing(true)} 
                    />
                )}

                {/* VIEW: STUDIO */}
                {view === 'studio' && (
                    <>
                        <div className="w-full md:w-[400px] border-r border-gray-800 bg-gray-950 flex flex-col">
                            <ChatArea
                                messages={messages}
                                onSendMessage={handleSendMessage}
                                onNewGame={handleNewGame}
                                status={status}
                                gameVersions={gameVersions}
                                currentVersion={gameData?.version || 0}
                                onRestoreVersion={restoreVersion}
                            />
                        </div>
                        <div className="flex-1 h-full hidden md:block">
                            <GamePreview 
                                gameData={gameData} 
                                status={status} 
                                suggestedTitle={suggestedTitle}
                                suggestedDescription={suggestedDesc}
                            />
                        </div>
                    </>
                )}

                {/* VIEW: PLAY (Library) */}
                {view === 'play' && (
                    <Library
                        savedGames={savedGamesList}
                        onPlay={handlePlayGame}
                        onRemove={handleToggleSave}
                    />
                )}

                {/* VIEW: GAMING (Active Game or Landing) */}
                {view === 'gaming' && (
                    <>
                        {activeGame ? (
                            <>
                                <div className="flex-1 h-full bg-gray-900 relative flex flex-col">
                                    <div className="h-16 border-b border-gray-800 bg-gray-950 px-6 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-bold text-white">{activeGame.title}</h2>
                                            <p className="text-xs text-gray-500">by {activeGame.author}</p>
                                        </div>
                                        <button onClick={() => setActiveGame(null)} className="text-sm text-gray-400 hover:text-white px-3 py-1.5 bg-gray-900 rounded-lg border border-gray-800 transition-colors">
                                            Exit
                                        </button>
                                    </div>
                                    <div className="flex-1 relative">
                                        <GamePreview
                                            gameData={{ html: activeGame.html, version: 1 }}
                                            status={GameStatus.PLAYING}
                                            readOnly={true}
                                        />
                                    </div>
                                </div>
                                <Leaderboard entries={leaderboard} />

                                {/* Score Input Overlay */}
                                {showScoreInput && (
                                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                                            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500 border border-yellow-500/20">
                                                <Layers size={32} />
                                            </div>
                                            <h3 className="text-2xl font-bold text-white mb-1">New Score!</h3>
                                            <p className="text-4xl font-mono font-bold text-indigo-400 mb-6">{tempScore}</p>

                                            {!user ? (
                                                <div className="text-center">
                                                    <p className="text-gray-500 text-sm mb-4">Sign in to save your score to the leaderboard.</p>
                                                    <button onClick={() => { setShowScoreInput(false); setShowAuth(true); }} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold">Sign In</button>
                                                </div>
                                            ) : (
                                                <form onSubmit={submitScore}>
                                                    <input
                                                        type="text"
                                                        required
                                                        maxLength={12}
                                                        placeholder="Enter your name"
                                                        value={playerName || user.name}
                                                        onChange={e => setPlayerName(e.target.value)}
                                                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white text-center mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button type="button" onClick={() => setShowScoreInput(false)} className="flex-1 py-3 text-sm text-gray-400 hover:text-white transition-colors">Skip</button>
                                                        <button type="submit" className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/20">Save Score</button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8 overflow-y-auto">
                                <div className="max-w-4xl w-full">
                                    {/* Gaming Header */}
                                    <div className="text-center mb-12">
                                        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-2xl mb-6 border border-green-500/20">
                                            <MonitorPlay size={40} className="text-green-500" />
                                        </div>
                                        <h1 className="text-5xl font-bold text-white mb-4">Gaming Hub</h1>
                                        <p className="text-gray-400 text-lg">Ready to play some amazing games?</p>
                                    </div>

                                    {/* Recently Played Games */}
                                    <div className="mb-8">
                                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                            <Gamepad2 size={24} className="text-green-500" />
                                            Recently Played
                                        </h2>
                                        {recentlyPlayed.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {recentlyPlayed.slice(0, 3).map(game => (
                                                    <div
                                                        key={game.id}
                                                        onClick={() => handlePlayGame(game)}
                                                        className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-green-500/50 transition-all cursor-pointer group"
                                                    >
                                                        <div className="aspect-video bg-gray-800 relative overflow-hidden">
                                                            {game.thumbnail ? (
                                                                <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Gamepad2 size={48} className="text-gray-700" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="p-4">
                                                            <h3 className="font-bold text-white mb-1 truncate">{game.title}</h3>
                                                            <p className="text-xs text-gray-500 mb-2 truncate">by {game.author}</p>
                                                            <div className="flex items-center justify-between text-xs text-gray-600">
                                                                <span className="capitalize">{game.category}</span>
                                                                <span>{game.plays.toLocaleString()} plays</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-xl">
                                                <Gamepad2 size={48} className="text-gray-700 mx-auto mb-4" />
                                                <p className="text-gray-500 mb-2">No games played yet</p>
                                                <p className="text-gray-600 text-sm">Start playing some games to see them here!</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* CTA Button */}
                                    <div className="text-center">
                                        <button
                                            onClick={() => setView('feed')}
                                            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all hover:scale-105"
                                        >
                                            <LayoutGrid size={24} />
                                            Discover More Games
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
      )}
    </>
  );
};

export default App;
