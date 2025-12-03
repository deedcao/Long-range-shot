
import React, { useState, useEffect, useCallback } from 'react';
import { Environment, GameStatus, ShotResult, TurretState, GameMode, LevelConfig, Language } from './types';
import { calculateImpact, generateLevelEnvironment, getInstructorFeedback } from './services/ballistics';
import { ZOOM_LEVELS, TARGET_SIZE_CM, TRAINING_LEVELS, CAMPAIGN_LEVELS, UI_TEXT } from './constants';
import ControlPanel from './components/ControlPanel';
import Scope from './components/Scope';
import { RefreshCw, Crosshair, Trophy, Target, Play, ChevronRight, ChevronLeft, AlertTriangle, Wind, MoveVertical, Thermometer, Activity, Globe, ShieldAlert, BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [env, setEnv] = useState<Environment>({ distance: 100, humidity: 50, temperature: 15, windDirection: 0, windSpeed: 0 });
  const [turrets, setTurrets] = useState<TurretState>({ elevation: 0, windage: 0 });
  const [zoomIndex, setZoomIndex] = useState(1);
  const [isHoldingBreath, setIsHoldingBreath] = useState(false);
  const [lastShot, setLastShot] = useState<ShotResult | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  
  // Mastery System: Tracks player skill. 
  // +2 for Bullseye, +1 for Good Hit, -1 for Poor Hit, Reset to 0 for Miss.
  // Threshold >= 3 activates "Expert Mode" (No Hints).
  const [masteryScore, setMasteryScore] = useState(0);

  // Helper to get current level config object
  const getCurrentLevelConfig = (): LevelConfig => {
    const levels = gameMode === 'TRAINING' ? TRAINING_LEVELS : CAMPAIGN_LEVELS;
    return levels[currentLevelIndex] || levels[0];
  };

  // --- Game Loop / Controls ---

  // Keyboard Controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      if (!e.repeat) setIsHoldingBreath(true);
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') setIsHoldingBreath(false);
  }, []);

  // Scroll Zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (status !== GameStatus.AIMING) return;
    setZoomIndex(prev => {
      if (e.deltaY < 0) return Math.min(prev + 1, ZOOM_LEVELS.length - 1);
      if (e.deltaY > 0) return Math.max(prev - 1, 0);
      return prev;
    });
  }, [status]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [handleKeyDown, handleKeyUp, handleWheel]);

  // --- Actions ---

  const startBriefing = (mode: GameMode, levelIndex: number) => {
    setGameMode(mode);
    setCurrentLevelIndex(levelIndex);
    
    // Generate environment for this level immediately
    const levels = mode === 'TRAINING' ? TRAINING_LEVELS : CAMPAIGN_LEVELS;
    const config = levels[levelIndex];
    setEnv(generateLevelEnvironment(config));
    
    // Reset Player State
    setTurrets({ elevation: 0, windage: 0 });
    setLastShot(null);
    setStatus(GameStatus.BRIEFING);
  };

  const startGame = () => {
    setStatus(GameStatus.AIMING);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  // Calculate live impact for preview/visuals
  const currentImpact = calculateImpact(env, turrets);

  const fireShot = () => {
    if (status !== GameStatus.AIMING) return;

    // Use the pre-calculated impact
    const impact = currentImpact;
    const errorMagnitude = Math.sqrt(impact.x * impact.x + impact.y * impact.y);
    const targetRadius = TARGET_SIZE_CM / 2;
    const isHit = errorMagnitude < targetRadius;

    // Calculate Ring Score (Integer 0-10)
    // Target Radius = 22.5cm
    // 10 Ring ~ 3.75cm radius
    // 9 Ring ~ 7.5cm radius ...
    // Each ring width = 22.5 / 6 = 3.75cm (approx)
    // Score = 10 - floor(distance / 3.75)
    let rings = 0;
    if (isHit) {
       const ringWidth = targetRadius / 6; // 6 scoring zones (10,9,8,7,6,5)
       // Calculation: If dist is 0 -> 10. If dist is ringWidth*0.9 -> 10.
       // If dist is ringWidth*1.1 -> 9.
       rings = 10 - Math.floor(errorMagnitude / ringWidth);
       if (rings < 5) rings = 5; // Minimum score for hitting the paper is 5 in this simplified target
    }

    // --- Dynamic Difficulty Adjustment ---
    if (isHit) {
      if (rings === 10) {
        setMasteryScore(prev => prev + 2); // Reward precision heavily
      } else if (rings >= 7) {
        setMasteryScore(prev => prev + 1); // Consistent shooting
      } else {
        setMasteryScore(prev => Math.max(0, prev - 1)); // Sloppy hits reduce confidence
      }
    } else {
      setMasteryScore(0); // Miss resets confidence completely
    }

    const result: ShotResult = {
      hit: isHit,
      score: isHit ? rings * 10 : 0, // Legacy support if needed
      rings: rings,
      dropError: impact.y,
      windError: impact.x,
      timestamp: Date.now()
    };

    setLastShot(result);
    setStatus(GameStatus.RESULT);
  };

  const handleNextLevel = () => {
    const levels = gameMode === 'TRAINING' ? TRAINING_LEVELS : CAMPAIGN_LEVELS;
    if (currentLevelIndex + 1 < levels.length) {
      startBriefing(gameMode!, currentLevelIndex + 1);
    } else {
      // Campaign Complete
      setStatus(GameStatus.MENU); 
    }
  };

  const handlePrevLevel = () => {
    if (currentLevelIndex > 0) {
      startBriefing(gameMode!, currentLevelIndex - 1);
    }
  };

  const handleRetry = () => {
    // Preserve environment and turrets to allow correction from previous state
    setLastShot(null);
    setStatus(GameStatus.AIMING);
  };

  const returnToMenu = () => {
    setStatus(GameStatus.MENU);
    setGameMode(null);
    setLastShot(null);
    setMasteryScore(0); // Reset mastery on quit
  };

  // --- Render Helpers ---
  const instructorFeedback = lastShot ? getInstructorFeedback(lastShot, env, language) : [];
  const currentConfig = getCurrentLevelConfig();
  const levels = gameMode === 'TRAINING' ? TRAINING_LEVELS : CAMPAIGN_LEVELS;
  const hasNextLevel = currentLevelIndex + 1 < levels.length;
  
  // Determine active factors for display icons
  const hasWind = currentConfig.constraints.minWind > 0 || currentConfig.constraints.maxWind > 0;
  const hasTemp = currentConfig.constraints.fixedTemp && Math.abs(currentConfig.constraints.fixedTemp - 15) > 5;
  const hasVarDist = currentConfig.constraints.maxDist !== currentConfig.constraints.minDist;
  const hasSway = !currentConfig.constraints.disableSway;

  // Difficulty / Mastery Logic
  const isExpertMode = masteryScore >= 3;
  const t = UI_TEXT[language];
  const currentLevelText = currentConfig.texts[language];

  return (
    <div className="h-screen w-screen bg-black flex flex-col relative select-none overflow-hidden font-sans">
      
      {/* 3D Viewport (Scope) */}
      <div className={`flex-1 relative transition-all duration-1000 ${status === GameStatus.MENU ? 'opacity-20 blur-sm grayscale' : 'opacity-100'}`}>
        <Scope 
          zoom={ZOOM_LEVELS[zoomIndex]} 
          environment={env} 
          turrets={turrets}
          isHoldingBreath={isHoldingBreath}
          lastShot={lastShot}
          currentImpact={currentImpact}
          gameStatus={status}
          disableSway={currentConfig.constraints.disableSway}
          showImpactPredictor={gameMode === 'TRAINING'}
          language={language}
        />
        {/* Breath Bar */}
        {hasSway && (
          <div className={`absolute bottom-40 left-1/2 transform -translate-x-1/2 transition-opacity duration-300 ${isHoldingBreath ? 'opacity-100' : 'opacity-0'}`}>
               <div className="text-blue-300 text-xs font-mono text-center mb-1">{t.holdingBreath}</div>
               <div className="w-32 h-1 bg-gray-800 rounded overflow-hidden">
                 <div className="h-full bg-blue-500 animate-[wiggle_1s_ease-in-out_infinite]" style={{width: '100%'}}></div>
               </div>
          </div>
        )}
      </div>

      {/* UI Layer: Control Panel */}
      {(status === GameStatus.AIMING || status === GameStatus.RESULT) && (
        <ControlPanel 
          turrets={turrets} 
          setTurrets={setTurrets} 
          environment={env} 
          onFire={fireShot}
          canFire={status === GameStatus.AIMING}
          language={language}
        />
      )}

      {/* UI Layer: Main Menu */}
      {status === GameStatus.MENU && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <button 
            onClick={toggleLanguage}
            className="absolute top-6 right-6 flex items-center gap-2 text-gray-400 hover:text-white border border-gray-700 px-4 py-2 rounded-full transition"
          >
            <Globe size={16} />
            <span className="text-sm font-bold">{language === 'en' ? 'English' : '中文'}</span>
          </button>

          <div className="max-w-2xl w-full text-center p-8">
            <div className="mb-12">
              <Crosshair size={80} className="mx-auto text-amber-500 mb-6 animate-spin-slow" style={{animationDuration: '10s'}} />
              <h1 className="text-6xl font-black text-white mb-2 tracking-tighter font-mono-tech">{t.mainTitle}</h1>
              <p className="text-gray-400 text-lg tracking-widest uppercase border-t border-b border-gray-700 py-2 inline-block">{t.subTitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => startBriefing('TRAINING', 0)}
                className="group relative bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-amber-500 p-8 rounded transition-all text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                  <Target size={100} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-amber-500">{t.training}</h3>
                <p className="text-gray-400 text-sm">{t.trainingDesc}</p>
              </button>

              <button 
                onClick={() => startBriefing('CAMPAIGN', 0)}
                className="group relative bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-red-500 p-8 rounded transition-all text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                  <Trophy size={100} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-red-500">{t.campaign}</h3>
                <p className="text-gray-400 text-sm">{t.campaignDesc}</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UI Layer: Briefing Modal */}
      {status === GameStatus.BRIEFING && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 max-w-xl w-full p-8 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-4">
              <AlertTriangle className="text-amber-500" />
              <h2 className="text-2xl font-bold text-white font-mono-tech tracking-wider uppercase">{currentLevelText.title}</h2>
              {isExpertMode && (
                <div className="ml-auto flex items-center gap-2 px-2 py-1 bg-red-900/30 border border-red-800 rounded text-red-400 text-xs font-bold animate-pulse">
                  <BrainCircuit size={14} />
                  {language === 'zh' ? '专家模式' : 'EXPERT MODE'}
                </div>
              )}
            </div>
            
            <div className="space-y-6 text-gray-300 leading-relaxed mb-8">
              <p className="whitespace-pre-line">{currentLevelText.description}</p>
              
              <div className={`p-4 rounded border-l-2 flex gap-3 transition-all duration-500 ${isExpertMode ? 'bg-red-900/20 border-red-600' : 'bg-black/40 border-amber-500'}`}>
                <div className={`min-w-[20px] font-bold ${isExpertMode ? 'text-red-500' : 'text-amber-500'}`}>
                  {isExpertMode ? <ShieldAlert size={20} /> : '!'}
                </div>
                <div className={`text-sm italic whitespace-pre-line ${isExpertMode ? 'text-red-300 font-mono' : 'text-gray-400'}`}>
                  {isExpertMode 
                    ? (language === 'zh' 
                        ? ">> 你的表现极为优异。\n>> 战术指挥部已截断教官通讯。\n>> 依靠你的训练和直觉自主行动。" 
                        : ">> PERFORMANCE RATING: EXCEPTIONAL.\n>> INSTRUCTOR COMMS SEVERED.\n>> PROCEED AUTONOMOUSLY.")
                    : currentLevelText.hint}
                </div>
              </div>

              {/* Level Icons */}
              <div className="flex gap-4 justify-center pt-4 border-t border-gray-800">
                {hasWind && <div className="flex flex-col items-center gap-1 text-blue-400"><Wind size={20} /><span className="text-[10px] uppercase">Wind</span></div>}
                {hasTemp && <div className="flex flex-col items-center gap-1 text-red-400"><Thermometer size={20} /><span className="text-[10px] uppercase">Temp</span></div>}
                {hasVarDist && <div className="flex flex-col items-center gap-1 text-amber-400"><MoveVertical size={20} /><span className="text-[10px] uppercase">Range</span></div>}
                {hasSway && <div className="flex flex-col items-center gap-1 text-green-400"><Activity size={20} /><span className="text-[10px] uppercase">Sway</span></div>}
              </div>
            </div>

            <div className="flex gap-4">
              {currentLevelIndex > 0 && (
                <button 
                  onClick={handlePrevLevel}
                  className="px-4 py-3 border border-gray-600 text-gray-400 hover:text-white hover:bg-gray-800 transition uppercase text-sm font-bold tracking-widest"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <button 
                onClick={returnToMenu}
                className="flex-1 py-3 border border-gray-600 text-gray-400 hover:text-white hover:bg-gray-800 transition uppercase text-sm font-bold tracking-widest"
              >
                {t.abort}
              </button>
              <button 
                onClick={startGame}
                className="flex-[2] py-3 bg-amber-600 hover:bg-amber-500 text-white transition uppercase text-sm font-bold tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                {t.deploy}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UI Layer: Result Modal */}
      {status === GameStatus.RESULT && lastShot && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className={`bg-gray-900 border-2 ${lastShot.hit ? 'border-green-500' : 'border-red-500'} max-w-lg w-full p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto`}>
            
            <div className="text-center mb-6">
              <h2 className={`text-5xl font-black font-mono-tech mb-2 ${lastShot.hit ? 'text-green-500' : 'text-red-500'}`}>
                {lastShot.hit ? t.targetDown : t.missionFailed}
              </h2>
              {lastShot.hit && (
                <div className="text-2xl text-white font-mono-tech">
                  {lastShot.rings} {t.rings}
                </div>
              )}
              <div className="text-sm text-gray-500 mt-2">{new Date(lastShot.timestamp).toLocaleTimeString()}</div>
            </div>

            {/* Instructor Feedback Section */}
            <div className="bg-black/50 p-4 rounded mb-6 border border-gray-800">
              <h3 className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-3 border-b border-gray-800 pb-2">
                {t.instructorFeedback}
              </h3>
              <div className="space-y-2">
                 {instructorFeedback.map((line, idx) => (
                   <div key={idx} className={`text-sm flex items-start gap-2 ${line.startsWith("---") ? "opacity-50 my-1" : "text-gray-300"}`}>
                     {!line.startsWith("---") && <span className="text-amber-500 mt-0.5">›</span>}
                     <span className={line.includes("Correction") || line.includes("修正") ? "text-amber-400 font-bold" : ""}>{line.replace("---", "")}</span>
                   </div>
                 ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleRetry}
                className="flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 text-white transition uppercase text-sm font-bold tracking-widest"
              >
                <RefreshCw size={16} /> {t.retry}
              </button>
              
              {lastShot.hit && hasNextLevel ? (
                <button 
                  onClick={handleNextLevel}
                  className="flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 text-white transition uppercase text-sm font-bold tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                >
                  {t.nextMission} <ChevronRight size={16} />
                </button>
              ) : (
                <button 
                  onClick={returnToMenu}
                  className="flex items-center justify-center gap-2 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 transition uppercase text-sm font-bold tracking-widest"
                >
                  {t.abort}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default App;
