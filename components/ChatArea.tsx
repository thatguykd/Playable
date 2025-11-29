import React, { useRef, useEffect } from 'react';
import { Message, GameStatus, GameVersion } from '../types';
import { Send, Bot, User, Sparkles, History } from 'lucide-react';
import { VersionHistory } from './VersionHistory';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  status: GameStatus;
  gameVersions?: GameVersion[];
  currentVersion?: number;
  onRestoreVersion?: (version: GameVersion) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, onSendMessage, status, gameVersions = [], currentVersion = 0, onRestoreVersion }) => {
  const [input, setInput] = React.useState('');
  const [showVersionDropdown, setShowVersionDropdown] = React.useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || status === GameStatus.GENERATING) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
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

        {/* Version History Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowVersionDropdown(!showVersionDropdown)}
            disabled={gameVersions.length === 0}
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center border transition-all
              ${gameVersions.length === 0
                ? 'bg-gray-800/30 text-gray-600 border-gray-800/50 cursor-not-allowed'
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/30'
              }
            `}
            title={gameVersions.length === 0 ? 'No version history yet' : 'View version history'}
          >
            <History size={16} />
          </button>

          {/* Dropdown Menu */}
          {showVersionDropdown && gameVersions.length > 0 && onRestoreVersion && (
            <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 animate-fade-in">
              <VersionHistory
                versions={gameVersions}
                currentVersion={currentVersion}
                onRestore={(version) => {
                  onRestoreVersion(version);
                  setShowVersionDropdown(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-8">
            <Sparkles size={40} className="mb-4 text-indigo-400" />
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Build Your Game</h3>
            <p className="text-gray-400 max-w-xs text-sm">
              "Create a cyberpunk snake game" or "Make a platformer with double jump".
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
            <div className="bg-gray-900 text-gray-400 rounded-2xl rounded-tl-none p-4 border border-gray-800 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-950 border-t border-gray-800">
        <form 
          className="relative bg-gray-900 rounded-xl border border-gray-800 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all shadow-lg"
          onSubmit={handleSubmit}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your game concept..."
            className="w-full bg-transparent text-gray-200 p-4 pr-12 h-[60px] max-h-[120px] resize-none focus:outline-none placeholder:text-gray-600 text-sm scrollbar-hide"
            disabled={status === GameStatus.GENERATING}
          />
          <button
            type="submit"
            disabled={!input.trim() || status === GameStatus.GENERATING}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-white disabled:opacity-30 disabled:hover:text-indigo-400 transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};