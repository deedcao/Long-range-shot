
import { Environment, TurretState, LevelConfig, ShotResult, Language } from '../types';
import { MUZZLE_VELOCITY, STANDARD_TEMP } from '../constants';

/**
 * Calculates the bullet impact point deviation relative to the point of aim (0,0)
 * Returns deviations in Centimeters.
 */
export const calculateImpact = (env: Environment, turrets: TurretState) => {
  const dist = env.distance;
  
  // 1. Calculate Time of Flight (ToF) - Simplified estimation
  // t = d / v (roughly) - slightly decaying velocity
  const timeOfFlight = dist / (MUZZLE_VELOCITY * 0.92); 

  // 2. Calculate Physical Drop (Gravity)
  // h = 0.5 * g * t^2
  const gravityDropMeters = 0.5 * 9.81 * Math.pow(timeOfFlight, 2);
  const gravityDropCm = gravityDropMeters * 100;

  // 3. Atmospheric Density Correction (Temperature only for this simplified model)
  // Hotter air = less density = less drag = shoots higher (less drop)
  // Approx 1% change in density per 3 degrees C deviation from standard
  const tempDiff = env.temperature - STANDARD_TEMP;
  const densityFactor = 1 - (tempDiff * 0.002); // Very rough approximation
  
  const actualDropCm = gravityDropCm * densityFactor;

  // 4. Calculate Wind Drift
  // Simplified formula: Drift = WindSpeed * (TimeOfFlight - (Distance / MuzzleVelocity)) * Constant
  // Using a linear approximation for game feel:
  // Drift (cm) roughly equals Wind(m/s) * Distance(m)^2 / constant
  // Let's use a standard approximation for .308:
  // At 1000m, 10mph (4.47m/s) wind moves bullet ~2.5 MILs (~250cm)
  
  // Wind vector decomposition
  // Wind from 90deg (Right) pushes Left. 
  // Wind Direction 0 is North (Headwind).
  const windRad = (env.windDirection - 90) * (Math.PI / 180);
  const crossWindComponent = env.windSpeed * Math.cos(windRad); // Positive = wind form right
  const headWindComponent = env.windSpeed * Math.sin(windRad);
  
  // Simple linear model for game balance:
  // 1 m/s crosswind at 100m = 0.5cm drift (tiny)
  // 1 m/s crosswind at 1000m = 60cm drift
  const driftFactor = Math.pow(dist / 100, 1.8);
  const windDriftCm = crossWindComponent * driftFactor * 0.15;

  // 5. Convert Turret MILs to Centimeters at this distance
  // 1 MIL = 10cm at 100m.
  // 1 MIL = 10cm * (dist/100)
  const milValueAtDistCm = 10 * (dist / 100);
  
  const elevationCorrectionCm = turrets.elevation * milValueAtDistCm;
  const windageCorrectionCm = turrets.windage * milValueAtDistCm;

  // 6. Final Error Calculation
  // Positive Vertical Error = Bullet hit LOW (Gravity pull > Elevation Dial)
  // We want the result coordinates relative to the center.
  // If gravity pulls down 500cm, and we dial UP to compensate 500cm, result is 0.
  const verticalImpactCm = -actualDropCm + elevationCorrectionCm;
  
  // Positive Horizontal Error = Bullet hit RIGHT (Wind pushed Right > Windage Dial Left)
  // Windage Dial: Positive usually moves impact RIGHT. 
  // If wind pushes LEFT (negative drift), we dial RIGHT (positive) to correct? 
  // Wait, if wind is FROM right, bullet goes LEFT. We aim RIGHT (or dial Right) to fix it.
  // Let's assume Turret Positive = Moves Point of Impact Right.
  const horizontalImpactCm = -windDriftCm + windageCorrectionCm;

  return {
    x: horizontalImpactCm, // cm from center
    y: verticalImpactCm    // cm from center (Positive is High, Negative is Low)
  };
};

/**
 * Generates a range card for the player to use for reference
 */
export const generateRangeCard = (temp: number) => {
  const distances = [200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200];
  return distances.map(d => {
    // Calculate theoretical perfect drop adjustment
    // ToF
    const t = d / (MUZZLE_VELOCITY * 0.92);
    const dropM = 0.5 * 9.81 * Math.pow(t, 2);
    
    // Density correction
    const tempDiff = temp - STANDARD_TEMP;
    const densityFactor = 1 - (tempDiff * 0.002);
    const actualDropM = dropM * densityFactor;

    // Convert drop in meters to MILs required
    // MILs = (Drop in CM) / (Distance in Meters / 10)
    const mils = (actualDropM * 100) / (d / 10);
    
    return {
      distance: d,
      elevation: parseFloat(mils.toFixed(1))
    };
  });
};

/**
 * Generate environment based on level constraints
 */
export const generateLevelEnvironment = (config: LevelConfig): Environment => {
  const c = config.constraints;
  
  const distance = Math.floor(Math.random() * (c.maxDist - c.minDist + 1) + c.minDist);
  const windSpeed = parseFloat((Math.random() * (c.maxWind - c.minWind) + c.minWind).toFixed(1));
  
  const windDirection = c.fixedWindDir !== undefined 
    ? c.fixedWindDir 
    : Math.floor(Math.random() * 360);

  const temperature = c.fixedTemp !== undefined
    ? c.fixedTemp
    : Math.floor(Math.random() * 35);

  return {
    distance,
    windSpeed,
    windDirection,
    temperature,
    humidity: Math.floor(Math.random() * 60 + 20), // Less relevant for basic gameplay but adds flavor
  };
};

/**
 * Analyzes the shot result against the environment to provide educational feedback.
 */
export const getInstructorFeedback = (result: ShotResult, env: Environment, lang: Language): string[] => {
  const isZh = lang === 'zh';
  const feedback: string[] = [];

  // Calculate basic variables
  const cmPerMil = env.distance / 10; // At 500m, 1 MIL = 50cm
  
  // Errors in CM
  const vErr = result.dropError; // +High, -Low
  const hErr = result.windError; // +Right, -Left

  // Calculate Exact Correction required in MILs
  // We need to move the impact Opposite to the error.
  // Correction = -Error / ValuePerMil
  const vCorrection = -(vErr / cmPerMil);
  const hCorrection = -(hErr / cmPerMil);

  // Round for display
  const vCorrDisplay = Math.abs(vCorrection).toFixed(1);
  const hCorrDisplay = Math.abs(hCorrection).toFixed(1);

  // 1. Score Assessment
  if (result.rings === 10) {
    feedback.push(isZh 
      ? "完美命中（10环）！你的计算非常精准。" 
      : "Perfect Hit (10 Rings)! Your calculations were precise.");
  } else if (result.hit) {
    feedback.push(isZh 
      ? `命中 ${result.rings} 环。虽然击中目标，但仍有修正空间。` 
      : `Hit: ${result.rings} Rings. You hit the target, but there is room for improvement.`);
  } else {
    feedback.push(isZh 
      ? "脱靶。请仔细阅读以下数据分析以进行修正。" 
      : "Miss. Please review the data analysis below to correct your shot.");
  }

  // 2. Formula Explanation
  feedback.push(isZh
    ? `基础公式：在 ${env.distance}米 距离，1 MIL = ${cmPerMil}厘米。`
    : `Formula: At ${env.distance}m distance, 1 MIL = ${cmPerMil}cm.`);

  // 3. Vertical Analysis
  if (Math.abs(vCorrection) > 0.05) {
    const dirStr = vErr > 0 ? (isZh ? "偏高" : "HIGH") : (isZh ? "偏低" : "LOW");
    const adjAction = vErr > 0 ? (isZh ? "减少" : "DECREASE") : (isZh ? "增加" : "INCREASE");
    const errAbs = Math.abs(vErr).toFixed(0);

    feedback.push("---");
    feedback.push(isZh
      ? `[高低误差] 弹着点${dirStr}了 ${errAbs}cm。`
      : `[Elevation Error] Impact was ${errAbs}cm ${dirStr}.`);
    
    // Environmental Context
    if (Math.abs(vErr) > 15) {
      const tempDiff = env.temperature - 15;
      if (tempDiff > 10 && vErr > 0) {
        feedback.push(isZh
          ? `环境分析：气温 ${env.temperature}°C (较热)。空气密度低导致阻力小，子弹下坠比预期少，所以打高了。`
          : `Env Analysis: Temp ${env.temperature}°C (Hot). Low air density reduced drag, causing less drop. Shot went high.`);
      } else if (tempDiff < -10 && vErr < 0) {
        feedback.push(isZh
          ? `环境分析：气温 ${env.temperature}°C (较冷)。空气密度大导致阻力大，子弹下坠比预期多，所以打低了。`
          : `Env Analysis: Temp ${env.temperature}°C (Cold). High air density increased drag, causing more drop. Shot went low.`);
      }
    }

    feedback.push(isZh
      ? `计算：${errAbs}cm / ${cmPerMil}cm = ${Math.abs(vCorrection).toFixed(2)} MIL`
      : `Calc: ${errAbs}cm / ${cmPerMil}cm = ${Math.abs(vCorrection).toFixed(2)} MIL`);

    feedback.push(isZh
      ? `修正建议：高低旋钮(Elevation)应 ${adjAction} ${vCorrDisplay} MIL。`
      : `Correction: ${adjAction} Elevation by ${vCorrDisplay} MIL.`);
  }

  // 4. Horizontal Analysis
  if (Math.abs(hCorrection) > 0.05) {
    const dirStr = hErr > 0 ? (isZh ? "偏右" : "RIGHT") : (isZh ? "偏左" : "LEFT");
    const adjAction = hErr > 0 ? (isZh ? "左修" : "LEFT") : (isZh ? "右修" : "RIGHT");
    const errAbs = Math.abs(hErr).toFixed(0);

    feedback.push("---");
    feedback.push(isZh
      ? `[风偏误差] 弹着点${dirStr}了 ${errAbs}cm。`
      : `[Windage Error] Impact was ${errAbs}cm ${dirStr}.`);

    if (env.windSpeed > 0) {
      feedback.push(isZh
        ? `环境分析：风速 ${env.windSpeed}m/s，风向 ${env.windDirection}°。风吹导致了侧偏。`
        : `Env Analysis: Wind ${env.windSpeed}m/s @ ${env.windDirection}°. Wind pushed the bullet.`);
    }

    feedback.push(isZh
      ? `计算：${errAbs}cm / ${cmPerMil}cm = ${Math.abs(hCorrection).toFixed(2)} MIL`
      : `Calc: ${errAbs}cm / ${cmPerMil}cm = ${Math.abs(hCorrection).toFixed(2)} MIL`);

    feedback.push(isZh
      ? `修正建议：风偏旋钮(Windage)应往 ${adjAction} 调整 ${hCorrDisplay} MIL。`
      : `Correction: Adjust Windage ${adjAction} by ${hCorrDisplay} MIL.`);
  }

  return feedback;
};
