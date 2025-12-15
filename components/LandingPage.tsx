
import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, ArrowRight, Paperclip, Palette, X, ChevronDown, LogOut } from 'lucide-react';
import SnakeBackground from './SnakeBackground';
import { User } from '../types';

interface LandingPageProps {
  onEnter: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  user: User | null;
}

const gameExamples = [
  "Create a space invaders game where enemies drop power-ups...",
  "Build a flappy bird clone with portals instead of pipes...",
  "Make a typing game where words fall from the sky like Tetris...",
  "Design a pong game but the ball splits into two when hit...",
  "Create a platformer where gravity reverses when you jump..."
];

const designStyles = [
  { id: 'default', name: 'Default', description: 'Adaptive style that fits the game theme' },
  { id: 'neon', name: 'Neon Style', description: 'Vibrant neon colors with glowing effects' },
  { id: 'colorful', name: 'Colorful', description: 'Bright and playful color palette' },
  { id: 'mystical', name: 'Mystical', description: 'Dark and mysterious aesthetic' },
  { id: 'retro', name: 'Retro Pixel', description: 'Classic 8-bit pixel art style' },
  { id: 'minimalist', name: 'Minimalist', description: 'Clean and simple design' }
];

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onSignIn, onSignOut, user }) => {
  const [promptInput, setPromptInput] = useState('');
  const [typewriterText, setTypewriterText] = useState('');
  const [selectedDesign, setSelectedDesign] = useState(designStyles[0]);
  const [showDesignDropdown, setShowDesignDropdown] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Typewriter effect hook
  useEffect(() => {
    // Don't run typewriter if user is typing
    if (promptInput) {
      setTypewriterText('');
      return;
    }

    let currentIndex = 0;
    let currentText = '';
    let isDeleting = false;
    let charIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const type = () => {
      const currentExample = gameExamples[currentIndex];

      if (!isDeleting) {
        // Typing forward
        currentText = currentExample.substring(0, charIndex + 1);
        charIndex++;
        setTypewriterText(currentText);

        if (charIndex === currentExample.length) {
          // Finished typing, pause then start deleting
          timeoutId = setTimeout(() => {
            isDeleting = true;
            type();
          }, 2000);
        } else {
          timeoutId = setTimeout(type, 50);
        }
      } else {
        // Deleting backward
        currentText = currentExample.substring(0, charIndex - 1);
        charIndex--;
        setTypewriterText(currentText);

        if (charIndex === 0) {
          // Finished deleting, pause then move to next example
          isDeleting = false;
          currentIndex = (currentIndex + 1) % gameExamples.length;
          timeoutId = setTimeout(type, 500);
        } else {
          timeoutId = setTimeout(type, 30);
        }
      }
    };

    type();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [promptInput]);

  const handleSubmit = () => {
    if (!promptInput.trim()) return;

    let fullPrompt = promptInput.trim();
    // Add design style to prompt if not default
    if (selectedDesign.id === 'neon') {
      fullPrompt += ` (Style: Use a dark, neon, cyberpunk aesthetic with glowing effects)`;
    } else if (selectedDesign.id !== 'default') {
      fullPrompt += ` (Style: ${selectedDesign.name})`;
    }
    // Default style: AI chooses style fitting to the game

    if (user) {
      // User is already logged in - go directly to studio with prompt
      localStorage.setItem('pendingGamePrompt', fullPrompt);
      if (attachedFile) {
        localStorage.setItem('pendingGameHasAttachment', 'true');
      }
      onEnter(); // Go to studio/app
    } else {
      // User not logged in - store prompt and show auth
      localStorage.setItem('pendingGamePrompt', fullPrompt);
      if (attachedFile) {
        localStorage.setItem('pendingGameHasAttachment', 'true');
      }
      onSignIn(); // Show auth page first
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && promptInput.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setAttachedFile(file);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans overflow-x-hidden relative">
      {/* Snake Game Background */}
      <SnakeBackground />

      {/* Background Grid Animation */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 animate-pulse pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950/50 via-gray-950/80 to-gray-950 pointer-events-none"></div>

      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold shadow-[0_0_15px_rgba(79,70,229,0.5)]">
            <Gamepad2 size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">Playable</span>
        </div>
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-300">{user.name}</span>
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={onSignIn}
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Sign In
          </button>
        )}
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900 border border-gray-800 text-xs font-mono text-indigo-400 mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          AI Game Engine v2.0 Live
        </div>

        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-600 max-w-4xl animate-fade-in">
          Build. Play. <br/> Share.
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mb-12 animate-fade-in" style={{ animationDelay: '100ms' }}>
          Create games by chatting with AI. No Coding required. Just pure imagination.
        </p>

        {/* Game Prompt Input Field */}
        <div className="w-full max-w-4xl mb-8 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <div className="relative bg-gray-900/70 border-2 border-gray-800 rounded-2xl p-4 backdrop-blur hover:border-indigo-600/50 transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)]">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Textarea */}
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={typewriterText}
              rows={3}
              className="w-full bg-transparent text-lg text-white placeholder-gray-500 resize-none focus:outline-none mb-3"
            />

            {/* Attached File Preview */}
            {attachedFile && (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg w-fit">
                <Paperclip size={16} className="text-indigo-400" />
                <span className="text-sm text-gray-300">{attachedFile.name}</span>
                <button
                  onClick={handleRemoveFile}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Bottom Bar with Buttons */}
            <div className="flex items-center justify-between">
              {/* Left side buttons */}
              <div className="flex items-center gap-2">
                {/* Attach Button */}
                <button
                  onClick={handleAttachClick}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white rounded-lg transition-all text-sm"
                  title="Attach image for inspiration"
                >
                  <Paperclip size={18} />
                  <span>Attach</span>
                </button>

                {/* Design Style Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowDesignDropdown(!showDesignDropdown)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white rounded-lg transition-all text-sm"
                  >
                    <Palette size={18} />
                    <span>{selectedDesign.name}</span>
                    <ChevronDown size={16} className={`transition-transform ${showDesignDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showDesignDropdown && (
                    <div className="absolute left-0 top-full mt-2 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden z-50">
                      {designStyles.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => {
                            setSelectedDesign(style);
                            setShowDesignDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors ${
                            selectedDesign.id === style.id ? 'bg-gray-800' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Palette size={18} className={selectedDesign.id === style.id ? 'text-indigo-400' : 'text-gray-400'} />
                            <div>
                              <div className={`text-sm font-medium ${selectedDesign.id === style.id ? 'text-indigo-400' : 'text-white'}`}>
                                {style.name}
                              </div>
                              <div className="text-xs text-gray-400">{style.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - Submit button */}
              <button
                onClick={handleSubmit}
                disabled={!promptInput.trim()}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]"
                title="Submit prompt"
              >
                <ArrowRight size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 animate-fade-in" style={{ animationDelay: '250ms' }}>
          <button
            onClick={onEnter}
            className="group px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] flex items-center gap-2 justify-center"
          >
            Start Creating <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={onEnter}
            className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white border border-gray-800 hover:border-gray-700 rounded-xl font-bold text-lg transition-all"
          >
            Explore Games
          </button>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-12 mt-32 text-center text-gray-600 text-sm">
        <p>&copy; {new Date().getFullYear()} Playable. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};
