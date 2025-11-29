

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface GameData {
  html: string;
  version: number;
}

export interface GameVersion {
  id: string;
  versionNumber: number;
  html: string;
  prompt: string;
  timestamp: number;
}

export type SubscriptionTier = 'free' | 'gamedev' | 'pro';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  tier: SubscriptionTier;
  credits: number;
  gamesCreated: number;
  joinedAt: number;
}

export interface PublishedGame {
  id: string;
  title: string;
  description: string;
  author: string;
  authorId?: string; // Link to User
  html: string;
  timestamp: number;
  plays: number;
  isOfficial?: boolean;
  category: 'Arcade' | 'Puzzle' | 'Action' | 'Strategy' | 'Experimental';
  thumbnail?: string;
}

export interface LeaderboardEntry {
  playerName: string;
  score: number;
  date: number;
}

export interface GenAIResponse {
  message: string;
  html: string;
  suggestedTitle?: string;
  suggestedDescription?: string;
}

export enum GameStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR'
}

export type ViewMode = 'feed' | 'studio' | 'play' | 'gaming' | 'settings';
