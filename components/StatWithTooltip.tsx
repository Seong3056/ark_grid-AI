
import React from 'react';
import { StatSource } from '../types';
import { Sword, Sparkles, Zap } from 'lucide-react';

interface StatWithTooltipProps {
  label: string;
  value: string;
  sources: StatSource[];
  colorClass: string;
}

const StatWithTooltip: React.FC<StatWithTooltipProps> = ({ label, value, sources, colorClass }) => {
  const totalAll = sources.reduce((a, b) => a + b.value, 0);
  const displayValNum = parseFloat(value);
  
  // 특수 패시브 리스트 (합산 제외 대상)
  const SPECIAL_PASSIVES = ["선각자", "진군", "입식 타격가", "마나용광로", "안정된 관리자"];
  const COMBAT_BUFFS = ["아드레날린", "달인"];

  const hasExtraStats = Math.abs(totalAll - displayValNum) > 0.01;

  return (
    <div className="text-center group relative cursor-help">
      <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-tight">{label}</span>
      <span className={`text-base font-black ${colorClass} block underline decoration-dotted decoration-slate-600 underline-offset-4`}>{value}</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] scale-95 group-hover:scale-100 pointer-events-none">
        <div className="space-y-2.5">
          <div className="text-[10px] font-black text-slate-500 border-b border-slate-800 pb-2 uppercase tracking-widest">{label} 상세 정보</div>
          <div className="max-h-56 overflow-y-auto pr-1 custom-scrollbar">
            {sources && sources.length > 0 ? (
              sources.map((s, i) => {
                const isCombatBuff = COMBAT_BUFFS.some(b => s.name.includes(b));
                const isSpecialPassive = SPECIAL_PASSIVES.some(p => s.name.includes(p));
                
                return (
                  <div key={i} className={`flex justify-between items-center gap-4 text-[11px] border-b border-slate-800/50 py-1.5 last:border-0`}>
                    <span className={`truncate max-w-[170px] text-left flex items-center gap-1.5 ${isCombatBuff || isSpecialPassive ? 'text-indigo-400 font-bold' : 'text-slate-400 font-medium'}`}>
                      {isCombatBuff && <Sparkles className="w-3 h-3 shrink-0" />}
                      {isSpecialPassive && <Zap className="w-3 h-3 shrink-0 text-amber-400" />}
                      {s.name}
                    </span>
                    <span className={`${isCombatBuff || isSpecialPassive ? 'text-indigo-400' : colorClass} font-black shrink-0`}>+{s.value.toFixed(2)}%</span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-2 text-[10px] text-slate-600 font-bold italic">데이터 없음</div>
            )}
          </div>
          {hasExtraStats && (
            <div className="mt-2 pt-2 border-t-2 border-slate-800/80 flex justify-between items-center bg-indigo-500/10 -mx-4 px-4 py-2 rounded-b-xl">
              <span className="text-[10px] font-black text-indigo-400 uppercase flex items-center gap-1.5">
                <Sword className="w-3 h-3" /> 실전 시 총합 (실효율 기준)
              </span>
              <span className={`text-xs font-black ${colorClass}`}>{totalAll.toFixed(2)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatWithTooltip;
