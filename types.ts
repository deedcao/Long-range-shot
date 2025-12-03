
export type Language = 'en' | 'zh';

export interface Environment {
  windSpeed: number; // m/s
  windDirection: number; // degrees (0-360, 0 is North/Top)
  temperature: number; // Celsius
  humidity: number; // Percentage 0-100
  distance: number; // Meters
}

export interface TurretState {
  elevation: number; // MILs
  windage: number; // MILs
}

export interface ShotResult {
  hit: boolean;
  score: number; // Legacy score 0-100
  rings: number; // 0-10 integers
  dropError: number; // cm
  windError: number; // cm
  timestamp: number;
}

export interface Point {
  x: number;
  y: number;
}

export enum GameStatus {
  MENU = 'MENU',
  BRIEFING = 'BRIEFING',
  AIMING = 'AIMING',
  RESULT = 'RESULT'
}

export interface LevelText {
  title: string;
  description: string;
  hint: string;
}

export interface LevelConfig {
  id: string;
  texts: Record<Language, LevelText>;
  constraints: {
    minDist: number;
    maxDist: number;
    minWind: number;
    maxWind: number;
    fixedWindDir?: number; // Optional fixed direction for tutorials
    fixedTemp?: number;
    disableSway?: boolean; // If true, scope is perfectly stable
  };
}

export type GameMode = 'TRAINING' | 'CAMPAIGN';
