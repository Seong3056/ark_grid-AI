
import React, { useState } from 'react';
import { 
  Binary, Activity, Sun, Moon, Star, Sparkles, BarChart3, 
  LayoutGrid, HelpCircle, Info 
} from 'lucide-react';
import { 
  MultiOptimizationResult, CoreType, CoreGrade, 
  OptimizationMode, SingleOptimization 
} from '../types';
import { 
  CORE_TYPES, GRADE_OPTIONS, GEM_COEFFICIENTS 
} from '../constants';
import ArkGemCard from './GemCard';

interface OptimizationResultsViewProps {
  multiOptimization: MultiOptimizationResult;
  optMode: OptimizationMode;
  relevantEffects: string[];
  globalEffectTotals: Record<string, number>;
  intrinsicBaselines: Record<string, number>;
  efficiencyBaselines: Record<string, number>;
  intrinsicGain: number;
  realEfficiencyGain: number;
  coreConfigs: Record<CoreType, CoreGrade>;
  currentCombatPower: string;
}

const OptimizationResultsView: React.FC<OptimizationResultsViewProps> = ({
  multiOptimization,
  optMode,
  relevantEffects,
  globalEffectTotals,
  intrinsicBaselines,
  efficiencyBaselines,
  intrinsicGain,
  realEfficiencyGain,
  coreConfigs,
  currentCombatPower
}) => {
  const [activeTab, setActiveTab] = useState<CoreType>('질서의 해');

  const getCoreIcon = (type: string) => {
    if (type.includes('해')) return <Sun className="w-5 h-5 text-orange-400" />;
    if (type.includes('달')) return <Moon className="w-5 h-5 text-indigo-400" />;
    return <Star className="w-5 h-5 text-yellow-300" />;
  };  

  const activeGradeLimits = GRADE_OPTIONS.find(o => o.value === coreConfigs[activeTab]);
  
  
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-2xl border-l-4 border-l-indigo-500">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {optMode === 'intrinsic' ? <Binary className="w-6 h-6 text-slate-400" /> : <Activity className="w-6 h-6 text-indigo-400" />}
            <h2 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">
              {optMode === 'intrinsic' ? '젬 단독 이득 (전투스탯 미포함)' : '성능 요약 (실 효율 기준)'}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">
              {optMode === 'intrinsic' ? '기본스탯 대비 이득' : '최종 기대 수익 (Real Efficiency)'}
            </span>
            <span className={`text-4xl font-black ${optMode === 'intrinsic' ? 'text-slate-300' : 'text-emerald-400'}`}>
              +{optMode === 'intrinsic' ? intrinsicGain.toFixed(4) : realEfficiencyGain.toFixed(4)}%
            </span>
            <div className="mt-2">
              <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                예상 전투력
              </span>
              <span className="text-2xl font-black text-indigo-400">
                {(parseFloat(currentCombatPower.replace(/,/g, '')) * (1 + (optMode === 'intrinsic' ? intrinsicGain : realEfficiencyGain) / 100)).toFixed(2).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {relevantEffects.map(eff => {
            const totalLevel = globalEffectTotals[eff] || 0;
            const coeff = GEM_COEFFICIENTS[eff] || 0;
            const gemBonus = totalLevel * coeff;
            const baseline = optMode === 'intrinsic' ? intrinsicBaselines[eff] || 0 : efficiencyBaselines[eff] || 0;
            const efficiency = ((1 + baseline + gemBonus) / (1 + baseline) - 1) * 100;
            return (
              <div key={eff} className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase truncate mb-1">{eff}</span>
                <span className={`text-sm font-black ${totalLevel > 0 ? 'text-emerald-400' : 'text-slate-700'}`}>Lv.{totalLevel}</span>
                <div className="flex flex-col mt-2 pt-2 border-t border-slate-800/50">
                  <span className="text-[11px] font-bold text-slate-600">젬 효과: +{(gemBonus * 100).toFixed(2)}%</span>
                  <span className="text-[12px] font-black text-indigo-400">실 효율: +{efficiency.toFixed(4)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 p-1.5 bg-slate-950/60 rounded-[28px] border border-slate-800 overflow-x-auto no-scrollbar" style={{ "justify-content": "space-evenly" }}>
        {CORE_TYPES.map(type => (
          <button 
            key={type} 
            onClick={() => setActiveTab(type)} 
            className={`flex items-center gap-2 px-6 py-3.5 rounded-[20px] text-[11px] font-black transition-all whitespace-nowrap ${activeTab === type ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {getCoreIcon(type)} {type}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-2xl overflow-hidden group">
            <span className="text-[10px] font-black text-slate-500 uppercase block mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> 코어 스케일링
            </span>
            <p className="text-4xl font-black text-indigo-400">+{multiOptimization.results[activeTab]?.summary?.scalingGain.toFixed(2)}%</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-2xl">
            <span className="text-[10px] font-black text-slate-500 uppercase block mb-4">
              의지력 소모 (최대: {activeGradeLimits?.will})
            </span>
            <div className="flex items-end gap-2">
              <p className={`text-5xl font-black ${multiOptimization.results[activeTab]?.summary?.totalWill > (activeGradeLimits?.will || 0) ? 'text-red-500' : 'text-emerald-400'}`}>
                {multiOptimization.results[activeTab]?.summary?.totalWill}
              </p>
              <span className="text-xl font-black text-slate-600 mb-1">/ {activeGradeLimits?.will}</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-2xl">
            <span className="text-[10px] font-black text-slate-500 uppercase block mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" /> 포인트 합계 (상한: {activeGradeLimits?.point})
            </span>
            <div className="flex items-end gap-2">
              <p className={`text-5xl font-black ${multiOptimization.results[activeTab]?.summary?.totalPoints >= (activeGradeLimits?.point || 0) ? 'text-emerald-400' : 'text-slate-300'}`}>
                {multiOptimization.results[activeTab]?.summary?.totalPoints}
              </p>
              <span className="text-xl font-black text-slate-600 mb-1">/ {activeGradeLimits?.point}</span>
            </div>
          </div>
        </div>

        <section className="bg-slate-900 p-10 rounded-[56px] border border-slate-800 shadow-2xl relative">
          <h2 className="text-2xl font-black text-white flex items-center gap-4 mb-8">
            <LayoutGrid className="w-8 h-8 text-indigo-500" /> 추천 젬 배치 ({activeTab})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {multiOptimization.results[activeTab]?.slots?.length > 0 ? (
              multiOptimization.results[activeTab].slots.map((slot, idx) => (
                <div key={idx} className="relative group">
                  <div className={`absolute -top-3 -left-3 w-9 h-9 ${slot.isActive ? 'bg-indigo-600' : 'bg-slate-800'} rounded-2xl flex items-center justify-center text-sm font-black text-white z-10 border-2 border-white/10`}>
                    {idx + 1}
                  </div>
                  <ArkGemCard gem={slot.gem} usedInCore={activeTab} />
                </div>
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 py-20 text-center border-2 border-dashed border-slate-800 rounded-[32px] bg-slate-950/20">
                <HelpCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-bold italic uppercase tracking-widest">배치 가능한 젬이 없습니다</p>
              </div>
            )}
          </div>
          <div className="mt-12 p-8 bg-indigo-950/20 rounded-[40px] border border-indigo-500/20">
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" /> AI 가이드
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">{multiOptimization.results[activeTab]?.reasoning}</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OptimizationResultsView;
