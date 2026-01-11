import React, { useState } from 'react';
import { ArkGridGem, CoreType, CoreGrade } from '../types';
import { CORE_TYPES, GRADE_OPTIONS } from '../constants';
import ArkGemCard from './GemCard';
import { Sun, Moon, Star } from 'lucide-react';

interface ManualPlacementViewProps {
  gems: ArkGridGem[];
  coreConfigs: Record<CoreType, CoreGrade>;
}

const ManualPlacementView: React.FC<ManualPlacementViewProps> = ({
  gems,
  coreConfigs
}) => {
  const [placements, setPlacements] = useState<Record<string, ArkGridGem | null>>({});

  const usedGemIds = new Set(Object.values(placements).filter(gem => gem !== null).map(gem => gem!.id));
  const availableGems = gems.filter(gem => !usedGemIds.has(gem.id));

  const getCoreIcon = (type: string) => {
    if (type.includes('해')) return <Sun className="w-5 h-5 text-orange-400" />;
    if (type.includes('달')) return <Moon className="w-5 h-5 text-indigo-400" />;
    return <Star className="w-5 h-5 text-yellow-300" />;
  };

  const handleDrop = (e: React.DragEvent, coreType: CoreType, slotIndex: number) => {
    e.preventDefault();
    const gemId = e.dataTransfer.getData('gemId');
    const gem = gems.find(g => g.id === gemId);
    if (gem) {
      const coreCategory = coreType.startsWith('질서') ? '질서' : '혼돈';
      if (gem.category !== coreCategory) {
        alert(`${coreType}에는 ${coreCategory} 젬만 배치할 수 있습니다.`);
        return;
      }
      const slotKey = `${coreType}-${slotIndex}`;
      setPlacements(prev => ({ ...prev, [slotKey]: gem }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (gem: ArkGridGem) => (e: React.DragEvent) => {
    e.dataTransfer.setData('gemId', gem.id);
  };

  const removeGem = (slotKey: string) => {
    setPlacements(prev => ({ ...prev, [slotKey]: null }));
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl">
        <h2 className="text-2xl font-black text-white mb-6">수동 배치</h2>
        <p className="text-slate-400 mb-8">젬을 드래그해서 코어 슬롯에 배치하세요.</p>

        <div className="overflow-x-auto">
          <div className="flex gap-6 min-w-max">
            {CORE_TYPES.map(coreType => {
              const grade = coreConfigs[coreType];
              const activeGradeLimits = GRADE_OPTIONS.find(o => o.value === grade);
              const slots = Array.from({ length: 4 }, (_, i) => i);

              return (
                <div key={coreType} className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50 min-w-[150px]">
                  <div className="flex items-center gap-2 mb-4">
                    {getCoreIcon(coreType)}
                    <span className="text-lg font-black text-white">{coreType}</span>
                    <span className="text-sm text-slate-500">({grade})</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {slots.map(slotIndex => {
                      const slotKey = `${coreType}-${slotIndex}`;
                      const placedGem = placements[slotKey];

                      return (
                        <div
                          key={slotIndex}
                          className="w-32 h-20 bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center relative"
                          onDrop={(e) => handleDrop(e, coreType, slotIndex)}
                          onDragOver={handleDragOver}
                        >
                          {placedGem ? (
                            <div className="relative">
                              <ArkGemCard gem={placedGem} usedInCore={coreType} />
                              <button
                                onClick={() => removeGem(slotKey)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-black"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-sm">{slotIndex + 1}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl">
        <h3 className="text-xl font-black text-white mb-6">사용 가능한 젬</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {availableGems.map(gem => (
            <div
              key={gem.id}
              draggable
              onDragStart={handleDragStart(gem)}
              className="cursor-move w-full h-20"
            >
              <ArkGemCard gem={gem} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default ManualPlacementView;