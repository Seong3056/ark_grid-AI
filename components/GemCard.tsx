
import React from 'react';
import { ArkGridGem } from '../types';

interface GemCardProps {
  gem: ArkGridGem;
  isRecommended?: boolean;
}

const ArkGemCard: React.FC<GemCardProps> = ({ gem, isRecommended }) => {
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

  const willStyle = getWillStyle(gem.will);
  const categoryColor = gem.category === '질서' ? 'text-red-400' : 'text-blue-400';

  return (
    <div className={`p-4 rounded-2xl border ${isRecommended ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-900/30' : 'border-slate-800 bg-slate-900/60'} transition-all hover:border-slate-700`}>
      <div className="flex flex-col gap-2">
        {/* Category Tag */}
        {gem.category && (
          <div className={`text-[10px] font-black uppercase tracking-widest ${categoryColor} opacity-80`}>
            {gem.category}
          </div>
        )}

        {/* 2x2 Grid Layout */}
        <div className="flex flex-wrap gap-y-2 justify-between">
          {/* 의지력 */}
          <div className="w-[49%] text-sm font-black flex items-center gap-1">
            <span className={`${willStyle.className}`} style={willStyle.style}>
              의지력{gem.will}
            </span>
          </div>

          {/* 포인트 */}
          <div className="w-[49%] text-sm font-black flex items-center gap-1">
            <span className="text-slate-400">
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
