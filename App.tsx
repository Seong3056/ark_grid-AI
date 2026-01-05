
import React, { useState, useMemo } from 'react';
import { ArkGridGem, MultiOptimizationResult, CoreGrade, CoreType, SingleOptimization, PlayerRole } from './types';
import { analyzeArkGridFromImage, optimizeAllCores } from './services/geminiService';
import ImagePaste from './components/ImagePaste';
import ArkGemCard from './components/GemCard';
import { LayoutGrid, Target, Play, RefreshCcw, Info, ShieldCheck, Zap, Gauge, AlertCircle, Sun, Moon, Star, Settings2, ChevronRight, Layers, Sword, Crosshair, Sparkles, User, Users, Fingerprint, Activity, Calculator, Search } from 'lucide-react';

const COMBAT_COEFFICIENTS: Record<string, number> = {
  '공격력': 0.03667,
  '보스 피해': 0.083334,
  '추가 피해': 0.080834,
  '낙인력': 0.05,
  '아군 공격 강화': 0.05,
  '아군 피해 강화': 0.05
};

const DEALER_EFFECTS = ['공격력', '보스 피해', '추가 피해'];
const SUPPORT_EFFECTS = ['낙인력', '아군 공격 강화', '아군 피해 강화'];

const App: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [gems, setGems] = useState<ArkGridGem[]>([]);
  const [role, setRole] = useState<PlayerRole>('dealer');
  const [nickname, setNickname] = useState<string>('');
  
  const [coreConfigs, setCoreConfigs] = useState<Record<CoreType, CoreGrade>>({
    '질서의 해': 'Relic',
    '질서의 달': 'Relic',
    '질서의 별': 'Relic',
    '혼돈의 해': 'Relic',
    '혼돈의 달': 'Relic',
    '혼돈의 별': 'Relic',
  });

  const [multiOptimization, setMultiOptimization] = useState<MultiOptimizationResult | null>(null);
  const [activeTab, setActiveTab] = useState<CoreType>('질서의 해');
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const coreTypes: CoreType[] = ['질서의 해', '질서의 달', '질서의 별', '혼돈의 해', '혼돈의 달', '혼돈의 별'];
  const gradeOptions: { label: string; value: CoreGrade; limit: number }[] = [
    { label: '영웅', value: 'Hero', limit: 9 },
    { label: '전설', value: 'Legend', limit: 12 },
    { label: '유물', value: 'Relic', limit: 15 },
    { label: '고대', value: 'Ancient', limit: 17 },
  ];

  // 현재 역할에 따른 유효 옵션 목록
  const relevantEffects = useMemo(() => {
    return role === 'dealer' ? DEALER_EFFECTS : SUPPORT_EFFECTS;
  }, [role]);

  // 옵션별 전역 레벨 합계 (현재 역할에 유효한 옵션만 계산)
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

  // 최종 복리 계산 결과
  const finalCalculatedGain = useMemo(() => {
    if (!multiOptimization) return 0;
    
    let coreProduct = 1.0;
    (Object.values(multiOptimization.results) as SingleOptimization[]).forEach(res => {
      const scaling = res?.summary?.scalingGain || 0;
      coreProduct *= (1 + scaling / 100);
    });

    let optionProduct = 1.0;
    relevantEffects.forEach(eff => {
      const level = globalEffectTotals[eff] || 0;
      const coeff = COMBAT_COEFFICIENTS[eff] || 0;
      optionProduct *= (1 + (level * coeff) / 100);
    });

    return (coreProduct * optionProduct - 1) * 100;
  }, [multiOptimization, globalEffectTotals, relevantEffects]);

  const handleGradeChange = (type: CoreType, grade: CoreGrade) => {
    setCoreConfigs(prev => ({ ...prev, [type]: grade }));
  };

  // 1. 젬 분석 함수
  const handleAnalyzeGems = async () => {
    if (images.length === 0) {
      setError("스크린샷을 붙여넣어주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    let allGems: ArkGridGem[] = [];
    try {
      for (let i = 0; i < images.length; i++) {
        setStatus(`${i + 1}/${images.length} 페이지 분석 중...`);
        const result = await analyzeArkGridFromImage(images[i]);
        allGems = [...allGems, ...(result.detectedGems || [])];
      }
      const uniqueGems = Array.from(new Map(allGems.map(g => [
        `${g.will}-${g.point}-${g.option1.effect}-${g.option1.level}-${g.option2.effect}-${g.option2.level}`, g
      ])).values());
      setGems(uniqueGems);
      setStatus(`${uniqueGems.length}개의 젬 분석 완료`);
      setTimeout(() => setStatus(''), 2000);
    } catch (err: any) {
      console.error(err);
      setError("분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 2. 최적화 함수
  const handleOptimize = async () => {
    if (gems.length === 0) {
      setError("먼저 젬을 분석해주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    setMultiOptimization(null);
    try {
      setStatus("6종 코어 복리 최적화 계산 중...");
      const result = await optimizeAllCores(gems, coreConfigs, role);
      setMultiOptimization(result);
    } catch (err: any) {
      console.error(err);
      setError("최적화 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const getCoreIcon = (type: string) => {
    if (type.includes('해')) return <Sun className="w-5 h-5 text-orange-400" />;
    if (type.includes('달')) return <Moon className="w-5 h-5 text-indigo-400" />;
    return <Star className="w-5 h-5 text-yellow-300" />;
  };

  return (
    <div className="min-h-screen la-gradient text-slate-200 pb-20 font-sans">
      <nav className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
              <Zap className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black tracking-tighter text-2xl uppercase italic">Ark-Grid AI</h1>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Multiplicative Engine</p>
            </div>
          </div>
          {multiOptimization && (
             <div className="hidden lg:flex items-center gap-6 bg-slate-950/60 px-6 py-2 rounded-2xl border border-slate-800">
               <div className="flex flex-col">
                 <span className="text-[9px] font-black text-slate-500 uppercase">Total Expected Gain (Compound)</span>
                 <span className="text-xl font-black text-indigo-400">+{finalCalculatedGain.toFixed(4)}%</span>
               </div>
             </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-900/90 p-8 rounded-[32px] border border-slate-800 shadow-2xl relative">
            <div className="mb-8">
               <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Fingerprint className="w-4 h-4" /> 0. 닉네임
              </h2>
              <div className="relative">
                <input 
                  type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임을 입력하세요"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-12 text-sm font-bold text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Target className="w-4 h-4" /> 1. 젬 캡처
              </h2>
              <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button onClick={() => setRole('dealer')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${role === 'dealer' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}><Sword className="w-3 h-3 inline mr-1"/>딜러</button>
                <button onClick={() => setRole('support')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${role === 'support' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}><Users className="w-3 h-3 inline mr-1"/>서폿</button>
              </div>
            </div>

            <ImagePaste images={images} onImagesChange={setImages} loading={loading} />
            
            <div className="mt-8 pt-8 border-t border-slate-800/50">
              <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> 2. 코어 등급 (의지력 제한)
              </h2>
              <div className="space-y-3">
                {coreTypes.map(type => (
                  <div key={type} className="flex items-center justify-between bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      {getCoreIcon(type)}
                      <span className="text-xs font-black text-slate-300">{type}</span>
                    </div>
                    <select 
                      className="bg-slate-900 border border-slate-700 text-[10px] font-black text-indigo-400 px-2 py-1.5 rounded-lg"
                      value={coreConfigs[type]}
                      onChange={(e) => handleGradeChange(type, e.target.value as CoreGrade)}
                    >
                      {gradeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label} ({gradeOptions.find(g => g.value === opt.value)?.limit})</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-8">
              <button
                onClick={handleAnalyzeGems} disabled={loading || images.length === 0}
                className={`py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${loading || images.length === 0 ? 'bg-slate-800 text-slate-600' : 'bg-slate-700 hover:bg-slate-600 text-white shadow-xl'}`}
              >
                {loading && status.includes('분석') ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>젬 분석</span>
              </button>
              <button
                onClick={handleOptimize} disabled={loading || gems.length === 0}
                className={`py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${loading || gems.length === 0 ? 'bg-slate-800 text-slate-600' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl'}`}
              >
                {loading && status.includes('최적화') ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                <span>최적화</span>
              </button>
            </div>
            
            {status && (
              <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                <RefreshCcw className={`w-4 h-4 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-[11px] font-bold text-indigo-300">{status}</span>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-[11px] font-bold text-red-400">{error}</span>
              </div>
            )}
          </section>

          {/* analyzed gems list preview */}
          {gems.length > 0 && !loading && (
            <div className="bg-slate-900/60 p-6 rounded-[32px] border border-slate-800 max-h-[400px] overflow-y-auto">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                <span>분석된 젬 ({gems.length})</span>
                <button onClick={() => setGems([])} className="text-red-500 hover:underline">초기화</button>
              </h3>
              <div className="space-y-2">
                {gems.map(gem => (
                  <div key={gem.id} className="text-[10px] bg-slate-950/40 p-2 rounded-lg border border-slate-800/50 flex justify-between items-center">
                    <span className="font-bold text-slate-400">P{gem.point} / W{gem.will}</span>
                    <span className="text-slate-500 truncate max-w-[120px]">{gem.option1.effect} {gem.option1.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          {!multiOptimization && !loading && (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center p-12 bg-slate-900/30 rounded-[48px] border-2 border-dashed border-slate-800/50 text-center text-slate-500">
              <Calculator className="w-16 h-16 mb-4 opacity-20" />
              <div className="space-y-2">
                <p className="font-bold text-lg text-slate-400">스마트 아크그리드 최적화</p>
                <p className="font-medium text-sm">
                  1. 인벤토리 스크린샷을 붙여넣으세요.<br/>
                  2. <span className="text-slate-300 font-bold">"젬 분석"</span>을 눌러 데이터를 추출합니다.<br/>
                  3. <span className="text-indigo-400 font-bold">"최적화"</span>를 눌러 복리 성능이 극대화된 배치를 확인하세요.
                </p>
              </div>
            </div>
          )}

          {multiOptimization && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                     <Activity className="w-6 h-6 text-indigo-400" />
                     <h2 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">종합 복리 성능 리포트 ({role === 'dealer' ? '딜러' : '서폿'})</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-500 uppercase block">Total Gain</span>
                    <span className="text-3xl font-black text-emerald-400">+{finalCalculatedGain.toFixed(4)}%</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {relevantEffects.map(eff => {
                    const level = globalEffectTotals[eff] || 0;
                    const coeff = COMBAT_COEFFICIENTS[eff] || 0;
                    const gain = level * coeff;
                    return (
                      <div key={eff} className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex flex-col group hover:border-emerald-500/30 transition-all">
                        <span className="text-[9px] font-bold text-slate-500 uppercase truncate mb-1">{eff}</span>
                        <span className={`text-sm font-black ${level > 0 ? 'text-emerald-400' : 'text-slate-700'}`}>Lv.{level}</span>
                        <span className="text-[9px] font-medium text-slate-600 mt-1">x{ (1 + gain/100).toFixed(4) }</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 p-1.5 bg-slate-950/60 rounded-[28px] border border-slate-800">
                {coreTypes.map(type => (
                  <button key={type} onClick={() => setActiveTab(type)} className={`flex items-center gap-2 px-5 py-3 rounded-[20px] text-[11px] font-black transition-all ${activeTab === type ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-300'}`}>
                    {getCoreIcon(type)} {type}
                  </button>
                ))}
              </div>

              {multiOptimization.results[activeTab] && (
                <div className="space-y-8 animate-in zoom-in-95 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" /> 이 코어 스케일링 보너스
                      </span>
                      <div className="flex items-end gap-2">
                        <p className="text-4xl font-black text-indigo-400">+{multiOptimization.results[activeTab].summary.scalingGain.toFixed(2)}</p>
                        <span className="text-sm font-black text-slate-500 mb-2">%</span>
                      </div>
                      <p className="mt-2 text-[10px] font-bold text-slate-600 italic">배율: x{(1 + multiOptimization.results[activeTab].summary.scalingGain/100).toFixed(4)}</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">의지력 소모 (제한: {multiOptimization.results[activeTab].summary.willLimit})</span>
                      <div className="flex items-end gap-2">
                        <p className={`text-5xl font-black ${multiOptimization.results[activeTab].summary.totalWill > multiOptimization.results[activeTab].summary.willLimit ? 'text-red-500' : 'text-emerald-400'}`}>
                          {multiOptimization.results[activeTab].summary.totalWill}
                        </p>
                        <span className="text-xl font-black text-slate-600 mb-1">/ {multiOptimization.results[activeTab].summary.willLimit}</span>
                      </div>
                    </div>
                  </div>

                  <section className="bg-slate-900 p-10 rounded-[56px] border border-slate-800 shadow-2xl relative">
                    <h2 className="text-2xl font-black text-white flex items-center gap-4 mb-8">
                      <LayoutGrid className="w-8 h-8 text-indigo-500" /> 최적 4슬롯 배치 ({activeTab})
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {multiOptimization.results[activeTab].slots.map((slot, idx) => (
                        <div key={idx} className="relative group">
                          <div className={`absolute -top-3 -left-3 w-9 h-9 ${slot.isActive ? 'bg-indigo-600' : 'bg-slate-800'} rounded-2xl flex items-center justify-center text-sm font-black text-white z-10 border-2 border-white/10`}>
                            {idx + 1}
                          </div>
                          {!slot.isActive && <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] z-20 rounded-xl flex items-center justify-center flex-col p-4 text-center border-2 border-red-500/20"><AlertCircle className="text-red-500 mb-2 w-8 h-8" /><p className="text-[11px] font-black text-red-400">의지력 초과</p></div>}
                          <ArkGemCard gem={slot.gem} isRecommended={slot.isActive} />
                        </div>
                      ))}
                    </div>

                    <div className="mt-12 p-8 bg-indigo-950/20 rounded-[40px] border border-indigo-500/20">
                      <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">AI 분석 리포트</h3>
                      <p className="text-slate-400 text-sm leading-relaxed font-medium">{multiOptimization.results[activeTab].reasoning}</p>
                    </div>
                  </section>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
