
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
      case 3: return { style: { color: '#CE4300' }, className: '' }; // Requested Hex
      case 4: return { style: {}, className: 'text-yellow-500' };    // Requested Class
      case 5: return { style: { color: '#B239D3' }, className: '' }; 
      default: return { style: { color: '#94A3B8' }, className: '' };
    }
  };

  const willStyle = getWillStyle(gem.will);
  const categoryColor = gem.category === '질서' ? 'text-red-400' : 'text-blue-400';

  return (
    <div className={`p-3 rounded-2xl border ${isRecommended ? 'border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-900/20' : 'border-slate-800 bg-slate-900/40'} transition-all hover:border-slate-700`}>
      <div className="flex flex-col gap-0.5">
        {/* 카테고리 (질서/혼돈) */}
        {gem.category && (
          <div className={`text-[9px] font-black uppercase tracking-wider mb-0.5 ${categoryColor}`}>
            {gem.category}
          </div>
        )}

        {/* 첫 번째 줄: 의지력 및 옵션1 */}
        <div className="flex items-center text-[12px] font-bold">
          <span 
            className={`inline-block min-w-[55px] font-black ${willStyle.className}`} 
            style={willStyle.style}
          >
            의지력{gem.will}
          </span>
          <span className="mx-2 text-slate-700 font-normal">|</span>
          <span className="text-slate-200 truncate flex-1">
            {gem.option1.effect} <span className="text-emerald-400 ml-1">Lv.{gem.option1.level}</span>
          </span>
        </div>
        
        {/* 두 번째 줄: 포인트 및 옵션2 */}
        <div className="flex items-center text-[12px] font-bold">
          <span className="inline-block min-w-[55px] font-black text-slate-400">
            포인트{gem.point}
          </span>
          <span className="mx-2 text-slate-700 font-normal">|</span>
          <span className="text-slate-200 truncate flex-1">
            {gem.option2.effect} <span className="text-blue-400 ml-1">Lv.{gem.option2.level}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ArkGemCard;
