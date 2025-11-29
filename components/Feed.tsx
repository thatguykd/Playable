
import React from 'react';
import { PublishedGame } from '../types';
import { Play, User, Star, Zap, Gamepad2, Bookmark } from 'lucide-react';

interface FeedProps {
  games: PublishedGame[];
  onPlay: (game: PublishedGame) => void;
  savedGameIds: string[];
  onToggleSave: (gameId: string) => void;
}

export const Feed: React.FC<FeedProps> = ({ games, onPlay, savedGameIds, onToggleSave }) => {
  const officialGames = games.filter(g => g.isOfficial);
  const communityGames = games.filter(g => !g.isOfficial);
  const featuredGame = officialGames.length > 0 ? officialGames[0] : games[0];

  const handleSaveClick = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    onToggleSave(gameId);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-925">
      <div className="max-w-7xl mx-auto w-full pb-20">
        
        {/* Featured Section */}
        {featuredGame && (
          <div className="relative h-[400px] w-full bg-gray-900 border-b border-gray-800 group overflow-hidden cursor-pointer" onClick={() => onPlay(featuredGame)}>
            {/* Background Image or Pattern */}
            <div className="absolute inset-0 bg-gray-900">
               {featuredGame.thumbnail ? (
                  <img src={featuredGame.thumbnail} alt={featuredGame.title} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
               ) : (
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
               )}
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent"></div>
            
            {/* Content */}
            <div className="absolute bottom-0 left-0 p-10 max-w-2xl z-10">
              <div className="flex items-center gap-2 mb-4">
                 <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                    Featured
                 </span>
                 <span className="flex items-center gap-1 text-xs text-indigo-300 font-mono">
                    <Star size={12} fill="currentColor" /> {featuredGame.plays.toLocaleString()} Plays
                 </span>
              </div>
              <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight group-hover:text-indigo-400 transition-colors shadow-sm">
                {featuredGame.title}
              </h1>
              <p className="text-lg text-gray-200 mb-8 leading-relaxed line-clamp-2">
                {featuredGame.description}
              </p>
              <div className="flex gap-4">
                <button className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors">
                    <Play size={18} fill="currentColor" /> Play Now
                </button>
                <button 
                    onClick={(e) => handleSaveClick(e, featuredGame.id)}
                    className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors font-bold ${
                        savedGameIds.includes(featuredGame.id) 
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                        : 'bg-gray-900/50 border-gray-700 text-white hover:bg-gray-800'
                    }`}
                >
                    <Bookmark size={18} fill={savedGameIds.includes(featuredGame.id) ? "currentColor" : "none"} />
                    {savedGameIds.includes(featuredGame.id) ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-8">
          {/* Official Games Section */}
          {officialGames.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <Gamepad2 className="text-indigo-500" size={24} />
                <h2 className="text-2xl font-bold text-white tracking-tight">Playable Originals</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {officialGames.slice(1).map((game) => (
                   <div 
                    key={game.id} 
                    className="flex bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all cursor-pointer group h-48 relative"
                    onClick={() => onPlay(game)}
                  >
                    <button 
                        onClick={(e) => handleSaveClick(e, game.id)}
                        className={`absolute top-2 right-2 p-2 rounded-lg z-20 transition-colors ${
                            savedGameIds.includes(game.id)
                            ? 'text-indigo-400 bg-indigo-900/20'
                            : 'text-gray-500 hover:text-white bg-gray-900/50'
                        }`}
                    >
                        <Bookmark size={16} fill={savedGameIds.includes(game.id) ? "currentColor" : "none"} />
                    </button>

                    <div className="w-1/3 bg-gray-950 flex items-center justify-center relative overflow-hidden">
                       {game.thumbnail ? (
                           <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                       ) : (
                           <>
                               <div className="absolute inset-0 bg-indigo-900/10 group-hover:bg-indigo-900/20 transition-colors"></div>
                               <Zap size={32} className="text-gray-700 group-hover:text-indigo-400 transition-colors" />
                           </>
                       )}
                    </div>
                    <div className="w-2/3 p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                             <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{game.category}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{game.title}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2">{game.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Community Games Section */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <User className="text-green-500" size={24} />
              <h2 className="text-2xl font-bold text-white tracking-tight">Community Creations</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {communityGames.map((game) => (
                <div 
                  key={game.id} 
                  className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:translate-y-[-4px] transition-all hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer flex flex-col group relative"
                  onClick={() => onPlay(game)}
                >
                  <button 
                        onClick={(e) => handleSaveClick(e, game.id)}
                        className={`absolute top-2 left-2 p-1.5 rounded-lg z-20 transition-colors ${
                            savedGameIds.includes(game.id)
                            ? 'text-indigo-400 bg-indigo-900/20'
                            : 'text-gray-500 hover:text-white bg-gray-900/80 opacity-0 group-hover:opacity-100'
                        }`}
                    >
                        <Bookmark size={14} fill={savedGameIds.includes(game.id) ? "currentColor" : "none"} />
                    </button>

                  <div className="h-32 bg-gray-950 relative flex items-center justify-center border-b border-gray-800 overflow-hidden">
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-400 font-mono z-10">
                        {game.category}
                      </div>
                      
                      {game.thumbnail ? (
                        <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                         <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
                            <Play size={20} className="text-gray-500 ml-1" />
                         </div>
                      )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-gray-100 text-base mb-1 truncate">{game.title}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">{game.description}</p>
                      
                      <div className="flex items-center justify-between text-[10px] text-gray-600 pt-3 border-t border-gray-800 mt-auto">
                        <span className="flex items-center gap-1">
                            <User size={10} /> {game.author}
                        </span>
                        <span className="font-mono text-indigo-400">
                             {game.plays} plays
                        </span>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
