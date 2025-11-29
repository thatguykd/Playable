
import React from 'react';
import { Gamepad2, Layers, Cpu, Code, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
  onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onSignIn }) => {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans overflow-x-hidden relative">
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
        <button 
          onClick={onSignIn}
          className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          Sign In
        </button>
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
          Turn your text descriptions into playable games instantly. No coding required. Just pure imagination powered by Gemini 2.5.
        </p>

        <div className="flex flex-col md:flex-row gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <button 
            onClick={onEnter}
            className="group px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] flex items-center gap-2"
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

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full animate-fade-in" style={{ animationDelay: '300ms' }}>
           <div className="p-8 bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl text-left hover:border-indigo-500/30 transition-colors">
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mb-6 text-indigo-400">
                 <Code size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Text to Code</h3>
              <p className="text-gray-500">Describe mechanics, visuals, and rules. Our AI architect handles the complex logic.</p>
           </div>
           <div className="p-8 bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl text-left hover:border-indigo-500/30 transition-colors">
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mb-6 text-indigo-400">
                 <Gamepad2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Instant Play</h3>
              <p className="text-gray-500">Preview games in real-time within the browser. Zero deployment time.</p>
           </div>
           <div className="p-8 bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl text-left hover:border-indigo-500/30 transition-colors">
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mb-6 text-indigo-400">
                 <Layers size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Social Hub</h3>
              <p className="text-gray-500">Publish your masterpieces. Climb global leaderboards. Challenge friends.</p>
           </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-12 text-center text-gray-600 text-sm">
        <p>&copy; {new Date().getFullYear()} Playable. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};
