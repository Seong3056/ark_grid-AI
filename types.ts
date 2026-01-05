
export interface GemOption {
  effect: string; 
  level: number;  
}

export interface ArkGridGem {
  id: string;
  category?: '질서' | '혼돈'; // 질서 (붉은색) or 혼돈 (푸른색)
  will: number;    // 의지력 수치
  point: number;   // 포인트 수치
  option1: GemOption;
  option2: GemOption;
}

export type CoreGrade = 'Hero' | 'Legend' | 'Relic' | 'Ancient';
export type CoreType = '질서의 해' | '질서의 달' | '질서의 별' | '혼돈의 해' | '혼돈의 달' | '혼돈의 별';

export interface SingleOptimization {
  slots: { slotId: number; gem: ArkGridGem; isActive: boolean }[];
  summary: {
    totalPoints: number;
    totalWill: number;
    willLimit: number;
    scalingGain: number;      // 포인트 스케일링으로 얻는 수치
    combatOptionGain: number; // 공격력/보피/추피 계수 합산 수치
    totalPowerGain: number;   // 최종 합산 수치
    effectTotals: Record<string, number>;
  };
  reasoning: string;
}

export interface MultiOptimizationResult {
  results: Record<string, SingleOptimization>;
  totalExpectedGain: number; // 6개 코어 전체 합산 기대 수치
}

export interface AnalysisResponse {
  detectedGems: ArkGridGem[];
}
