import React from 'react';
import { History, RotateCcw, Clock } from 'lucide-react';
import { GameVersion } from '../types';

interface VersionHistoryProps {
  versions: GameVersion[];
  currentVersion: number;
  onRestore: (version: GameVersion) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ versions, currentVersion, onRestore }) => {
  if (versions.length === 0) {
    return null;
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="border-t border-gray-800 bg-gray-950 p-4">
      <div className="flex items-center gap-2 mb-3">
        <History size={16} className="text-gray-500" />
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Version History</h3>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {versions.map((version) => {
          const isCurrent = version.versionNumber === currentVersion;

          return (
            <div
              key={version.id}
              className={`p-3 rounded-lg border transition-all ${
                isCurrent
                  ? 'bg-indigo-900/20 border-indigo-500/30'
                  : 'bg-gray-900 border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrent ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400'
                  }`}>
                    v{version.versionNumber}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>{formatTime(version.timestamp)}</span>
                  </div>
                </div>

                {!isCurrent && (
                  <button
                    onClick={() => onRestore(version)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded transition-colors"
                  >
                    <RotateCcw size={12} />
                    Restore
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-400 line-clamp-2">
                {version.prompt}
              </p>

              {isCurrent && (
                <div className="mt-2 pt-2 border-t border-indigo-500/20">
                  <span className="text-xs text-indigo-400 font-medium">Current Version</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {versions.length >= 5 && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <p className="text-xs text-gray-600 text-center">
            Showing last 5 versions
          </p>
        </div>
      )}
    </div>
  );
};
