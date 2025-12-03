
import { LevelConfig, Language } from './types';

export const GRAVITY = 9.81;
export const MUZZLE_VELOCITY = 850; // m/s (Generic .308 Win equivalent)
export const BALLISTIC_COEFFICIENT = 0.5; // G1 drag model simplified
export const STANDARD_TEMP = 15; // Celsius
export const STANDARD_PRESSURE = 1013.25; // hPa

// Visual Constants
export const MIL_TO_PIXELS = 100; // Scale for the reticle rendering
export const TARGET_SIZE_CM = 45; // Diameter of the target (outer ring)

// Difficulty settings
export const BASE_SWAY_AMPLITUDE = 2.5; // MILs of sway
export const BREATH_SWAY_MULTIPLIER = 0.15; // How much sway reduces when holding breath
export const ZOOM_LEVELS = [4, 8, 12, 20];

// --- UI TRANSLATIONS ---
export const UI_TEXT: Record<Language, any> = {
  en: {
    mainTitle: "LONG RANGE",
    subTitle: "Ballistic Simulation Trainer",
    training: "TRAINING",
    trainingDesc: "Learn the fundamentals. Visual aids enabled. Isolated lessons on Gravity, Wind, and Atmospherics.",
    campaign: "CAMPAIGN",
    campaignDesc: "Test your skills. 5 Missions. No Visual Aids. Increasing complexity and variable conditions.",
    atmospherics: "Atmospherics",
    distance: "DIST",
    elevation: "Elevation (UP)",
    windage: "Windage (R)",
    fire: "FIRE",
    rangeCard: "Range Card",
    holdingBreath: "HOLDING BREATH",
    trainingAid: "TRAINING AID ACTIVE: MATCH RED DOT TO CROSSHAIR",
    targetDown: "HIT",
    missionFailed: "MISS",
    rings: "RINGS",
    score: "SCORE",
    impactHigh: "HIGH",
    impactLow: "LOW",
    impactLeft: "LEFT",
    impactRight: "RIGHT",
    instructorFeedback: "Instructor Feedback",
    retry: "Retry Mission",
    nextMission: "Next Mission",
    abort: "Abort to Menu",
    deploy: "Deploy",
    hint: "Instructor Hint"
  },
  zh: {
    mainTitle: "远程狙击",
    subTitle: "专业弹道模拟训练",
    training: "基础训练",
    trainingDesc: "学习基础知识。启用视觉辅助。分阶段学习重力、风偏和环境影响。",
    campaign: "战役模式",
    campaignDesc: "实战考核。5个关卡。无辅助。环境因素逐渐复杂化。",
    atmospherics: "环境数据",
    distance: "距离",
    elevation: "高低 (UP)",
    windage: "风偏 (R)",
    fire: "开火",
    rangeCard: "射表",
    holdingBreath: "屏息中",
    trainingAid: "训练辅助开启：将红点对准十字中心",
    targetDown: "命中",
    missionFailed: "脱靶",
    rings: "环",
    score: "成绩",
    impactHigh: "偏高",
    impactLow: "偏低",
    impactLeft: "偏左",
    impactRight: "偏右",
    instructorFeedback: "教官点评",
    retry: "重试任务",
    nextMission: "下一关",
    abort: "返回主菜单",
    deploy: "开始行动",
    hint: "教官提示"
  }
};

// --- LEVEL DATA ---

export const TRAINING_LEVELS: LevelConfig[] = [
  {
    id: 't1',
    texts: {
      en: {
        title: 'Lesson 1: Gravity Basics',
        description: 'We start with the absolute basics. The target is fixed at 300m. The rifle is clamped in a rest (NO SWAY). There is NO WIND. \n\nYour only task is to compensate for bullet drop.',
        hint: '1. Check Range Card for 300m.\n2. Dial Elevation UP to match.\n3. Aim Center. Fire.'
      },
      zh: {
        title: '第1课：重力基础',
        description: '从最基础的开始。目标固定在300米处。枪支已固定在枪架上（无晃动）。无风。\n\n你唯一的任务是修正子弹下坠。',
        hint: '1. 查看射表300米对应的数据。\n2. 调整高低旋钮（Elevation）。\n3. 瞄准中心，开火。'
      }
    },
    constraints: {
      minDist: 300, maxDist: 300,
      minWind: 0, maxWind: 0,
      fixedTemp: 15,
      disableSway: true
    }
  },
  {
    id: 't2',
    texts: {
      en: {
        title: 'Lesson 2: Windage',
        description: 'Now we introduce Wind. The target is at 400m. We have a consistent 5 m/s crosswind from the RIGHT. \n\nThe rifle is still clamped (NO SWAY). Focus on the Windage turret.',
        hint: '1. Dial Elevation for 400m.\n2. Wind is pushing LEFT.\n3. Dial Windage RIGHT (approx 0.9 MIL).\n4. Fire.'
      },
      zh: {
        title: '第2课：风偏修正',
        description: '现在引入风的影响。目标距离400米。右侧有持续的5米/秒横风。\n\n枪支依然固定（无晃动）。专注于风偏旋钮。',
        hint: '1. 调整400米的高低（Elevation）。\n2. 风从右边吹，子弹会往左偏。\n3. 向右（R）调整风偏旋钮（约0.9 MIL）。\n4. 开火。'
      }
    },
    constraints: {
      minDist: 400, maxDist: 400,
      minWind: 5, maxWind: 5,
      fixedWindDir: 90, // From East (Right)
      fixedTemp: 15,
      disableSway: true
    }
  },
  {
    id: 't3',
    texts: {
      en: {
        title: 'Lesson 3: Stability (Sway)',
        description: 'We are removing the rifle clamp. You must now manage WEAPON SWAY. \n\nTarget is close (300m). No Wind. \n\nUse SPACEBAR to hold breath before firing.',
        hint: '1. Dial Elevation for 300m.\n2. Align reticle.\n3. PRESS & HOLD SPACE to stabilize.\n4. Fire while stable.'
      },
      zh: {
        title: '第3课：据枪稳定性',
        description: '撤去枪架。你必须控制枪支晃动。\n\n目标较近（300米）。无风。\n\n使用空格键（SPACE）屏息。',
        hint: '1. 调整300米高低。\n2. 对准分划。\n3. 按住空格键稳定枪身。\n4. 在稳定时开火。'
      }
    },
    constraints: {
      minDist: 300, maxDist: 300,
      minWind: 0, maxWind: 0,
      fixedTemp: 15,
      disableSway: false // Sway enabled
    }
  },
  {
    id: 't4',
    texts: {
      en: {
        title: 'Lesson 4: Temperature',
        description: 'Advanced atmospherics. Target at 600m in EXTREME HEAT (35°C). \n\nHot air is less dense -> Less drag -> Bullet drops LESS. \n\nStability is ON.',
        hint: '1. Check chart for 600m.\n2. Because it is HOT, dial slightly LESS Elevation (-0.1 or -0.2).\n3. Hold breath and fire.'
      },
      zh: {
        title: '第4课：温度影响',
        description: '进阶环境因素。目标600米，处于酷热环境（35°C）。\n\n热空气密度低 -> 阻力小 -> 子弹下坠减少。\n\n稳定性开启。',
        hint: '1. 查看600米射表。\n2. 因为天气热，高低（Elevation）要比射表稍微调小一点（-0.1 或 -0.2）。\n3. 屏息并开火。'
      }
    },
    constraints: {
      minDist: 600, maxDist: 600,
      minWind: 0, maxWind: 0,
      fixedTemp: 35,
      disableSway: false
    }
  },
  {
    id: 't5',
    texts: {
      en: {
        title: 'Lesson 5: Combined Test',
        description: 'Final Training. 500m Target. Moderate Wind. Standard Temp. Sway is active. \n\nApply everything you have learned.',
        hint: '1. Elevation for 500m.\n2. Check Wind speed/dir -> Calculate Windage.\n3. Hold Breath -> Fire.'
      },
      zh: {
        title: '第5课：综合测试',
        description: '最终训练。500米目标。中等风速。标准温度。晃动开启。\n\n综合运用你学到的所有知识。',
        hint: '1. 调整500米高低。\n2. 检查风速风向 -> 计算风偏。\n3. 屏息 -> 开火。'
      }
    },
    constraints: {
      minDist: 500, maxDist: 500,
      minWind: 2, maxWind: 4,
      fixedTemp: 15,
      disableSway: false
    }
  }
];

export const CAMPAIGN_LEVELS: LevelConfig[] = [
  {
    id: 'c1',
    texts: {
      en: {
        title: 'Qualification: Stationary',
        description: 'Standard qualification target. Conditions are ideal. Prove you can hit a fixed target before we deploy you.',
        hint: 'Target fixed at 300m. No Wind. Set Elevation to match Range Card exactly.'
      },
      zh: {
        title: '资格认证：固定靶',
        description: '标准资格认证目标。环境理想。在部署前证明你能击中固定目标。',
        hint: '目标固定300米。无风。严格按照射表调整高低。'
      }
    },
    constraints: {
      minDist: 300, maxDist: 300,
      minWind: 0, maxWind: 0,
      fixedTemp: 15,
      disableSway: false
    }
  },
  {
    id: 'c2',
    texts: {
      en: {
        title: 'Mission: Gentle Breeze',
        description: 'Target sighted in open field. Distance is known. Light crosswind detected. Introduce windage corrections to your workflow.',
        hint: 'Target fixed at 500m. Wind is light (1-3 m/s). Calculate drop, then check wind direction. Small windage adjustment required.'
      },
      zh: {
        title: '任务：微风',
        description: '开阔地发现目标。距离已知。探测到轻微横风。在流程中加入风偏修正。',
        hint: '目标固定500米。轻风（1-3米/秒）。计算下坠，检查风向。需要微调风偏。'
      }
    },
    constraints: {
      minDist: 500, maxDist: 500,
      minWind: 1, maxWind: 3,
      fixedTemp: 15,
      disableSway: false
    }
  },
  {
    id: 'c3',
    texts: {
      en: {
        title: 'Mission: Variable Range',
        description: 'Target is moving between positions. You must identify the range yourself using the Atmospherics panel before engaging.',
        hint: 'Distance is NOT fixed. Check "DIST" in the bottom-left panel first! Then check Range Card.'
      },
      zh: {
        title: '任务：变距目标',
        description: '目标在不同位置移动。你必须在接战前通过环境面板确认距离。',
        hint: '距离不固定！先看左下角的"距离（DIST）"！然后查射表。'
      }
    },
    constraints: {
      minDist: 300, maxDist: 600,
      minWind: 0, maxWind: 2, // Low wind complexity
      fixedTemp: 15,
      disableSway: false
    }
  },
  {
    id: 'c4',
    texts: {
      en: {
        title: 'Mission: Heat Haze',
        description: 'High value target in desert sector. High temperatures and moderate winds. You must account for all environmental factors.',
        hint: 'Distance varies. Temp is High (30°C+). Bullet will impact higher than chart says. Reduce Elevation slightly.'
      },
      zh: {
        title: '任务：热浪',
        description: '沙漠区域的高价值目标。高温伴随中等风速。必须考虑所有环境因素。',
        hint: '距离不定。高温（30度以上）。子弹落点会比射表显示的高。稍微调低一点高低旋钮。'
      }
    },
    constraints: {
      minDist: 500, maxDist: 800,
      minWind: 3, maxWind: 6,
      fixedTemp: 35,
      disableSway: false
    }
  },
  {
    id: 'c5',
    texts: {
      en: {
        title: 'Mission: Long Range Storm',
        description: 'Extreme distance. High wind variance. Sub-zero temperatures. This is the ultimate test of a sniper.',
        hint: 'Check ALL factors: Distance, Temp (Cold = Add Elev), Wind Speed & Direction. Good luck.'
      },
      zh: {
        title: '任务：远距离风暴',
        description: '极限距离。风速变化大。零下温度。这是对狙击手的终极考验。',
        hint: '检查所有因素：距离，温度（冷=增加高低），风速和风向。祝好运。'
      }
    },
    constraints: {
      minDist: 800, maxDist: 1100,
      minWind: 5, maxWind: 12,
      fixedTemp: -5,
      disableSway: false
    }
  }
];
