
import { ArkGridGem, MultiOptimizationResult, CoreGrade, CoreType, SingleOptimization, PlayerRole, OptimizationMode } from "../types";
import arkGridCoreData from "../meta/arkgrid_core.json";

const DEALER_SCALING_TABLE: Record<string, Record<number, number>> = arkGridCoreData.dealer as unknown as Record<string, Record<number, number>>;
const SUPPORT_SCALING_TABLE: Record<string, Record<number, number>> = arkGridCoreData.support as unknown as Record<string, Record<number, number>>;

const WILL_LIMITS: Record<CoreGrade, number> = {
  'Hero': 9,
  'Legend': 12,
  'Relic': 15,
  'Ancient': 17
};

const POINT_LIMITS: Record<CoreGrade, number> = {
  'Hero': 10,
  'Legend': 14,
  'Relic': 20,
  'Ancient': 20
};

const TARGET_POINTS: Record<CoreGrade, number> = {
  'Hero': 10,
  'Legend': 14,
  'Relic': 17,
  'Ancient': 17
};

const GEM_COEFFICIENTS: Record<string, number> = {
  '공격력': 0.00036666,
  '추가 피해': 0.000807692307692308,
  '보스 피해': 0.00083334,
  '낙인력': 0.0005,
  '아군 공격 강화': 0.13,
  '아군 피해 강화': 0.0525
};

const DEALER_EFFECTS = ['공격력', '보스 피해', '추가 피해'];
const SUPPORT_EFFECTS = ['낙인력', '아군 공격 강화', '아군 피해 강화'];

function getScalingGain(type: CoreType, totalPoints: number, role: PlayerRole): number {

  const table = role === 'dealer' ? DEALER_SCALING_TABLE[type] : SUPPORT_SCALING_TABLE[type];
  console.log('getScalingGain', role, table);
  const thresholds = Object.keys(table).map(Number).sort((a, b) => b - a);
  for (const t of thresholds) {
    if (totalPoints >= t) return table[t];
  }
  return 0;
}

function calculateEfficiency(baseline: number, bonus: number): number {
  // 사용자의 요청에 따라 젬 옵션의 실효율을 항상 계산
  return (1 + baseline + bonus) / (1 + baseline);
}

function findBestCombination(
  candidates: ArkGridGem[], 
  willLimit: number, 
  pointLimit: number,
  targetPoint: number,
  coreType: CoreType, 
  relevantEffects: string[], 
  baselines: Record<string, number>,
  role: PlayerRole,
  grade: CoreGrade
): ArkGridGem[] {
  let bestTargetCombo: ArkGridGem[] = [];
  let bestTargetCombatScore = -1;
  
  let bestFallbackCombo: ArkGridGem[] = [];
  let maxFallbackPoints = -1;
  let maxFallbackCombatScore = -1;

  const n = Math.min(candidates.length, 45);
  
  const search = (startIndex: number, currentCombo: ArkGridGem[]) => {
    if (currentCombo.length > 0 && currentCombo.length <= 4) {
      const totalWill = currentCombo.reduce((s, g) => s + g.will, 0);
      const totalPoints = currentCombo.reduce((s, g) => s + g.point, 0);

      if (totalWill <= willLimit) {
        let combatMult = 1.0;
        const effectSums: Record<string, number> = {};
        currentCombo.forEach(g => {
          [g.option1, g.option2].forEach(o => {
            if (relevantEffects.includes(o.effect)) {
              effectSums[o.effect] = (effectSums[o.effect] || 0) + (o.level * (GEM_COEFFICIENTS[o.effect] || 0));
            }
          });
        });

        Object.entries(effectSums).forEach(([eff, bonus]) => {
          combatMult *= calculateEfficiency(baselines[eff] || 0, bonus);
        });

        const effectivePoints = Math.min(totalPoints, pointLimit);
        const scalingFactor = 1 + (getScalingGain(coreType, effectivePoints, role) / 100);
        const totalScore = scalingFactor * combatMult * Math.pow(totalWill / willLimit, 0.5);

        if (totalPoints >= targetPoint) {
          if (totalScore > bestTargetCombatScore) {
            bestTargetCombatScore = totalScore;
            bestTargetCombo = [...currentCombo];
          }
        } else {
          if (totalPoints > maxFallbackPoints) {
            maxFallbackPoints = totalPoints;
            maxFallbackCombatScore = totalScore;
            bestFallbackCombo = [...currentCombo];
          } else if (totalPoints === maxFallbackPoints && totalScore > maxFallbackCombatScore) {
            maxFallbackCombatScore = totalScore;
            bestFallbackCombo = [...currentCombo];
          }
        }
      }
    }

    if (currentCombo.length >= 4) return;

    for (let i = startIndex; i < n; i++) {
      search(i + 1, [...currentCombo, candidates[i]]);
    }
  };

  search(0, []);
  return grade === 'Legend' ? bestTargetCombo : (bestTargetCombo.length > 0 ? bestTargetCombo : bestFallbackCombo);
}

export const runLocalOptimization = (
  gems: ArkGridGem[],
  coreConfigs: Record<CoreType, CoreGrade>,
  role: PlayerRole,
  baselines: Record<string, number>,
  mode: OptimizationMode
): MultiOptimizationResult => {
  const relevantEffects = role === 'dealer' ? DEALER_EFFECTS : SUPPORT_EFFECTS;
  
  const processedGems = gems.map(gem => {
    let optionValue = 1.0;
    [gem.option1, gem.option2].forEach(opt => {
      if (relevantEffects.includes(opt.effect)) {
        const coeff = GEM_COEFFICIENTS[opt.effect] || 0;
        const bonus = opt.level * coeff;
        // App.tsx에서 전달받은 베이스라인(모드별로 달인/아드 필터링됨) 사용
        const baseline = baselines[opt.effect] || 0;
        optionValue *= calculateEfficiency(baseline, bonus);
      }
    });
    const efficiency = gem.point / gem.will;
    return { ...gem, optionValue, efficiency };
  });

  const availableGems = [...processedGems]
    .filter(gem => gem.will < 6)
    .sort((a, b) => {
      // 17포인트(유물/고대 목표) 달성을 위해 포인트 높은 순으로 우선 정렬하여 큰 젬부터 배치 시도
      if (b.point !== a.point) return b.point - a.point;
      if (b.efficiency !== a.efficiency) return b.efficiency - a.efficiency;
      return b.optionValue - a.optionValue;
    });

  const results: Record<string, SingleOptimization> = {};
  const usedGemIds = new Set<string>();

  const corePriority: CoreType[] = [
    '질서의 해', '질서의 달', '질서의 별', 
    '혼돈의 해', '혼돈의 달', '혼돈의 별'
  ];

  corePriority.forEach(coreType => {
    const grade = coreConfigs[coreType];
    const willLimit = WILL_LIMITS[grade];
    const pointLimit = POINT_LIMITS[grade];
    const targetPoint = TARGET_POINTS[grade];
    const category = coreType.startsWith('질서') ? '질서' : '혼돈';
    
    const candidates = availableGems.filter(g => g.category === category && !usedGemIds.has(g.id));
    
    if (candidates.length === 0) {
      results[coreType] = {
        slots: [],
        summary: { totalPoints: 0, totalWill: 0, willLimit, scalingGain: 0, combatOptionGain: 0, totalPowerGain: 0, effectTotals: {} },
        reasoning: "사용 가능한 젬이 없습니다."
      };
      return;
    }

    const bestCombination = findBestCombination(candidates, willLimit, pointLimit, targetPoint, coreType, relevantEffects, baselines, role, grade);

    if (bestCombination.length > 0) {
      bestCombination.forEach(g => usedGemIds.add(g.id));
      const totalPoints = bestCombination.reduce((sum, g) => sum + g.point, 0);
      const totalWill = bestCombination.reduce((sum, g) => sum + g.will, 0);
      
      const effectivePoints = Math.min(totalPoints, pointLimit);
      const scaling = getScalingGain(coreType, effectivePoints, role);
      
      const effectTotals: Record<string, number> = {};
      bestCombination.forEach(g => {
        [g.option1, g.option2].forEach(o => {
          effectTotals[o.effect] = (effectTotals[o.effect] || 0) + o.level;
        });
      });

      results[coreType] = {
        slots: bestCombination.map((g, idx) => ({ slotId: idx + 1, gem: g, isActive: true })),
        summary: {
          totalPoints, 
          totalWill, 
          willLimit,
          scalingGain: scaling,
          combatOptionGain: 0, 
          totalPowerGain: 0,
          effectTotals
        },
        reasoning: `[${mode === 'intrinsic' ? '단독 이득' : '실 효율'}] 포인트 임계점(${targetPoint}pt) 달성 및 점수 최대화 배치를 완료했습니다.`
      };
    }
  });

  return { results, totalExpectedGain: 0 }; 
};
