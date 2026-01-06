
import React from 'react';
import { ArkGridGem, CoreType } from '../types';
import { CheckCircle2, Sun, Moon, Star } from 'lucide-react';

interface GemCardProps {
  gem: ArkGridGem;
  usedInCore?: CoreType | string;
}

const ArkGemCard: React.FC<GemCardProps> = ({ gem, usedInCore }) => {
  const getWillStyle = (will: number) => {
    switch(will) {
      case 1: return { style: { color: '#60A5FA' }, className: '' }; 
      case 2: return { style: { color: '#34D399' }, className: '' }; 
      case 3: return { style: { color: '#CE4300' }, className: '' };
      case 4: return { style: {}, className: 'text-yellow-500' };
      case 5: return { style: { color: '#B239D3' }, className: '' }; 
      default: return { style: { color: '#94A3B8' }, className: '' };
    }
  };

  const getCoreIcon = (coreName: string) => {
    if (coreName.includes('해')) return <Sun className="w-3 h-3 text-orange-400" />;
    if (coreName.includes('달')) return <Moon className="w-3 h-3 text-indigo-400" />;
    if (coreName.includes('별')) return <Star className="w-3 h-3 text-yellow-300" />;
    return <CheckCircle2 className="w-3 h-3 text-white" />;
  };

  const willStyle = getWillStyle(gem.will);
  const categoryColor = gem.category === '질서' ? 'text-red-400' : 'text-blue-400';
  const isUsed = !!usedInCore;

  return (
    <div className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
      isUsed 
        ? 'border-indigo-500 bg-indigo-500/15 shadow-xl shadow-indigo-900/40 ring-2 ring-indigo-500/20 scale-[1.02]' 
        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
    }`}>
      {/* Placement Badge */}
      {isUsed && (
        <div className="absolute -top-1 -right-1 bg-indigo-600 text-white px-3 py-1.5 rounded-bl-xl flex items-center gap-1.5 z-10 shadow-lg border-b border-l border-white/10">
          {getCoreIcon(usedInCore)}
          <span className="text-[9px] font-black uppercase tracking-tighter truncate max-w-[80px]">
            {usedInCore.replace('질서의 ', '').replace('혼돈의 ', '')} 배치
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {/* Category Tag */}
        {gem.category && (
          <div className={`text-[10px] font-black uppercase tracking-widest ${categoryColor} ${isUsed ? 'opacity-100' : 'opacity-80'}`}>
            {gem.category}
          </div>
        )}

        <div className="flex flex-wrap gap-y-2 justify-between">
          {/* 의지력 */}
          <div className="w-[49%] text-sm font-black flex items-center gap-1">
            <span className={`${willStyle.className}`} style={willStyle.style}>
              의지력{gem.will}
            </span>
          </div>

          {/* 포인트 */}
          <div className="w-[49%] text-sm font-black flex items-center gap-1">
            <span className={`${isUsed ? 'text-slate-200' : 'text-slate-400'}`}>
              포인트{gem.point}
            </span>
          </div>

          {/* 옵션 1 */}
          <div className="w-[49%] text-[12px] font-bold text-slate-200 flex items-center gap-1 overflow-hidden">
            <span className="truncate">{gem.option1.effect}</span>
            <span className="text-emerald-400 shrink-0">{gem.option1.level}</span>
          </div>

          {/* 옵션 2 */}
          <div className="w-[49%] text-[12px] font-bold text-slate-200 flex items-center gap-1 overflow-hidden">
            <span className="truncate">{gem.option2.effect}</span>
            <span className="text-blue-400 shrink-0">{gem.option2.level}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArkGemCard;
