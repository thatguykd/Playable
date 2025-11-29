import React from 'react';
import { LeaderboardEntry } from '../types';
import { Trophy, Medal } from 'lucide-react';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, loading }) => {
  return (
    <div className="bg-gray-950 border-l border-gray-800 h-full flex flex-col w-72 shrink-0">
      <div className="p-5 border-b border-gray-800 flex items-center gap-3">
        <Trophy size={18} className="text-yellow-500" />
        <h3 className="font-bold text-gray-100 text-sm tracking-wide uppercase">Leaderboard</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
           <div className="p-4 text-center text-gray-600 text-xs animate-pulse">Syncing scores...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Medal size={20} className="text-gray-700" />
            </div>
            <p className="text-sm text-gray-500 font-medium">No scores yet</p>
            <p className="text-xs text-gray-600 mt-1">Be the first to claim victory.</p>
          </div>
        ) : (
            <div className="space-y-1">
                {entries.map((entry, idx) => (
                    <div key={idx} className="flex items-center p-3 rounded-lg hover:bg-gray-900 transition-colors">
                        <div className={`
                            w-6 h-6 rounded flex items-center justify-center text-xs font-bold mr-3
                            ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500' : 
                              idx === 1 ? 'bg-gray-400/20 text-gray-400' : 
                              idx === 2 ? 'bg-orange-500/20 text-orange-500' : 
                              'bg-gray-800 text-gray-500'}
                        `}>
                            {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-200 font-medium truncate">{entry.playerName}</p>
                            <p className="text-[10px] text-gray-600">{new Date(entry.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-mono text-indigo-400 font-bold">{entry.score}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
