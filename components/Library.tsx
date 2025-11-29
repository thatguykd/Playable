
import React from 'react';
import { PublishedGame } from '../types';
import { Play, User, Bookmark, Gamepad2 } from 'lucide-react';

interface LibraryProps {
  savedGames: PublishedGame[];
  onPlay: (game: PublishedGame) => void;
  onRemove: (gameId: string) => void;
}

export const Library: React.FC<LibraryProps> = ({ savedGames, onPlay, onRemove }) => {

  const handleRemove = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    onRemove(gameId);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-925 p-8">
      <div className="max-w-7xl mx-auto w-full">
        {/* Enhanced Header with Gradient */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent rounded-2xl blur-2xl"></div>
          <div className="relative flex items-center gap-4 p-6 bg-gradient-to-r from-gray-900 to-gray-900/50 rounded-2xl border border-gray-800/50">
            <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              <Bookmark size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Your Library</h1>
              <p className="text-sm text-gray-400 mt-1">Collection of your saved games.</p>
            </div>
            <div className="ml-auto">
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-400">{savedGames.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Saved</div>
              </div>
            </div>
          </div>
        </div>

        {savedGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-800 rounded-2xl bg-gray-900/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
            <div className="relative">
              <div className="w-20 h-20 bg-purple-900/20 rounded-full flex items-center justify-center mb-6 text-purple-500/50 border border-purple-500/20">
                <Gamepad2 size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-300 mb-3">No Saved Games</h3>
              <p className="text-gray-500 text-sm max-w-md text-center leading-relaxed">
                Browse the Discover feed to find and save games you want to play later.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {savedGames.map((game) => (
              <div
                key={game.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:translate-y-[-4px] transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/30 cursor-pointer flex flex-col group relative"
                onClick={() => onPlay(game)}
              >
                {/* Remove Button with Enhanced Purple Style */}
                <button
                  onClick={(e) => handleRemove(e, game.id)}
                  className="absolute top-2 left-2 p-1.5 rounded-lg z-20 transition-all duration-200 text-purple-400 bg-purple-900/30 hover:bg-red-900/40 hover:text-red-400 hover:scale-110 shadow-lg"
                  title="Remove from Library"
                >
                  <Bookmark size={14} fill="currentColor" />
                </button>

                {/* Thumbnail Section with Purple Overlay */}
                <div className="h-32 bg-gray-950 relative flex items-center justify-center border-b border-gray-800 overflow-hidden">
                  <div className="absolute inset-0 bg-purple-900/5 group-hover:bg-purple-900/10 transition-colors duration-300"></div>

                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-gray-800/90 backdrop-blur-sm rounded text-[10px] text-gray-400 font-mono z-10 border border-gray-700">
                    {game.category}
                  </div>

                  {game.thumbnail ? (
                    <img
                      src={game.thumbnail}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-purple-900/20 flex items-center justify-center border border-purple-500/20">
                      <Play size={20} className="text-purple-500/50 ml-1" />
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-b-xl"></div>

                  <div className="relative z-10">
                    <h3 className="font-bold text-gray-100 text-base mb-1 truncate group-hover:text-purple-200 transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">
                      {game.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-gray-600 pt-3 border-t border-gray-800 mt-auto">
                      <span className="flex items-center gap-1">
                        <User size={10} /> {game.author}
                      </span>
                      <span className="font-mono text-purple-400 group-hover:text-purple-300 transition-colors">
                        {game.plays} plays
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
