
import React from 'react';
import { Gamepad2, Layers, Cpu, Code, ArrowRight, Zap, Users, Sparkles } from 'lucide-react';
import SnakeBackground from './SnakeBackground';

interface LandingPageProps {
  onEnter: () => void;
  onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onSignIn }) => {
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

      </main>

      {/* Enhanced Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32">

        {/* Section 1: Text to Code */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-32 animate-fade-in">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-400 mb-4">
              01
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Text to Code
            </h2>
            <p className="text-xl text-gray-400 mb-6">
              Describe mechanics, visuals, and rules in plain English. Our AI architect powered by Gemini 2.5 handles the complex logic, turning your ideas into fully functional HTML5 games.
            </p>
            <div className="space-y-3 text-gray-500">
              <p className="flex items-start gap-2">
                <Code size={20} className="text-cyan-400 mt-1 flex-shrink-0" />
                <span><strong className="text-white">Perfect for game jams:</strong> Go from concept to playable prototype in minutes, not hours.</span>
              </p>
              <p className="flex items-start gap-2">
                <Code size={20} className="text-cyan-400 mt-1 flex-shrink-0" />
                <span><strong className="text-white">Rapid prototyping:</strong> Test game mechanics instantly without writing a single line of code.</span>
              </p>
              <p className="flex items-start gap-2">
                <Code size={20} className="text-cyan-400 mt-1 flex-shrink-0" />
                <span><strong className="text-white">Bring ideas to life:</strong> No technical barriers between your imagination and reality.</span>
              </p>
            </div>
          </div>
          <div className="relative h-80 md:h-96">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl border border-cyan-500/30 backdrop-blur flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Code size={64} className="mx-auto mb-4 text-cyan-400" />
                <p className="text-sm">Studio Interface Preview</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Instant Play */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-32 animate-fade-in">
          <div className="relative h-80 md:h-96 md:order-1">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl border border-pink-500/30 backdrop-blur flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Gamepad2 size={64} className="mx-auto mb-4 text-pink-400" />
                <p className="text-sm">Live Game Preview</p>
              </div>
            </div>
          </div>
          <div className="md:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs font-mono text-pink-400 mb-4">
              02
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Instant Play
            </h2>
            <p className="text-xl text-gray-400 mb-6">
              Preview games in real-time within your browser. Zero deployment time, zero setup. Changes reflect instantly as you iterate and refine your creation.
            </p>
            <div className="space-y-3 text-gray-500">
              <p className="flex items-start gap-2">
                <Gamepad2 size={20} className="text-pink-400 mt-1 flex-shrink-0" />
                <span><strong className="text-white">For educators:</strong> Teach game design concepts with immediate visual feedback.</span>
              </p>
              <p className="flex items-start gap-2">
                <Gamepad2 size={20} className="text-pink-400 mt-1 flex-shrink-0" />
                <span><strong className="text-white">For content creators:</strong> Generate unique games for streams, videos, and audience engagement.</span>
              </p>
              <p className="flex items-start gap-2">
                <Gamepad2 size={20} className="text-pink-400 mt-1 flex-shrink-0" />
                <span><strong className="text-white">Testing gameplay:</strong> Quickly validate mechanics before committing to full development.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Social Hub */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-32 animate-fade-in">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-400 mb-4">
              03
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Social Hub
            </h2>
            <p className="text-xl text-gray-400 mb-6">
              Publish your masterpieces to our vibrant community. Compete on global leaderboards, challenge friends, and discover games created by thousands of developers worldwide.
            </p>
            <div className="space-y-3 text-gray-500">
              <p className="flex items-start gap-2">
                <Layers size={20} className="text-indigo-400 mt-1 flex-shrink-0" />
                <span><strong className="text-white">Community engagement:</strong> Share your games and get instant feedback from players.</span>
              </p>
              <p className="flex items-start gap-2">
                <Layers size={20} className="text-indigo-400 mt-1 flex-shrink-0" />
                <span><strong className="text-white">Competitions:</strong> Host tournaments with built-in leaderboard tracking.</span>
              </p>
              <p className="flex items-start gap-2">
                <Layers size={20} className="text-indigo-400 mt-1 flex-shrink-0" />
                <span><strong className="text-white">Showcase creativity:</strong> Build your portfolio of playable games to share anywhere.</span>
              </p>
            </div>
          </div>
          <div className="relative h-80 md:h-96">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30 backdrop-blur flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Users size={64} className="mx-auto mb-4 text-indigo-400" />
                <p className="text-sm">Leaderboard & Community</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: AI-Powered Iterations */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-16 animate-fade-in">
          <div className="relative h-80 md:h-96 md:order-1">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl border border-emerald-500/30 backdrop-blur flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Sparkles size={64} className="mx-auto mb-4 text-emerald-400" />
                <p className="text-sm">Iterative Development</p>
              </div>
            </div>
          </div>
          <div className="md:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 mb-4">
              04
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              AI-Powered Iterations
            </h2>
            <p className="text-xl text-gray-400 mb-6">
              Refine your games with conversational edits. Add features, tweak mechanics, or completely transform gameplay—all through simple text commands. Full version history lets you restore any previous iteration.
            </p>
            <div className="space-y-3 text-gray-500">
              <p className="flex items-start gap-2">
                <Sparkles size={20} className="text-emerald-400 mt-1 flex-shrink-0" />
                <span><strong className="text-white">Refining games:</strong> "Make it harder", "Add power-ups", "Change the theme to space".</span>
              </p>
              <p className="flex items-start gap-2">
                <Sparkles size={20} className="text-emerald-400 mt-1 flex-shrink-0" />
                <span><strong className="text-white">Adding features:</strong> Build on existing games without starting from scratch.</span>
              </p>
              <p className="flex items-start gap-2">
                <Sparkles size={20} className="text-emerald-400 mt-1 flex-shrink-0" />
                <span><strong className="text-white">Collaborative creation:</strong> Perfect for teams iterating on game concepts together.</span>
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-12 text-center text-gray-600 text-sm">
        <p>&copy; {new Date().getFullYear()} Playable. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};
