import React, { useRef, useEffect, useState } from 'react';
import { Message, GameStatus, GameVersion } from '../types';
import { Send, Bot, User, Sparkles, History, FilePlus, Paperclip, Palette, X, ChevronDown, ArrowRight, Gamepad2 } from 'lucide-react';
import { VersionHistory } from './VersionHistory';

const designStyles = [
  { id: 'neon', name: 'Neon Style', description: 'Vibrant neon colors with glowing effects' },
  { id: 'colorful', name: 'Colorful', description: 'Bright and playful color palette' },
  { id: 'mystical', name: 'Mystical', description: 'Dark and mysterious aesthetic' },
  { id: 'retro', name: 'Retro Pixel', description: 'Classic 8-bit pixel art style' },
  { id: 'minimalist', name: 'Minimalist', description: 'Clean and simple design' }
];

const emptyStateExamples = [
  "Create a space invaders game where enemies drop power-ups...",
  "Build a flappy bird clone with portals instead of pipes...",
  "Make a typing game where words fall from the sky like Tetris...",
  "Design a pong game but the ball splits into two when hit...",
  "Create a platformer where gravity reverses when you jump..."
];

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onNewGame?: () => void;
  status: GameStatus;
  generationProgress?: string;
  gameVersions?: GameVersion[];
  currentVersion?: number;
  onRestoreVersion?: (version: GameVersion) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, onSendMessage, onNewGame, status, generationProgress, gameVersions = [], currentVersion = 0, onRestoreVersion }) => {
  const [input, setInput] = React.useState('');
  const [showVersionDropdown, setShowVersionDropdown] = React.useState(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(designStyles[0]);
  const [showDesignDropdown, setShowDesignDropdown] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [typewriterText, setTypewriterText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowVersionDropdown(false);
      }
    };

    if (showVersionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVersionDropdown]);

  // Typewriter effect for empty state
  useEffect(() => {
    // Only run if there are no messages
    if (messages.length > 0) {
      setTypewriterText('');
      return;
    }

    let currentIndex = 0;
    let currentText = '';
    let isDeleting = false;
    let charIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const type = () => {
      const currentExample = emptyStateExamples[currentIndex];

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
          currentIndex = (currentIndex + 1) % emptyStateExamples.length;
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
  }, [messages.length]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || status === GameStatus.GENERATING) return;

    let fullPrompt = input.trim();
    // Add design style to prompt if not default
    if (selectedDesign.id !== 'neon') {
      fullPrompt += ` (Style: ${selectedDesign.name})`;
    }

    onSendMessage(fullPrompt);
    setInput('');
    setAttachedFile(null); // Clear attached file after sending
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
    <div className="flex flex-col h-full bg-gray-950 border-r border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-950 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <Bot size={18} />
          </div>
          <div>
            <h1 className="font-bold text-gray-100 text-sm tracking-wide">Playable Dev</h1>
            <p className="text-[10px] text-gray-500 font-mono uppercase">POWERED BY AVA</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* New Game Button */}
          {messages.length > 0 && onNewGame && (
            <button
              onClick={() => setShowNewGameConfirm(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 hover:border-green-500/30"
              title="Start a new game"
            >
              <FilePlus size={16} />
            </button>
          )}

          {/* Version History Dropdown */}
          <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowVersionDropdown(!showVersionDropdown)}
            className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/30"
            title="View version history"
          >
            <History size={16} />
          </button>

          {/* Dropdown Menu */}
          {showVersionDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 animate-fade-in">
              {gameVersions.length > 0 && onRestoreVersion ? (
                <VersionHistory
                  versions={gameVersions}
                  currentVersion={currentVersion}
                  onRestore={(version) => {
                    onRestoreVersion(version);
                    setShowVersionDropdown(false);
                  }}
                />
              ) : (
                <div className="p-6 text-center">
                  <History size={32} className="mx-auto mb-3 text-gray-600" />
                  <p className="text-sm text-gray-400 mb-1">No version history yet</p>
                  <p className="text-xs text-gray-500">Previous versions will appear here</p>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* New Game Confirmation Dialog */}
      {showNewGameConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-gray-100 mb-2">Start a new game?</h3>
            <p className="text-sm text-gray-400 mb-6">
              Your current progress is auto-saved and can be accessed through version history.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowNewGameConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onNewGame?.();
                  setShowNewGameConfirm(false);
                }}
                className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
              >
                Start New Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-8">
            <Gamepad2 size={40} className="mb-4 text-indigo-400" />
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Build Your Game</h3>
            <p className="text-gray-400 max-w-sm text-sm min-h-[3rem] flex items-center justify-center">
              "{typewriterText}"
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1
              ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}
            `}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`
              max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm
              ${msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-gray-900 text-gray-300 border border-gray-800 rounded-tl-none'}
            `}>
              {msg.text}
            </div>
          </div>
        ))}
        {status === GameStatus.GENERATING && (
          <div className="flex gap-4 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 mt-1">
              <Bot size={16} className="text-gray-400" />
            </div>
            <div className="bg-gray-900 text-gray-400 rounded-2xl rounded-tl-none p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              {generationProgress && (
                <div className="text-sm text-indigo-400/80 font-mono">
                  {generationProgress}
                </div>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-gray-950 border-t border-gray-800">
        <div className="relative bg-gray-900/70 border-2 border-gray-800 rounded-xl p-3 backdrop-blur hover:border-indigo-600/50 transition-all shadow-lg">
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
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your game concept..."
            rows={2}
            className="w-full bg-transparent text-sm text-white placeholder-gray-500 resize-none focus:outline-none mb-2 scrollbar-hide"
            disabled={status === GameStatus.GENERATING}
          />

          {/* Attached File Preview */}
          {attachedFile && (
            <div className="mb-2 flex items-center gap-2 px-2 py-1.5 bg-gray-800/50 rounded-lg w-fit">
              <Paperclip size={14} className="text-indigo-400" />
              <span className="text-xs text-gray-300">{attachedFile.name}</span>
              <button
                onClick={handleRemoveFile}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Bottom Bar with Buttons */}
          <div className="flex items-center justify-between">
            {/* Left side buttons */}
            <div className="flex items-center gap-1.5">
              {/* Attach Button */}
              <button
                onClick={handleAttachClick}
                disabled={status === GameStatus.GENERATING}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white rounded-lg transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                title="Attach image for inspiration"
              >
                <Paperclip size={14} />
                <span>Attach</span>
              </button>

              {/* Design Style Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDesignDropdown(!showDesignDropdown)}
                  disabled={status === GameStatus.GENERATING}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white rounded-lg transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Palette size={14} />
                  <span>{selectedDesign.name}</span>
                  <ChevronDown size={12} className={`transition-transform ${showDesignDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showDesignDropdown && (
                  <div className="absolute left-0 bottom-full mb-2 w-56 bg-gray-900 border border-gray-800 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden z-50">
                    {designStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => {
                          setSelectedDesign(style);
                          setShowDesignDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-800 transition-colors ${
                          selectedDesign.id === style.id ? 'bg-gray-800' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Palette size={14} className={selectedDesign.id === style.id ? 'text-indigo-400' : 'text-gray-400'} />
                          <div>
                            <div className={`text-xs font-medium ${selectedDesign.id === style.id ? 'text-indigo-400' : 'text-white'}`}>
                              {style.name}
                            </div>
                            <div className="text-[10px] text-gray-400">{style.description}</div>
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
              disabled={!input.trim() || status === GameStatus.GENERATING}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]"
              title="Send message"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};