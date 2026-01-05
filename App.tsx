
import React, { useState } from 'react';
import { ArkGridGem, MultiOptimizationResult, CoreGrade, CoreType, SingleOptimization } from './types';
import { analyzeArkGridFromImage, optimizeAllCores } from './services/geminiService';
import ImagePaste from './components/ImagePaste';
import ArkGemCard from './components/GemCard';
import { LayoutGrid, Target, Play, RefreshCcw, Info, ShieldCheck, Zap, Gauge, AlertCircle, Sun, Moon, Star, Settings2, ChevronRight, Layers, Sword, Crosshair, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [gems, setGems] = useState<ArkGridGem[]>([]);
  
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

  const handleGradeChange = (type: CoreType, grade: CoreGrade) => {
    setCoreConfigs(prev => ({ ...prev, [type]: grade }));
  };

  const handleStartAnalysis = async () => {
    if (images.length === 0) {
      setError("스크린샷을 붙여넣어주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setMultiOptimization(null);
    
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
      setStatus("6종 코어(각 4슬롯) 통합 최적화 계산 중...");
      
      const result = await optimizeAllCores(uniqueGems, coreConfigs);
      setMultiOptimization(result);

    } catch (err: any) {
      console.error(err);
      setError("분석 중 오류가 발생했습니다. 이미지가 선명한지 확인해주세요.");
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
    <div className="min-h-screen la-gradient text-slate-200 pb-20">
      <nav className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
              <Zap className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black tracking-tighter text-2xl uppercase italic">Ark-Grid AI</h1>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Core Power Maximizer</p>
            </div>
          </div>
          {multiOptimization && (
             <div className="hidden lg:flex items-center gap-6 bg-slate-950/60 px-6 py-2 rounded-2xl border border-slate-800 animate-in fade-in zoom-in">
               <div className="flex flex-col">
                 <span className="text-[9px] font-black text-slate-500 uppercase">Total Performance Gain</span>
                 <span className="text-xl font-black text-indigo-400">+{multiOptimization.totalExpectedGain.toFixed(3)}%</span>
               </div>
             </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-900/90 p-8 rounded-[32px] border border-slate-800 shadow-2xl relative">
            <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Target className="w-4 h-4" />
              1. 젬 인벤토리 캡처
            </h2>
            <ImagePaste images={images} onImagesChange={setImages} loading={loading} />
            
            <div className="mt-8 pt-8 border-t border-slate-800/50">
              <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                2. 코어 등급 설정 (의지력 제한)
              </h2>
              <div className="space-y-3">
                {coreTypes.map(type => (
                  <div key={type} className="flex items-center justify-between bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      {getCoreIcon(type)}
                      <span className="text-xs font-black text-slate-300">{type}</span>
                    </div>
                    <select 
                      className="bg-slate-900 border border-slate-700 text-[10px] font-black text-indigo-400 px-2 py-1.5 rounded-lg focus:outline-none"
                      value={coreConfigs[type]}
                      onChange={(e) => handleGradeChange(type, e.target.value as CoreGrade)}
                    >
                      {gradeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label} ({gradeOptions.find(g => g.value === opt.value)?.limit})</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartAnalysis}
              disabled={loading || images.length === 0}
              className={`w-full mt-8 py-5 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all ${
                loading || images.length === 0 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-900/50'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCcw className="w-5 h-5 animate-spin" />
                  <span>{status}</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>전체 코어 최적화</span>
                </>
              )}
            </button>
          </section>

          {gems.length > 0 && (
            <section className="bg-slate-900/90 p-8 rounded-[32px] border border-slate-800 shadow-xl max-h-[400px] overflow-y-auto custom-scrollbar">
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">스캔된 젬 목록 ({gems.length}개)</h3>
              <div className="space-y-3">
                {gems.map(gem => (
                  <ArkGemCard key={gem.id} gem={gem} />
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-8">
          {!multiOptimization && !loading && (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center p-12 bg-slate-900/30 rounded-[48px] border-2 border-dashed border-slate-800/50 text-center">
              <div className="w-24 h-24 bg-indigo-500/5 rounded-full flex items-center justify-center mb-8 border border-indigo-500/10">
                <Layers className="w-12 h-12 text-indigo-500/20" />
              </div>
              <h3 className="text-2xl font-black text-slate-400">최적화 리포트 대기</h3>
              <p className="text-slate-500 mt-4 max-w-sm leading-relaxed font-medium">
                의지력 제한과 전투 옵션 계수(공격력 3.667%, 보피 8.3334%, 추피 8.0834%)를<br/>모두 계산하여 최적의 배치를 제안합니다.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-8 p-6 bg-red-950/30 border-2 border-red-500/20 rounded-3xl text-red-200 flex items-center gap-4 animate-in fade-in">
              <AlertCircle className="w-8 h-8 shrink-0 text-red-500" />
              <span className="font-black text-lg">{error}</span>
            </div>
          )}

          {multiOptimization && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex flex-wrap gap-2 p-1.5 bg-slate-950/60 rounded-[28px] border border-slate-800">
                {coreTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setActiveTab(type)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-[20px] text-[11px] font-black transition-all ${
                      activeTab === type 
                      ? 'bg-indigo-600 text-white shadow-xl scale-105' 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    {getCoreIcon(type)}
                    {type}
                  </button>
                ))}
              </div>

              {multiOptimization.results[activeTab] && (
                <div className="space-y-8 animate-in zoom-in-95 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        코어 기대 성능
                      </span>
                      <div className="flex items-end gap-2">
                        <p className="text-5xl font-black text-indigo-400">+{multiOptimization.results[activeTab].summary.totalPowerGain.toFixed(3)}</p>
                        <span className="text-sm font-black text-slate-500 mb-2">%</span>
                      </div>
                      <div className="mt-4 flex flex-col gap-1 text-[10px] font-bold text-slate-500">
                        <div className="flex justify-between">
                          <span>스케일링 보너스:</span>
                          <span className="text-slate-300">+{multiOptimization.results[activeTab].summary.scalingGain.toFixed(3)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>전투 옵션 합산:</span>
                          <span className="text-slate-300">+{multiOptimization.results[activeTab].summary.combatOptionGain.toFixed(3)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">의지력 코스트</span>
                      <div className="flex items-end gap-2">
                        <p className={`text-5xl font-black ${multiOptimization.results[activeTab].summary.totalWill > multiOptimization.results[activeTab].summary.willLimit ? 'text-red-500' : 'text-emerald-400'}`}>
                          {multiOptimization.results[activeTab].summary.totalWill}
                        </p>
                        <span className="text-xl font-black text-slate-600 mb-1">/ {multiOptimization.results[activeTab].summary.willLimit}</span>
                      </div>
                      <div className="mt-4 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                         <div 
                           className={`h-full transition-all duration-1000 ${multiOptimization.results[activeTab].summary.totalWill > multiOptimization.results[activeTab].summary.willLimit ? 'bg-red-500' : 'bg-emerald-500'}`}
                           style={{ width: `${Math.min(100, (multiOptimization.results[activeTab].summary.totalWill / multiOptimization.results[activeTab].summary.willLimit) * 100)}%` }}
                         />
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-2xl">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 flex items-center gap-2">
                        <Sword className="w-4 h-4 text-orange-400" />
                        전투 옵션 합계
                      </span>
                      <div className="space-y-2">
                        {['공격력', '보스 피해', '추가 피해'].map(eff => (
                          <div key={eff} className="flex justify-between items-center bg-slate-950/30 p-2 rounded-xl border border-slate-800/50">
                            <span className="text-[10px] font-bold text-slate-400">{eff}</span>
                            <span className="text-xs font-black text-emerald-400">Lv.{multiOptimization.results[activeTab].summary.effectTotals[eff] || 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <section className="bg-slate-900 p-10 rounded-[56px] border border-slate-800 shadow-2xl relative">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                      <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-4">
                          <LayoutGrid className="w-8 h-8 text-indigo-500" />
                          최적 4슬롯 배치 ({activeTab})
                        </h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">이 코어에 할당된 최적의 젬 4개입니다.</p>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 rounded-xl border border-indigo-500/20">
                         <Crosshair className="w-4 h-4 text-indigo-400" />
                         <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Points: {multiOptimization.results[activeTab].summary.totalPoints}P</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {multiOptimization.results[activeTab].slots.map((slot, idx) => (
                        <div key={idx} className="relative group">
                          <div className={`absolute -top-3 -left-3 w-9 h-9 ${slot.isActive ? 'bg-indigo-600' : 'bg-slate-800'} rounded-2xl flex items-center justify-center text-sm font-black text-white z-10 shadow-2xl border-2 border-white/10`}>
                            {idx + 1}
                          </div>
                          {!slot.isActive && (
                            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] z-20 rounded-xl flex items-center justify-center flex-col p-4 text-center border-2 border-red-500/20">
                              <AlertCircle className="text-red-500 mb-2 w-8 h-8" />
                              <p className="text-[11px] font-black text-red-400 uppercase tracking-tighter leading-tight">의지력 제한 초과<br/>발동 불가능</p>
                            </div>
                          )}
                          <ArkGemCard gem={slot.gem} isRecommended={slot.isActive} />
                        </div>
                      ))}
                    </div>

                    <div className="mt-12 p-8 bg-indigo-950/20 rounded-[40px] border border-indigo-500/20">
                       <div className="flex items-center gap-3 mb-6">
                         <Info className="w-5 h-5 text-indigo-400" />
                         <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">
                           최적화 상세 리포트
                         </h3>
                       </div>
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {multiOptimization.results[activeTab].reasoning}
                      </p>
                    </div>
                  </section>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-20 bg-slate-950/95 backdrop-blur-3xl border-t border-slate-800 flex items-center z-50">
        <div className="max-w-7xl mx-auto px-4 w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
             <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">
               Ark-Grid Optimizer v6.0 Engine Active
             </p>
          </div>
          <div className="flex gap-4">
             <button 
               className="px-10 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-900/50 uppercase tracking-[0.2em]"
               onClick={() => window.print()}
             >
               SAVE DATA
             </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
