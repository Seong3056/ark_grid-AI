
export interface GemOption {
  effect: string; 
  level: number;  
}

export type PlayerRole = 'dealer' | 'support';
export type OptimizationMode = 'intrinsic' | 'efficiency';

export interface ArkGridGem {
  id: string;
  category?: '질서' | '혼돈'; 
  will: number;    
  point: number;   
  option1: GemOption;
  option2: GemOption;
}

export type CoreGrade = 'Hero' | 'Legend' | 'Relic' | 'Ancient';
export type CoreType = '질서의 해' | '질서의 달' | '질서의 별' | '혼돈의 해' | '혼돈의 달' | '혼돈의 별';

export interface StatSource {
  name: string;
  value: number;
}

export interface CharStats {
  branding: string;
  atkBuff: string;
  dmgBuff: string;
  combatPower: string;
  attackPower: string;
  weaponAtkPower: string;
  additionalDamage: string;
  critRate: string;
  breakdown: {
    attackPower: StatSource[];
    weaponAtkPower: StatSource[];
    additionalDamage: StatSource[];
    critDamage: StatSource[];
    branding: StatSource[];
    atkBuff: StatSource[];
    dmgBuff: StatSource[];
    flatDex: StatSource[];
    flatWeaponAtk: StatSource[];
  };
}
    attackPower: StatSource[];
    weaponAtkPower: StatSource[];
    additionalDamage: StatSource[];
    critDamage: StatSource[];
    branding: StatSource[];
    atkBuff: StatSource[];
    dmgBuff: StatSource[];
    flatDex: StatSource[];
    flatWeaponAtk: StatSource[];
  };
}

export interface SingleOptimization {
  slots: { slotId: number; gem: ArkGridGem; isActive: boolean }[];
  summary: {
    totalPoints: number;
    totalWill: number;
    willLimit: number;
    scalingGain: number;      
    combatOptionGain: number; 
    totalPowerGain: number;   
    effectTotals: Record<string, number>;
  };
  reasoning: string;
}

export interface MultiOptimizationResult {
  results: Record<string, SingleOptimization>;
  totalExpectedGain: number; 
}

export interface AnalysisResponse {
  detectedGems: ArkGridGem[];
}
