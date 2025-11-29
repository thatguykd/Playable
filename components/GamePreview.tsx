
import React, { useEffect, useRef, useState } from 'react';
import { GameData, GameStatus } from '../types';
import { RefreshCw, Code, Play, Share2, Trophy, Gamepad2, AlertTriangle, Cpu } from 'lucide-react';
import { publishGame } from '../services/storageService';

interface GamePreviewProps {
  gameData: GameData | null;
  status: GameStatus;
  suggestedTitle?: string;
  suggestedDescription?: string;
  readOnly?: boolean;
}

const LOADING_MESSAGES = [
  "Consulting the Elder Gods of Gaming...",
  "Studying Fortnite replay files...",
  "Stealing code from Stack Overflow...",
  "Optimizing pixel shaders...",
  "Nerfing the main character...",
  "Generating infinite procedural worlds...",
  "Downloading more RAM...",
  "Compiling fun algorithms...",
  "Debugging the laws of physics...",
  "Asking Gabe Newell for advice...",
  "Injecting cheat codes...",
  "Rendering 4K textures in 8-bit...",
  "Fixing hitboxes...",
  "Loading unskippable cutscenes..."
];

export const GamePreview: React.FC<GamePreviewProps> = ({ 
  gameData, 
  status, 
  suggestedTitle,
  suggestedDescription,
  readOnly = false 
}) => {
  const [iframeKey, setIframeKey] = useState(0);
  const [showCode, setShowCode] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [pendingScore, setPendingScore] = useState<number>(0);
  
  // Publish Form State
  const [publishTitle, setPublishTitle] = useState('');
  const [publishDesc, setPublishDesc] = useState('');
  const [capturedScreenshot, setCapturedScreenshot] = useState<string | undefined>(undefined);

  // Loading State
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (suggestedTitle) setPublishTitle(suggestedTitle);
    if (suggestedDescription) setPublishDesc(suggestedDescription);
  }, [suggestedTitle, suggestedDescription]);

  useEffect(() => {
    if (gameData) {
      setIframeKey(prev => prev + 1);
      setCapturedScreenshot(undefined); // Reset screenshot on new game
    }
  }, [gameData?.version]);

  // Loading animation logic
  useEffect(() => {
    let msgInterval: ReturnType<typeof setInterval>;
    let progressInterval: ReturnType<typeof setInterval>;

    if (status === GameStatus.GENERATING) {
      setLoadingProgress(0);
      
      // Cycle messages
      msgInterval = setInterval(() => {
        setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
      }, 2000);

      // Fake progress bar (asymptotic)
      progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
            const remaining = 98 - prev;
            return prev + (remaining * 0.05); // Move 5% of the remaining distance
        });
      }, 200);
    }

    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, [status]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === 'GAME_OVER') {
        setPendingScore(Number(event.data.score));
        setShowScoreModal(true);
      }
      
      if (event.data.type === 'SCREENSHOT' && event.data.image) {
        setCapturedScreenshot(event.data.image);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleReload = () => {
    setIframeKey(prev => prev + 1);
    setTimeout(() => {
        iframeRef.current?.contentWindow?.focus();
    }, 100);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameData) return;

    try {
      await publishGame({
        title: publishTitle || 'Untitled Game',
        description: publishDesc || 'A Playable original.',
        author: 'Anonymous Creator',
        html: gameData.html,
        thumbnail: capturedScreenshot
      });

      setShowPublishModal(false);
      alert('Game Published Successfully!');
    } catch (error) {
      console.error('Failed to publish game:', error);
      alert('Failed to publish game. Please try again.');
    }
  };

  // ERROR STATE
  if (status === GameStatus.ERROR) {
    return (
        <div className="h-full flex flex-col items-center justify-center bg-gray-925 text-red-500 relative">
             <div className="w-24 h-24 rounded-3xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                 <AlertTriangle size={40} />
             </div>
             <h2 className="text-2xl font-bold text-white mb-2">Generation Failed</h2>
             <p className="text-gray-500 max-w-sm text-center mb-6">
                 The AI encountered a glitch in the matrix. Please try again or rephrase your request.
             </p>
        </div>
    );
  }

  // EMPTY STATE
  if (!gameData && status !== GameStatus.GENERATING) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-925 text-gray-500 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        
        <div className="z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-3xl bg-gray-900 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(79,70,229,0.1)] border border-gray-800 relative group">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Play size={40} className="ml-2 text-indigo-500 opacity-80" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Ready to Build</h2>
            <p className="text-center max-w-md text-gray-500 leading-relaxed">
              Describe your game idea in the chat. <br/>
              <span className="text-indigo-400">Playable</span> will generate the code, assets, and logic instantly.
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-925 relative">
      {/* Toolbar */}
      <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
            {status === GameStatus.GENERATING ? (
                 <span className="flex items-center gap-2 px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-400 text-[10px] font-bold tracking-wider uppercase border border-yellow-500/20">
                    <RefreshCw size={10} className="animate-spin" />
                    Building...
                 </span>
            ) : (
                <span className="flex items-center gap-2 px-2 py-1 rounded-md bg-green-500/10 text-green-400 text-[10px] font-bold tracking-wider uppercase border border-green-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  Running
                </span>
            )}
            
            {gameData && !readOnly && status !== GameStatus.GENERATING && (
                 <span className="text-xs text-gray-600 font-mono">v{gameData.version}.0</span>
            )}
        </div>
        
        <div className="flex items-center gap-2">
            {!readOnly && status !== GameStatus.GENERATING && (
              <>
                 <button 
                  onClick={() => setShowCode(!showCode)}
                  className={`p-2 rounded-lg transition-colors ${showCode ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                  title="View Code"
                >
                  <Code size={18} />
                </button>
                <button 
                    onClick={() => setShowPublishModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
                >
                    <Share2 size={14} />
                    Publish
                </button>
              </>
            )}
            {status !== GameStatus.GENERATING && (
                <button 
                    onClick={handleReload}
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                    title="Restart Game"
                >
                    <RefreshCw size={18} />
                </button>
            )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative bg-gray-900 overflow-hidden">
        {showCode ? (
            <div className="absolute inset-0 overflow-auto bg-gray-950 p-6">
                <pre className="text-xs font-mono text-gray-400 whitespace-pre-wrap leading-relaxed">
                    {gameData?.html}
                </pre>
            </div>
        ) : (
             <div className="absolute inset-0 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                <div className="w-full h-full shadow-2xl relative">
                     {gameData && (
                        <iframe
                            key={iframeKey}
                            ref={iframeRef}
                            srcDoc={gameData.html}
                            title="Game Preview"
                            className="w-full h-full border-0 block"
                            sandbox="allow-scripts allow-modals allow-popups allow-forms allow-pointer-lock allow-same-origin"
                        />
                     )}
                     
                     {/* LOADING SCREEN */}
                     {(status === GameStatus.GENERATING) && (
                        <div className="absolute inset-0 bg-gray-950/90 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                            {/* Animated Background Grid Effect */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(17,24,39,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(17,24,39,0.9)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50"></div>
                            
                            <div className="relative z-10 w-full max-w-md px-6 text-center">
                                {/* HUD Center Graphic */}
                                <div className="relative w-24 h-24 mx-auto mb-10">
                                    <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full animate-ping [animation-duration:3s]"></div>
                                    <div className="absolute inset-0 border-2 border-t-indigo-500 border-b-indigo-500 border-l-transparent border-r-transparent rounded-full animate-spin [animation-duration:2s]"></div>
                                    <div className="absolute inset-2 border-2 border-indigo-400/50 rounded-full animate-pulse"></div>
                                    <div className="absolute inset-0 flex items-center justify-center text-indigo-400">
                                        <Gamepad2 size={32} />
                                    </div>
                                </div>

                                {/* Status Text */}
                                <div className="mb-8 h-8">
                                    <h3 className="text-xl font-bold text-white tracking-widest uppercase animate-pulse">
                                        System Initializing
                                    </h3>
                                </div>

                                {/* Funny Message */}
                                <div className="h-6 mb-6">
                                    <p className="text-sm font-mono text-indigo-400 animate-fade-in key={loadingMsg}">
                                        {">"} {loadingMsg}
                                    </p>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden relative">
                                    <div 
                                        className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-300 ease-out"
                                        style={{ width: `${loadingProgress}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-2 text-[10px] text-gray-600 font-mono uppercase">
                                    <span>Core Compiling</span>
                                    <span>{Math.round(loadingProgress)}%</span>
                                </div>
                            </div>
                        </div>
                     )}
                </div>
            </div>
        )}
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                        <Share2 size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Publish to Discover</h3>
                        <p className="text-xs text-gray-500">Share your creation with the world.</p>
                    </div>
                </div>
                
                {/* Screenshot Preview */}
                <div className="mb-4 w-full h-32 rounded-lg bg-gray-950 border border-gray-800 overflow-hidden relative">
                    {capturedScreenshot ? (
                        <img src={capturedScreenshot} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-600 text-xs">
                            <span className="flex items-center gap-2"><Cpu size={14}/> Generating Thumbnail...</span>
                        </div>
                    )}
                </div>

                <form onSubmit={handlePublish} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Game Title</label>
                        <input 
                            type="text" 
                            required
                            value={publishTitle}
                            onChange={e => setPublishTitle(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-700 font-medium"
                            placeholder="e.g. Super Bounce"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                        <textarea 
                            required
                            value={publishDesc}
                            onChange={e => setPublishDesc(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all h-24 resize-none placeholder:text-gray-700 text-sm leading-relaxed"
                            placeholder="Briefly describe gameplay mechanics and controls..."
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setShowPublishModal(false)} className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium">Cancel</button>
                        <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-bold shadow-lg shadow-indigo-500/20">Publish Now</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Score Modal */}
      {showScoreModal && !readOnly && (
         <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
            <div className="bg-gray-900/90 backdrop-blur border border-indigo-500/30 pl-4 pr-6 py-3 rounded-full shadow-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                    <Trophy size={18} fill="currentColor" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider leading-none mb-1">Session Score</span>
                    <span className="text-xl font-mono text-white font-bold leading-none">{pendingScore}</span>
                </div>
                <div className="h-8 w-px bg-gray-700 mx-2"></div>
                <button 
                    onClick={() => setShowScoreModal(false)}
                    className="text-gray-400 hover:text-white transition-colors text-xs font-medium"
                >
                    Dismiss
                </button>
            </div>
         </div>
      )}
    </div>
  );
};
