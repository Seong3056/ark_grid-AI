import React from 'react';
import { UnifiedEquipment } from '../services/characterParser';
import { Info } from 'lucide-react';

interface UnifiedEquipmentListProps {
  data: UnifiedEquipment[];
}

const UnifiedEquipmentList: React.FC<UnifiedEquipmentListProps> = ({ data }) => {
  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-full text-slate-500 text-xs">
      데이터 없음
    </div>
  );

  const totals = data.reduce((acc, curr) => ({
    stat: acc.stat + curr.stat,
    weapon_atk: acc.weapon_atk + curr.weapon_atk,
    atk: acc.atk + curr.atk,
    damage: acc.damage + curr.damage,
    additional_damage: acc.additional_damage + curr.additional_damage,
    additional_damage_real: acc.additional_damage_real + curr.additional_damage_real,
    atk_percent: acc.atk_percent + curr.atk_percent,
    atk_percent_real: acc.atk_percent_real + curr.atk_percent_real,
    base_atk_percent: acc.base_atk_percent + curr.base_atk_percent,
    weapon_atk_percent: acc.weapon_atk_percent + curr.weapon_atk_percent,
    critical_percent: acc.critical_percent + curr.critical_percent,
    critical_damage: acc.critical_damage + curr.critical_damage,
    critical_hit_damage: acc.critical_hit_damage + curr.critical_hit_damage,
    cooldown: acc.cooldown + curr.cooldown,
    evolution_damage: acc.evolution_damage + curr.evolution_damage,
  }), {
    stat: 0, weapon_atk: 0, atk: 0, damage: 0, additional_damage: 0, additional_damage_real: 0,
    atk_percent: 0, atk_percent_real: 0, base_atk_percent: 0, weapon_atk_percent: 0,
    critical_percent: 0, critical_damage: 0, critical_hit_damage: 0, cooldown: 0, evolution_damage: 0
  });

  return (
    <div className="w-full h-full flex flex-col gap-2 overflow-hidden">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800/50 shrink-0 relative group cursor-help">
        <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-300">통합 장비 효과</span>
            <Info className="w-3 h-3 text-slate-500" />
        </div>
        <div className="flex gap-2 text-[10px]">
          <span className="text-indigo-400 font-bold">피해 {totals.damage.toFixed(1)}%</span>
          <span className="text-emerald-400 font-bold">쿨감 {totals.cooldown.toFixed(1)}%</span>
        </div>

        {/* Tooltip */}
        <div className="absolute left-0 top-8 z-50 w-80 p-4 bg-slate-950/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none flex flex-col gap-3 translate-y-2 group-hover:translate-y-0">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white">상세 합계 스탯</span>
                <span className="text-[10px] text-slate-500">모든 장비/효과 포함</span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
              {/* 기본 스탯 */}
              {totals.stat > 0 && <div className="flex justify-between items-center"><span className="text-slate-400">주스탯</span><span className="font-medium text-slate-200">+{totals.stat.toLocaleString()}</span></div>}
              {totals.weapon_atk > 0 && <div className="flex justify-between items-center"><span className="text-slate-400">무기 공격력</span><span className="font-medium text-slate-200">+{totals.weapon_atk.toLocaleString()}</span></div>}
              {totals.atk > 0 && <div className="flex justify-between items-center"><span className="text-slate-400">공격력</span><span className="font-medium text-slate-200">+{totals.atk.toLocaleString()}</span></div>}
              
              {/* 퍼센트 스탯 */}
              {totals.atk_percent > 0 && <div className="flex justify-between items-center"><span className="text-slate-400">공격력 %</span><span className="font-medium text-indigo-300">{totals.atk_percent.toFixed(2)}%</span></div>}
              {totals.atk_percent_real > 0 && <div className="flex justify-between items-center"><span className="text-slate-400">공격력 %(실)</span><span className="font-medium text-indigo-300">{totals.atk_percent_real.toFixed(2)}%</span></div>}
              {totals.base_atk_percent > 0 && <div className="flex justify-between items-center"><span className="text-slate-400">기본 공격력 %</span><span className="font-medium text-indigo-300">{totals.base_atk_percent.toFixed(2)}%</span></div>}
              {totals.weapon_atk_percent > 0 && <div className="flex justify-between items-center"><span className="text-slate-400">무기 공격력 %</span><span className="font-medium text-indigo-300">{totals.weapon_atk_percent.toFixed(2)}%</span></div>}

              {/* 데미지 관련 */}
              {totals.damage > 0 && <div className="flex justify-between items-center col-span-2 bg-indigo-950/30 -mx-2 px-2 py-0.5 rounded"><span className="text-indigo-400 font-medium">적에게 주는 피해</span><span className="font-bold text-indigo-300">{totals.damage.toFixed(2)}%</span></div>}
              
              {totals.additional_damage > 0 && <div className="flex justify-between items-center"><span className="text-slate-400">추가 피해</span><span className="font-medium text-slate-200">{totals.additional_damage.toFixed(2)}%</span></div>}
              {totals.additional_damage_real > 0 && <div className="flex justify-between items-center"><span className="text-slate-400">추가 피해(실)</span><span className="font-medium text-slate-200">{totals.additional_damage_real.toFixed(2)}%</span></div>}
              {totals.evolution_damage > 0 && <div className="flex justify-between items-center"><span className="text-orange-400">진화형 피해</span><span className="font-medium text-orange-300">{totals.evolution_damage.toFixed(2)}%</span></div>}

              {/* 치명타 관련 */}
              {totals.critical_percent > 0 && <div className="flex justify-between items-center"><span className="text-yellow-500">치명타 적중률</span><span className="font-medium text-yellow-400">{totals.critical_percent.toFixed(2)}%</span></div>}
              {totals.critical_damage > 0 && <div className="flex justify-between items-center"><span className="text-yellow-500">치명타 피해</span><span className="font-medium text-yellow-400">{totals.critical_damage.toFixed(2)}%</span></div>}
              {totals.critical_hit_damage > 0 && <div className="flex justify-between items-center"><span className="text-yellow-500">치명타 적중 피해</span><span className="font-medium text-yellow-400">{totals.critical_hit_damage.toFixed(2)}%</span></div>}
              
              {/* 유틸리티 */}
              {totals.cooldown > 0 && <div className="flex justify-between items-center col-span-2 border-t border-slate-800 pt-1 mt-1"><span className="text-emerald-400">재사용 대기시간 감소</span><span className="font-bold text-emerald-300">{totals.cooldown.toFixed(2)}%</span></div>}
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar space-y-1">
        {data.map((item, i) => (
          <div key={i} className="flex justify-between items-center text-[10px] p-1.5 bg-slate-900/30 rounded hover:bg-slate-800/50 transition-colors">
            <span className="text-slate-400 truncate w-24" title={item.name}>{item.name}</span>
            <div className="flex gap-1.5 text-right shrink-0">
               {item.damage > 0 && <span className="text-indigo-300/80">피해 {item.damage}%</span>}
               {item.cooldown > 0 && <span className="text-emerald-300/80">쿨 {item.cooldown}%</span>}
               {item.evolution_damage > 0 && <span className="text-orange-300/80">진화 {item.evolution_damage}%</span>}
               {item.atk_percent > 0 && <span className="text-slate-300/80">공 {item.atk_percent}%</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UnifiedEquipmentList;