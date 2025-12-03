
import React, { useEffect, useRef, useState } from 'react';
import { Environment, GameStatus, ShotResult, TurretState, Language } from '../types';
import { TARGET_SIZE_CM, BASE_SWAY_AMPLITUDE, BREATH_SWAY_MULTIPLIER, UI_TEXT } from '../constants';

interface Props {
  zoom: number;
  environment: Environment;
  turrets: TurretState;
  isHoldingBreath: boolean;
  lastShot: ShotResult | null;
  currentImpact: { x: number, y: number }; // Predicted impact relative to center (cm)
  gameStatus: GameStatus;
  disableSway?: boolean;
  showImpactPredictor?: boolean;
  language: Language;
}

const Scope: React.FC<Props> = ({ 
  zoom, 
  environment, 
  turrets,
  isHoldingBreath, 
  lastShot, 
  currentImpact,
  gameStatus, 
  disableSway = false,
  showImpactPredictor = false,
  language
}) => {
  const [sway, setSway] = useState({ x: 0, y: 0 });
  const requestRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pixelsPerMil, setPixelsPerMil] = useState(0);
  const t = UI_TEXT[language];

  // Calculate apparent size of target based on distance and zoom
  const baseScale = 1000 / environment.distance;
  const targetPixelSize = baseScale * zoom * 8; 
  
  // Calculate Screen Pixels per MIL
  // Reticle SVG is 1000 units. 1 MIL = 50 units (5%).
  // So 1 MIL = 5% of container height.
  useEffect(() => {
    if (containerRef.current) {
      setPixelsPerMil(containerRef.current.clientHeight * 0.05);
    }
    const handleResize = () => {
      if (containerRef.current) {
        setPixelsPerMil(containerRef.current.clientHeight * 0.05);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const animate = (time: number) => {
    if (gameStatus === GameStatus.RESULT) return;

    const delta = time - timeRef.current;
    timeRef.current = time;

    if (disableSway) {
      setSway({ x: 0, y: 0 });
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    // Sway Logic
    const speed = isHoldingBreath ? 0.0005 : 0.0015;
    const amplitude = isHoldingBreath ? BASE_SWAY_AMPLITUDE * BREATH_SWAY_MULTIPLIER : BASE_SWAY_AMPLITUDE;
    
    // Generate sway in Pixels based on pixelsPerMil
    // We want amplitude in MILs, so multiply by pixelsPerMil
    const scale = pixelsPerMil > 0 ? pixelsPerMil : 40; 
    const x = Math.sin(time * speed) * Math.cos(time * speed * 0.5) * amplitude * scale * 0.2; // dampening factor for playability
    const y = Math.sin(time * speed * 0.8) * Math.sin(time * speed * 0.2) * amplitude * scale * 0.2;

    setSway({ x, y });
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [isHoldingBreath, zoom, gameStatus, disableSway, pixelsPerMil]);

  // --- Impact/Hit Marker Logic ---
  // Convert CM error to Pixels
  // targetPixelSize corresponds to TARGET_SIZE_CM (45cm)
  const cmToPixels = targetPixelSize / TARGET_SIZE_CM;

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900 cursor-crosshair flex items-center justify-center">
      
      {/* Blurred Backdrop */}
      <div className="absolute inset-0 bg-[url('https://picsum.photos/1920/1080?grayscale')] bg-cover bg-center opacity-30 blur-md scale-110" />

      {/* Scope Container */}
      <div ref={containerRef} className="relative w-[80vh] h-[80vh] rounded-full overflow-hidden border-[20px] border-black shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-gray-800 z-10">
        
        {/* Scope View (World) */}
        <div 
          className="absolute inset-0 w-full h-full transition-transform duration-75 ease-out"
          style={{
             backgroundImage: `url('https://picsum.photos/1920/1080')`,
             backgroundPosition: 'center',
             backgroundSize: `${100 + (zoom * 5)}%`,
             // Fix: Removed turret offset from transform. 
             // We assume the shooter always re-aligns the rifle to center the crosshair after dialing turrets.
             transform: `translate(${-sway.x}px, ${-sway.y}px)`
          }}
        >
           {/* Target Container */}
           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
              <div 
                 style={{ 
                   width: `${targetPixelSize}px`, 
                   height: `${targetPixelSize}px`,
                 }}
                 className="relative shadow-sm"
              >
                  {/* SVG Bullseye Target */}
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* 5 Ring (Outer, White) - maps to radius ~22cm */}
                    <circle cx="50" cy="50" r="50" fill="#f3f4f6" stroke="black" strokeWidth="0.5" />
                    {/* 6 Ring (White) */}
                    <circle cx="50" cy="50" r="41.6" fill="#f3f4f6" stroke="black" strokeWidth="0.5" />
                    {/* 7 Ring (Black Edge) - Start of Black */}
                    <circle cx="50" cy="50" r="33.3" fill="black" stroke="white" strokeWidth="0.5" />
                    {/* 8 Ring (Black) */}
                    <circle cx="50" cy="50" r="25" fill="black" stroke="white" strokeWidth="0.5" />
                    {/* 9 Ring (Black) */}
                    <circle cx="50" cy="50" r="16.6" fill="black" stroke="white" strokeWidth="0.5" />
                    {/* 10 Ring (Center, Black) */}
                    <circle cx="50" cy="50" r="8.3" fill="black" stroke="white" strokeWidth="0.5" />
                    {/* X Ring (Inner 10) */}
                    <circle cx="50" cy="50" r="4" fill="none" stroke="white" strokeWidth="0.2" strokeDasharray="1,1" />
                  </svg>
                  
                  {/* Hit Marker (Last Shot) */}
                  {lastShot && lastShot.hit && (
                     <div 
                       className="absolute w-2 h-2 bg-green-400 rounded-full border border-white shadow-[0_0_10px_#4ade80] z-50"
                       style={{ 
                         left: '50%', 
                         top: '50%', 
                         // Impact display logic: 
                         // DropError (Positive) = Bullet Low. We draw it Low (Positive Y).
                         // WindError (Positive) = Bullet Right. We draw it Right (Positive X).
                         transform: `translate(calc(-50% + ${lastShot.windError * cmToPixels}px), calc(-50% + ${-lastShot.dropError * cmToPixels}px))` 
                       }}
                     />
                  )}
              </div>
           </div>

           {/* Training Aid: Laser Impact Predictor */}
           {showImpactPredictor && gameStatus === GameStatus.AIMING && (
             <div 
                className="absolute w-2 h-2 bg-red-600 rounded-full shadow-[0_0_8px_rgba(255,0,0,0.8)] z-30 opacity-80 animate-pulse"
                style={{
                  left: '50%',
                  top: '50%',
                  // Predicted Impact: 
                  // If ImpactY is Negative (Low), -(-Y) = +Y (Draw Down). Correct.
                  transform: `translate(${currentImpact.x * cmToPixels}px, ${-currentImpact.y * cmToPixels}px)`
                }}
             />
           )}

           {/* Miss Indicator (Last Shot) */}
           {lastShot && !lastShot.hit && (
              <div 
                className="absolute w-4 h-4 bg-red-500 rounded-full blur-[1px] z-40 border border-white/50"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(${lastShot.windError * cmToPixels}px, ${-lastShot.dropError * cmToPixels}px)`
                }}
              ></div>
           )}
        </div>

        {/* Reticle (Fixed Overlay) */}
        <div className="absolute inset-0 pointer-events-none opacity-80">
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black/80"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-black/80"></div>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000">
             <g stroke="black" strokeWidth="2" fill="none">
                <line x1="450" y1="500" x2="550" y2="500" strokeWidth="3" />
                <line x1="500" y1="450" x2="500" y2="550" strokeWidth="3" />
                {[1,2,3,4,5].map(i => (
                  <React.Fragment key={`v-${i}`}>
                    <line x1="490" y1={500 + (i * 50)} x2="510" y2={500 + (i * 50)} />
                    <text x="515" y={500 + (i * 50) + 5} fontSize="16" fontFamily="monospace">{i}</text>
                    <line x1="490" y1={500 - (i * 50)} x2="510" y2={500 - (i * 50)} />
                  </React.Fragment>
                ))}
                 {[1,2,3,4,5].map(i => (
                  <React.Fragment key={`h-${i}`}>
                    <line x1={500 + (i * 50)} y1="490" x2={500 + (i * 50)} y2="510" />
                    <line x1={500 - (i * 50)} y1="490" x2={500 - (i * 50)} y2="510" />
                  </React.Fragment>
                ))}
             </g>
             <circle cx="500" cy="500" r="480" stroke="black" strokeWidth="20" fill="none" />
          </svg>
        </div>

        {/* Scope Shadow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.9)_100%)] pointer-events-none"></div>
      </div>

      {/* Zoom Indicator */}
      <div className="absolute top-10 right-10 text-white font-mono-tech text-xl z-20 bg-black/50 p-2 rounded">
        {zoom}x
      </div>

      {/* Feedback Text for Training */}
      {showImpactPredictor && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-900/80 text-red-100 px-4 py-1 rounded text-xs font-bold border border-red-500 animate-pulse z-30 whitespace-nowrap">
          {t.trainingAid}
        </div>
      )}
    </div>
  );
};

export default Scope;
