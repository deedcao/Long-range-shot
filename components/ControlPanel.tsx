
import React, { useRef, useEffect } from 'react';
import { TurretState, Environment, Language } from '../types';
import { generateRangeCard } from '../services/ballistics';
import { UI_TEXT } from '../constants';
import { RotateCcw, RotateCw, Wind, Thermometer, Droplets } from 'lucide-react';

interface Props {
  turrets: TurretState;
  setTurrets: React.Dispatch<React.SetStateAction<TurretState>>;
  environment: Environment;
  onFire: () => void;
  canFire: boolean;
  language: Language;
}

const ControlPanel: React.FC<Props> = ({ turrets, setTurrets, environment, onFire, canFire, language }) => {
  const rangeCard = React.useMemo(() => generateRangeCard(environment.temperature), [environment.temperature]);
  const t = UI_TEXT[language];

  // Refs for continuous adjustment timers
  const timeoutRef = useRef<number | undefined>(undefined);
  const intervalRef = useRef<number | undefined>(undefined);

  const adjust = (type: 'elevation' | 'windage', amount: number) => {
    setTurrets(prev => ({
      ...prev,
      [type]: parseFloat((prev[type] + amount).toFixed(1))
    }));
  };

  const stopAdjusting = () => {
    if (timeoutRef.current !== undefined) window.clearTimeout(timeoutRef.current);
    if (intervalRef.current !== undefined) window.clearInterval(intervalRef.current);
    timeoutRef.current = undefined;
    intervalRef.current = undefined;
  };

  const startAdjusting = (type: 'elevation' | 'windage', amount: number) => {
    stopAdjusting(); // Clear any existing timers logic

    // 1. Immediate adjustment on press
    adjust(type, amount);

    // 2. Setup delay before rapid fire starts (e.g., 400ms)
    timeoutRef.current = window.setTimeout(() => {
      // 3. Start continuous adjustment (e.g., every 75ms)
      intervalRef.current = window.setInterval(() => {
        adjust(type, amount);
      }, 75);
    }, 400);
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => stopAdjusting();
  }, []);

  // Helper for button props to reduce repetition
  const getButtonProps = (type: 'elevation' | 'windage', amount: number) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault(); // Prevent default touch behaviors
      startAdjusting(type, amount);
    },
    onPointerUp: stopAdjusting,
    onPointerLeave: stopAdjusting,
    className: "p-2 bg-gray-800 hover:bg-gray-700 rounded-full active:scale-95 transition touch-none select-none"
  });

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gray-900/90 border-t border-gray-700 p-4 flex flex-wrap items-end justify-between gap-4 text-gray-100 z-20 backdrop-blur-md">
      
      {/* Environment Data */}
      <div className="flex-1 min-w-[200px] bg-black/40 p-3 rounded border border-gray-700 font-mono-tech">
        <h3 className="text-xs text-gray-400 mb-2 uppercase tracking-wider">{t.atmospherics}</h3>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Wind size={16} className="text-blue-400" />
            <span>{environment.windSpeed} m/s <span className="text-gray-500 text-xs">@ {environment.windDirection}°</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer size={16} className="text-red-400" />
            <span>{environment.temperature}°C</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-blue-300" />
            <span>{environment.humidity}%</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <span>{t.distance}: {environment.distance}m</span>
          </div>
        </div>
      </div>

      {/* Range Card */}
      <div className="hidden md:block w-48 h-32 overflow-y-auto bg-black/40 rounded border border-gray-700 font-mono-tech text-xs">
        <div className="sticky top-0 bg-gray-800 text-gray-400 p-1 text-center font-bold text-[10px] uppercase">{t.rangeCard}</div>
        <table className="w-full text-left">
          <thead className="sticky top-6 bg-gray-800 text-gray-400">
            <tr>
              <th className="p-1 pl-2">Meters</th>
              <th className="p-1">MIL</th>
            </tr>
          </thead>
          <tbody>
            {rangeCard.map((row) => (
              <tr key={row.distance} className={Math.abs(row.distance - environment.distance) < 50 ? "bg-amber-900/50 text-amber-100" : "border-t border-gray-800"}>
                <td className="p-1 pl-2">{row.distance}m</td>
                <td className="p-1">{row.elevation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Turrets */}
      <div className="flex gap-6 font-mono-tech">
        {/* Elevation */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-gray-400 uppercase">{t.elevation}</span>
          <div className="flex items-center gap-2">
            <button {...getButtonProps('elevation', -0.1)}>
              <RotateCcw size={18} />
            </button>
            <div className="w-20 h-20 rounded-full border-2 border-amber-500/50 flex items-center justify-center bg-black relative shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <span className="text-2xl font-bold text-amber-500">{turrets.elevation.toFixed(1)}</span>
              <span className="absolute bottom-2 text-[10px] text-gray-500">MIL</span>
            </div>
            <button {...getButtonProps('elevation', 0.1)}>
              <RotateCw size={18} />
            </button>
          </div>
        </div>

        {/* Windage */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-gray-400 uppercase">{t.windage}</span>
          <div className="flex items-center gap-2">
            <button {...getButtonProps('windage', -0.1)}>
              <RotateCcw size={18} />
            </button>
            <div className="w-20 h-20 rounded-full border-2 border-amber-500/50 flex items-center justify-center bg-black relative shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <span className="text-2xl font-bold text-amber-500">{turrets.windage.toFixed(1)}</span>
              <span className="absolute bottom-2 text-[10px] text-gray-500">MIL</span>
            </div>
            <button {...getButtonProps('windage', 0.1)}>
              <RotateCw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Fire Button */}
      <div className="flex flex-col justify-end">
        <button 
          onClick={onFire}
          disabled={!canFire}
          className={`px-8 py-4 rounded font-bold text-xl uppercase tracking-widest transition-all duration-100 shadow-lg
            ${canFire 
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/50 hover:shadow-red-600/50 transform hover:-translate-y-1' 
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
        >
          {t.fire}
        </button>
      </div>

    </div>
  );
};

export default ControlPanel;
