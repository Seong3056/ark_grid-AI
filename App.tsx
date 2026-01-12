import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArkGridGem, MultiOptimizationResult, CoreGrade, CoreType, 
  SingleOptimization, PlayerRole, OptimizationMode, StatSource, CharStats 
} from './types';
import { ArmoryEquipment, ArkPassive } from './types/lostark';
import { 
  DEALER_EFFECTS, SUPPORT_EFFECTS, GEM_COEFFICIENTS, CORE_TYPES 
} from './constants';
import { analyzeArkGridFromImage } from './services/geminiService';
import { runLocalOptimization } from './services/optimizationEngine';
import ImagePaste from './components/ImagePaste';
import ArkGemCard from './components/GemCard';
import CharacterProfile from './components/CharacterProfile';
import CoreSettings from './components/CoreSettings';
import OptimizationResultsView from './components/OptimizationResultsView';
import Equipment from './components/Equipment';
import ArkPassiveView from './components/ArkPassiveView';
import Tabs from './components/Tabs';
import { 
  LayoutGrid, Play, RefreshCcw, Zap, Box, Calculator, Search 
} from 'lucide-react';
import { parseCharacterData } from './services/characterParser';
import { log } from 'node:console';

type Mode = 'results' | 'inventory';
type MainTab = '캐릭터' | '아크패시브' | '아크그리드';

const App: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [gems, setGems] = useState<ArkGridGem[]>([]);
  const [role, setRole] = useState<PlayerRole>('dealer');
  const [nickname, setNickname] = useState<string>('');
  const lostArkApiKey = process.env.API_KEY || '';
  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  const [charStats, setCharStats] = useState<CharStats | null>(null);
  const [equipment, setEquipment] = useState<ArmoryEquipment[] | null>(null);
  const [editableEquipment, setEditableEquipment] = useState<ArmoryEquipment[] | null>(null);
  const [arkPassive, setArkPassive] = useState<ArkPassive | null>(null);
  const [mode, setMode] = useState<Mode>('results');
  const [optMode, setOptMode] = useState<OptimizationMode>('efficiency');
  const [activeTab, setActiveTab] = useState<MainTab>('캐릭터');
  const [adrenalineBuff, setAdrenalineBuff] = useState<StatSource | null>(null);
  
  useEffect(() => {
    setEditableEquipment(equipment);
  }, [equipment]);

  const handleEnhancementChange = (itemType: string, newLevel: number) => {
    if (!editableEquipment) return;

    const newEquipment = editableEquipment.map(item => {
      if (item.Type === itemType) {
        const nameParts = item.Name.split(' ');
        nameParts[0] = `+${newLevel}`;
        return { ...item, Name: nameParts.join(' ') };
      }
      return item;
    });
    setEditableEquipment(newEquipment);
    // TODO: Recalculate stats here
  };
  
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
  const [loadingType, setLoadingType] = useState<'analysis' | 'optimization' | 'search' | null>(null);
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

  const intrinsicBaselines = useMemo(() => {
    if (!charStats) return {};
    const parse = (sources: StatSource[]) => {
      return sources
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
    const parse = (sources: StatSource[]) => {
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

  const handleSearchNickname = async () => {
    if (!nickname) return setError("닉네임을 입력해주세요.");
    if (!lostArkApiKey) {
      return setError("Lost Ark API 키를 설정해주세요.");
    }

    setLoading(true);
    setLoadingType('search');
    setStatus('캐릭터 정보 검색 중...');
    setError(null);
    setAdrenalineBuff(null);
    setEquipment(null);
    setArkPassive(null);

    try {
      const response = await fetch(`https://developer-lostark.game.onstove.com/armories/characters/${encodeURIComponent(nickname)}`, {        
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'authorization': `bearer ${lostArkApiKey}`
        }
      });

      if (response.status === 401) throw new Error("API 키가 유효하지 않습니다.");
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      if (!data) throw new Error("캐릭터 정보가 존재하지 않습니다.");

      const parsedData = parseCharacterData(data);

      setEquipment(parsedData.equipment);
      setArkPassive(parsedData.arkPassive);
      setAdrenalineBuff(parsedData.adrenalineBuff);
      setCharStats(parsedData.charStats);
      setActiveTab('캐릭터');

      setStatus('검색 완료');
      setTimeout(() => setStatus(''), 1500);
    } catch (err: any) {
      setError(err.message || "캐릭터 정보를 가져오지 못했습니다.");
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
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
      setActiveTab('아크그리드');
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
        setActiveTab('아크그리드');
        setLoading(false);
      } catch (err) {
        setError("최적화 오류");
        setLoading(false);
      }
    }, 600);
  };

  const renderArkGridContent = () => {
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
  }

  return (
    <div className="min-h-screen la-gradient text-slate-200 pb-20 font-sans">
      <nav className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><Zap className="text-white w-6 h-6" /></div>
            <div>
              <h1 className="font-black tracking-tighter text-2xl uppercase italic">Ark-Grid AI</h1>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Efficiency Optimizer</p>
            </div>
          </div>
          {multiOptimization && (
             <div className="hidden lg:flex items-center gap-6 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
               <button onClick={() => handleOptimize('intrinsic')} className={`flex items-center gap-3 px-6 py-2 rounded-xl transition-all ${optMode === 'intrinsic' ? 'bg-slate-800 text-white border border-slate-600' : 'text-slate-500 hover:text-slate-300'}`}>
                 <div className="flex flex-col items-start">
                   <span className="text-[9px] font-black uppercase">젬 단독 이득 (전투스탯 미포함)</span>
                   <span className="text-sm font-black">+{intrinsicGain.toFixed(4)}%</span>
                 </div>
               </button>
               <div className="w-px h-8 bg-slate-800" />
               <button onClick={() => handleOptimize('efficiency')} className={`flex items-center gap-3 px-6 py-2 rounded-xl transition-all ${optMode === 'efficiency' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
                 <div className="flex flex-col items-start">
                   <span className="text-[9px] font-black uppercase">실 효율 (달인/아드 포함)</span>
                   <span className="text-sm font-black">+{realEfficiencyGain.toFixed(4)}%</span>
                 </div>
               </button>
             </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-900/90 p-8 rounded-[32px] border border-slate-800 shadow-2xl relative">
            <CharacterProfile 
              nickname={nickname} setNickname={setNickname} 
              role={role} setRole={setRole} 
              charStats={charStats} loading={loading && loadingType === 'search'} 
              onSearch={handleSearchNickname} 
            />
          </section>
        </div>

        <div className="lg:col-span-8">
            <div className="bg-slate-900/90 border border-slate-800 rounded-[32px] shadow-2xl">
                <Tabs 
                    tabs={['캐릭터', '아크패시브', '아크그리드']} 
                    activeTab={activeTab} 
                    onTabClick={(tab) => setActiveTab(tab as MainTab)}
                />
                <div className="p-8">
                    {activeTab === '캐릭터' && <Equipment equipment={editableEquipment} onEnhancementChange={handleEnhancementChange} />}
                    {activeTab === '아크패시브' && <ArkPassiveView arkPassive={arkPassive} />}
                    {activeTab === '아크그리드' && renderArkGridContent()}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
