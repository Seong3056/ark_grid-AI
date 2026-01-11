import React, { useState, useMemo } from 'react';
import { 
  ArkGridGem, MultiOptimizationResult, CoreGrade, CoreType, 
  SingleOptimization, PlayerRole, OptimizationMode, CharStats 
} from '../types';
import { 
  DEALER_EFFECTS, SUPPORT_EFFECTS, GEM_COEFFICIENTS, CORE_TYPES 
} from '../constants';
import { analyzeArkGridFromImage } from '../services/geminiService';
import { runLocalOptimization } from '../services/optimizationEngine';
import ImagePaste from './ImagePaste';
import ArkGemCard from './GemCard';
import CoreSettings from './CoreSettings';
import OptimizationResultsView from './OptimizationResultsView';
import { 
  LayoutGrid, Play, RefreshCcw, Zap, Box, Calculator, Search 
} from 'lucide-react';

interface ArkGridOptimizerProps {
  geminiApiKey: string;
  charStats: CharStats | null;
  role: PlayerRole;
}

const ArkGridOptimizer: React.FC<ArkGridOptimizerProps> = ({ geminiApiKey, charStats, role }) => {
  const [images, setImages] = useState<string[]>([]);
  const [gems, setGems] = useState<ArkGridGem[]>([]);
  const [mode, setMode] = useState<'results' | 'inventory'>('results');
  const [optMode, setOptMode] = useState<OptimizationMode>('efficiency');
  
  const [coreConfigs, setCoreConfigs] = useState<Record<CoreType, CoreGrade>>({
    '질서의 해': 'Relic',
    '질서의 달': 'Relic',
    '질서의 별': 'Relic',
    '혼돈의 해': 'Relic',
    '혼돈의 달': 'Relic',
    '혼돈의 별': 'Relic',
  });

  const [multiOptimization, setMultiOptimization] = useState<MultiOptimizationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [loadingType, setLoadingType] = useState<'analysis' | 'optimization' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const relevantEffects = useMemo(() => {
    return role === 'dealer' ? DEALER_EFFECTS : SUPPORT_EFFECTS;
  }, [role]);

  const usedGemMap = useMemo(() => {
    if (!multiOptimization) return {} as Record<string, CoreType>;
    const mapping: Record<string, CoreType> = {};
    Object.entries(multiOptimization.results).forEach(([coreName, res]) => {
      (res as SingleOptimization).slots.forEach(slot => {
        if (slot.isActive && slot.gem) {
          mapping[slot.gem.id] = coreName as CoreType;
        }
      });
    });
    return mapping;
  }, [multiOptimization]);

    // 실 효율 계산용 제외 목록 (단독 이득 및 UI 상세 합산에서 제외)
    const EXCLUDE_FROM_INTRINSIC = [
        "달인", "아드레날린", "선각자", "진군", 
        "입식 타격가", "마나용광로", "안정된 관리자"
    ];

    const intrinsicBaselines = useMemo(() => {
        if (!charStats) return {};
        const parse = (sources: any[]) => {
        return sources
            .filter(s => {
            const n = s.name;
            return !EXCLUDE_FROM_INTRINSIC.some(ex => n.includes(ex));
            })
            .reduce((a, b) => a + b.value, 0) / 100;
        };
        return {
        '공격력': parse(charStats.breakdown.attackPower),
        '추가 피해': parse(charStats.breakdown.additionalDamage),
        '낙인력': parse(charStats.breakdown.branding),
        '아군 공격 강화': parse(charStats.breakdown.atkBuff),
        '아군 피해 강화': parse(charStats.breakdown.dmgBuff),
        '보스 피해': 0 
        };
    }, [charStats]);

    const efficiencyBaselines = useMemo(() => {
        if (!charStats) return {};
        const parse = (sources: any[]) => {
        return sources.reduce((a, b) => a + b.value, 0) / 100;
        };
        return {
        '공격력': parse(charStats.breakdown.attackPower),
        '추가 피해': parse(charStats.breakdown.additionalDamage),
        '낙인력': parse(charStats.breakdown.branding),
        '아군 공격 강화': parse(charStats.breakdown.atkBuff),
        '아군 피해 강화': parse(charStats.breakdown.dmgBuff),
        '보스 피해': 0 
        };
    }, [charStats]);

  const globalEffectTotals = useMemo(() => {
    if (!multiOptimization) return {};
    const totals: Record<string, number> = {};
    (Object.values(multiOptimization.results) as SingleOptimization[]).forEach(result => {
      if (result?.summary?.effectTotals) {
        Object.entries(result.summary.effectTotals).forEach(([effect, level]) => {
          const key = effect.trim();
          if (relevantEffects.includes(key)) {
            totals[key] = (totals[key] || 0) + (level as number);
          }
        });
      }
    });
    return totals;
  }, [multiOptimization, relevantEffects]);

  const intrinsicGain = useMemo(() => {
    if (!multiOptimization) return 0;
    let totalMultiplier = 1.0;
    (Object.values(multiOptimization.results) as SingleOptimization[]).forEach(res => {
      totalMultiplier *= (1 + (res?.summary?.scalingGain || 0) / 100);
    });
    relevantEffects.forEach(eff => {
      const totalLevel = globalEffectTotals[eff] || 0;
      const coeff = GEM_COEFFICIENTS[eff] || 0;
      const gemBonus = totalLevel * coeff;
      const baseline = intrinsicBaselines[eff] || 0;
      totalMultiplier *= (1 + baseline + gemBonus) / (1 + baseline);
    });
    return (totalMultiplier - 1) * 100;
  }, [multiOptimization, globalEffectTotals, relevantEffects, intrinsicBaselines]);

  const realEfficiencyGain = useMemo(() => {
    if (!multiOptimization) return 0;
    let totalMultiplier = 1.0;
    (Object.values(multiOptimization.results) as SingleOptimization[]).forEach(res => {
      totalMultiplier *= (1 + (res?.summary?.scalingGain || 0) / 100);
    });
    relevantEffects.forEach(eff => {
      const totalLevel = globalEffectTotals[eff] || 0;
      const coeff = GEM_COEFFICIENTS[eff] || 0;
      const gemBonus = totalLevel * coeff;
      const baseline = efficiencyBaselines[eff] || 0;
      totalMultiplier *= (1 + baseline + gemBonus) / (1 + baseline);
    });
    return (totalMultiplier - 1) * 100;
  }, [multiOptimization, globalEffectTotals, relevantEffects, efficiencyBaselines]);

  const handleGradeChange = (type: CoreType, grade: CoreGrade) => {
    setCoreConfigs(prev => ({ ...prev, [type]: grade }));
  };

  const handleAnalyzeGems = async () => {
    if (images.length === 0) return setError("스크린샷을 붙여넣어주세요.");
    if (!geminiApiKey) return setError("Gemini API 키를 설정해주세요.");

    setLoading(true);
    setLoadingType('analysis');
    setMultiOptimization(null);
    setError(null);
    setStatus(`${images.length}개 페이지 분석 중...`);
    try {
      const results = await Promise.all(images.map(img => analyzeArkGridFromImage(img, geminiApiKey)));
      const allGems = results.flatMap(res => res.detectedGems || []);
      const uniqueGems = Array.from(new Map(allGems.map(g => [
        `${g.will}-${g.point}-${g.option1.effect}-${g.option1.level}-${g.option2.effect}-${g.option2.level}`, g
      ])).values());
      setGems(uniqueGems);
      setMode('inventory');
    } catch (err) {
      setError("젬 분석 중 오류가 발생했습니다. API 키를 확인해주세요.");
    } finally {
      setLoading(false);
      setLoadingType(null);
      setStatus('');
    }
  };

  const handleOptimize = (mode: OptimizationMode = optMode) => {
    if (gems.length === 0) return setError("젬을 분석해주세요.");
    setLoading(true);
    setLoadingType('optimization');
    setMultiOptimization(null);
    setStatus(`${mode === 'intrinsic' ? '단독 이득' : '실 효율'} 최적화 중...`);
    setOptMode(mode);
    const targetBaselines = mode === 'intrinsic' ? intrinsicBaselines : efficiencyBaselines;
    setTimeout(() => {
      try {
        const result = runLocalOptimization(gems, coreConfigs, role, targetBaselines, mode);
        setMultiOptimization(result);
        setMode('results');
        setLoading(false);
      } catch (err) {
        setError("최적화 오류");
        setLoading(false);
      }
    }, 600);
  };

  if (loading && (loadingType === 'analysis' || loadingType === 'optimization')) {
    return (
      <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 bg-slate-900/30 rounded-[48px] border-2 border-dashed border-indigo-500/20">
        <RefreshCcw className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="font-bold text-lg text-indigo-400">{status || '처리 중...'}</p>
      </div>
    )
  }

  if (multiOptimization) {
    return (
      <>
        <div className="mb-6 flex gap-4">
          <button onClick={() => setMode('results')} className={`px-6 py-3 rounded-2xl text-xs font-black transition-all border ${mode === 'results' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}>
            <LayoutGrid className="w-4 h-4 inline mr-2" /> 최적화 배치 결과
          </button>
          <button onClick={() => setMode('inventory')} className={`px-6 py-3 rounded-2xl text-xs font-black transition-all border ${mode === 'inventory' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}>
            <Box className="w-4 h-4 inline mr-2" /> 분석된 젬 목록 ({gems.length})
          </button>
        </div>
        {mode === 'results' ? (
          <OptimizationResultsView 
            multiOptimization={multiOptimization}
            optMode={optMode}
            relevantEffects={relevantEffects}
            globalEffectTotals={globalEffectTotals}
            intrinsicBaselines={intrinsicBaselines}
            efficiencyBaselines={efficiencyBaselines}
            intrinsicGain={intrinsicGain}
            realEfficiencyGain={realEfficiencyGain}
            coreConfigs={coreConfigs}
            currentCombatPower={charStats?.combatPower || '0'}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {gems.map((gem) => <ArkGemCard key={gem.id} gem={gem} usedInCore={usedGemMap[gem.id]} />)}
          </div>
        )}
      </>
    );
  }
  
  if (gems.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Box className="w-6 h-6 text-indigo-400" />
            <h2 className="text-lg font-black text-white">분석된 젬 인벤토리 <span className="text-slate-500 ml-2">({gems.length}개)</span></h2>
          </div>
          <button onClick={() => handleOptimize()} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all shadow-xl shadow-indigo-900/20 flex items-center gap-2">
            <Play className="w-3 h-3 fill-current" /> 최적화 실행
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gems.map((gem) => <ArkGemCard key={gem.id} gem={gem} usedInCore={usedGemMap[gem.id]} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-black mb-4 text-white">1. 스크린샷 붙여넣기</h3>
          <ImagePaste images={images} onImagesChange={setImages} loading={loading} />
        </div>
        <div>
          <h3 className="text-lg font-black mb-4 text-white">2. 코어 등급 설정</h3>
          <CoreSettings configs={coreConfigs} onChange={handleGradeChange} />
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-slate-800 flex gap-3">
        <button onClick={handleAnalyzeGems} disabled={images.length === 0 || loading} className="flex-1 py-5 rounded-2xl font-black text-sm bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2">
          {loading && loadingType === 'analysis' ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          젬 분석
        </button>
        <button onClick={() => handleOptimize()} disabled={gems.length === 0 || loading} className="flex-1 py-5 rounded-2xl font-black text-sm bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 shadow-2xl transition-all flex items-center justify-center gap-2">
          {loading && loadingType === 'optimization' ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          최적화
        </button>
      </div>
      {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] font-bold text-red-400 text-center">{error}</div>}
    </div>
  );
};

export default ArkGridOptimizer;
