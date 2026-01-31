import React, { useState } from 'react';
import { UnifiedEquipment, StatSource } from '../types';
import { log } from 'node:console';

interface UnifiedEquipmentListProps {
  data: UnifiedEquipment[];
}

interface TooltipData {
  label: string;
  value: string | number;
  sources: StatSource[];
  colorClass?: string;
  suffix?: string;
}

const StatItem = ({ 
  label, value, sources, colorClass = "text-slate-200", suffix = "",
  onMouseEnter, onMouseLeave, onMouseMove
}: { 
  label: string, value: string | number, sources: StatSource[], colorClass?: string, suffix?: string,
  onMouseEnter: (data: TooltipData) => void,
  onMouseLeave: () => void,
  onMouseMove: (e: React.MouseEvent) => void
}) => {
  return (
    <div 
      className="flex justify-between items-center group cursor-help hover:bg-slate-800/30 rounded px-1 -mx-1 transition-colors"
      onMouseEnter={() => onMouseEnter({ label, value, sources, colorClass, suffix })}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
    >
      <span className="text-slate-400">{label}</span>
      <span className={`font-medium ${colorClass}`}>{typeof value === 'number' ? value.toLocaleString() : value}</span>
    </div>
  );
}

const UnifiedEquipmentList: React.FC<UnifiedEquipmentListProps> = ({ data }) => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (data: TooltipData) => {
    const sortedSources = [...data.sources].sort((a, b) => {
      if (a.name === '기본 특성') return -1;
      if (b.name === '기본 특성') return 1;
      return 0;
    });
    setTooltip({ ...data, sources: sortedSources });
  };
  const handleMouseLeave = () => setTooltip(null);
  const handleMouseMove = (e: React.MouseEvent) => {
    const xOffset = window.innerWidth - e.clientX < 280 ? -270 : 20;
    const yOffset = window.innerHeight - e.clientY < 200 ? -200 : 20;
    setMousePos({ x: e.clientX + xOffset, y: e.clientY + yOffset });
  };

  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-full text-slate-500 text-xs">
      데이터 없음
    </div>
  );

  const initialTotals = {
    stat: 0, crit: 0, specialization: 0, swiftness: 0, domination: 0, endurance: 0, expertise: 0,
    weapon_atk: 0, atk: 0, damage: 0, engraving_damage: 0, additional_damage: 0, additional_damage_real: 0,
    atk_percent: 0, atk_percent_real: 0, base_atk_percent: 0, weapon_atk_percent: 0,
    critical_percent: 0, critical_damage: 0, critical_hit_damage: 0,
    cooldown: 0, evolution_damage: 0, attack_speed: 0, move_speed: 0
  };

  const { totals, breakdown } = data.reduce((acc, curr) => {
    const keys = Object.keys(initialTotals) as (keyof typeof initialTotals)[];
    
    keys.forEach(key => {
        const val = curr[key];
        if (val && val !== 0) {
            if (key === 'damage' && curr.type === '보석') return;
            if (key === 'cooldown' && curr.type === '보석') return;

            if (key === 'engraving_damage' || key === 'damage' || key === 'critical_hit_damage') {
                acc.totals[key] = ((1 + acc.totals[key] / 100) * (1 + val / 100) - 1) * 100;
            } else {
                acc.totals[key] += val;
            }
            
            if (!acc.breakdown[key]) acc.breakdown[key] = [];
            acc.breakdown[key].push({ name: curr.name, value: val });
        }
    });
    return acc;
  }, {
    totals: { ...initialTotals },
    breakdown: {} as Record<string, StatSource[]>
  });
  
  let power = 
  Math.floor(Math.sqrt(totals.stat * (totals.weapon_atk * (1 + totals.weapon_atk_percent / 100)) / 6)

  * (1 + totals.base_atk_percent / 100) * 0.0288)
  * (1 + (totals.atk_percent + totals.atk_percent_real) / 100)

  * (1 + (totals.additional_damage + totals.additional_damage_real) / 100)
  * (1 + totals.damage / 100)
  * (1 + totals.engraving_damage / 100)
  * (1 + totals.evolution_damage / 100)
  ;

  const critical_damage_multiplier = power * (totals.critical_damage / 100) * (1 + (totals.critical_hit_damage / 100))  ;
  // console.log((totals.critical_damage / 100), (1 + (totals.critical_hit_damage / 100)));
  power = power * (1 - totals.critical_percent / 100) + (critical_damage_multiplier * (totals.critical_percent / 100));
  

  return (
    <div className="w-full h-full flex flex-col gap-3 overflow-y-auto overflow-x-hidden custom-scrollbar pr-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
            <span className="text-xs font-bold text-white">통합 장비 효과</span>
            <span className="text-[10px] text-slate-500">상세 합계 스탯</span>
        </div>
        
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
          {/* 전투 특성 */}
          {(totals.crit > 0 || totals.specialization > 0 || totals.swiftness > 0 || totals.domination > 0 || totals.endurance > 0 || totals.expertise > 0) && (
             <div className="col-span-2 grid grid-cols-3 gap-2 mb-2 pb-2 border-b border-slate-800/50">
                {totals.crit > 0 && <StatItem label="치명" value={totals.crit} sources={breakdown.crit || []} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
                {totals.specialization > 0 && <StatItem label="특화" value={totals.specialization} sources={breakdown.specialization || []} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
                {totals.swiftness > 0 && <StatItem label="신속" value={totals.swiftness} sources={breakdown.swiftness || []} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
                {totals.domination > 0 && <StatItem label="제압" value={totals.domination} sources={breakdown.domination || []} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
                {totals.endurance > 0 && <StatItem label="인내" value={totals.endurance} sources={breakdown.endurance || []} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
                {totals.expertise > 0 && <StatItem label="숙련" value={totals.expertise} sources={breakdown.expertise || []} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
             </div>
          )}
          {/* 기본 스탯 */}
          {totals.stat > 0 && <StatItem label="주스탯" value={`+${totals.stat.toLocaleString()}`} sources={breakdown.stat || []} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
          {totals.weapon_atk > 0 && <StatItem label="무기 공격력" value={`+${totals.weapon_atk.toLocaleString()}`} sources={breakdown.weapon_atk || []} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
          {totals.atk > 0 && <StatItem label="공격력" value={`+${totals.atk.toLocaleString()}`} sources={breakdown.atk || []} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
          
          {/* 퍼센트 스탯 */}
          {totals.atk_percent > 0 && <StatItem label="공격력 %" value={`${totals.atk_percent.toFixed(2)}%`} sources={breakdown.atk_percent || []} colorClass="text-indigo-300" suffix="%" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
          {totals.atk_percent_real > 0 && <StatItem label="공격력 %(실)" value={`${totals.atk_percent_real.toFixed(2)}%`} sources={breakdown.atk_percent_real || []} colorClass="text-indigo-300" suffix="%" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
          {totals.base_atk_percent > 0 && <StatItem label="기본 공격력 %" value={`${totals.base_atk_percent.toFixed(2)}%`} sources={breakdown.base_atk_percent || []} colorClass="text-indigo-300" suffix="%" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
          {totals.weapon_atk_percent > 0 && <StatItem label="무기 공격력 %" value={`${totals.weapon_atk_percent.toFixed(2)}%`} sources={breakdown.weapon_atk_percent || []} colorClass="text-indigo-300" suffix="%" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}

          {/* 데미지 관련 */}
          {totals.damage > 0 && (
            <div className="col-span-2 bg-indigo-950/30 -mx-2 px-2 py-1 rounded">
                <StatItem label="적에게 주는 피해" value={`${totals.damage.toFixed(2)}%`} sources={breakdown.damage || []} colorClass="text-indigo-300 font-bold" suffix="%" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />
            </div>
          )}
          {totals.engraving_damage > 0 && <StatItem label="각인 피해" value={`${totals.engraving_damage.toFixed(2)}%`} sources={breakdown.engraving_damage || []} colorClass="text-indigo-300" suffix="%" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
          
          {totals.additional_damage > 0 && <StatItem label="추가 피해" value={`${totals.additional_damage.toFixed(2)}%`} sources={breakdown.additional_damage || []} suffix="%" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
          {totals.additional_damage_real > 0 && <StatItem label="추가 피해(실)" value={`${totals.additional_damage_real.toFixed(2)}%`} sources={breakdown.additional_damage_real || []} suffix="%" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
          {totals.evolution_damage > 0 && <StatItem label="진화형 피해" value={`${totals.evolution_damage.toFixed(2)}%`} sources={breakdown.evolution_damage || []} colorClass="text-orange-300" suffix="%" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}

          {/* 치명타 관련 */}
          {totals.critical_percent > 0 && <StatItem label="치명타 적중률" value={`${totals.critical_percent.toFixed(2)}%`} sources={breakdown.critical_percent || []} colorClass="text-yellow-400" suffix="%" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
          {totals.critical_damage > 0 && <StatItem label="치명타 피해" value={`${totals.critical_damage.toFixed(2)}%`} sources={breakdown.critical_damage || []} colorClass="text-yellow-400" suffix="%" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
          {totals.critical_hit_damage > 0 && <StatItem label="치명타 적중 피해" value={`${totals.critical_hit_damage.toFixed(2)}%`} sources={breakdown.critical_hit_damage || []} colorClass="text-yellow-400" suffix="%" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
          
          {/* 유틸리티 */}
          {(totals.cooldown > 0 || totals.attack_speed > 0 || totals.move_speed > 0) && (
            <div className="col-span-2 border-t border-slate-800 pt-2 mt-1 grid grid-cols-2 gap-2">
              {totals.cooldown > 0 && <div className="col-span-2">
                <StatItem label="재사용 대기시간 감소" value={`${totals.cooldown.toFixed(2)}%`} sources={breakdown.cooldown || []} colorClass="text-emerald-300 font-bold" suffix="%" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />
              </div>}
              {totals.attack_speed > 0 && <StatItem label="공격 속도" value={`${totals.attack_speed.toFixed(2)}%`} sources={breakdown.attack_speed || []} colorClass="text-sky-300 font-bold" suffix="%" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
              {totals.move_speed > 0 && <StatItem label="이동 속도" value={`${totals.move_speed.toFixed(2)}%`} sources={breakdown.move_speed || []} colorClass="text-sky-300 font-bold" suffix="%" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onMouseMove={handleMouseMove} />}
            </div>
          )}

          {/* 점수 */}
          {(totals.stat > 0 && totals.weapon_atk > 0) && (
             <div className="col-span-2 border-t border-slate-800 pt-2 mt-1">
                <div className="flex justify-between items-center px-1 -mx-1 group cursor-help hover:bg-slate-800/30 rounded transition-colors" title="sqrt(주스탯 * (무기 공격력 * (1 + 무기 공격력% / 100)) / 6) * (1 + 기본 공격력% / 100) * 0.0288">
                    <span className="text-slate-400 font-bold">점수</span>
                    <span className="font-black text-indigo-300">{power.toLocaleString()}</span>
                </div>
             </div>
          )}
        </div>

        {/* Fixed Tooltip */}
        {tooltip && (
          <div 
            className="fixed z-[9999] w-64 bg-slate-950/95 backdrop-blur-md border border-slate-700/50 rounded-xl p-3 shadow-2xl pointer-events-none"
            style={{ top: mousePos.y, left: mousePos.x }}
          >
            <div className="text-[10px] font-bold text-slate-500 border-b border-slate-800 pb-1 mb-2 flex justify-between items-center">
                <span>{tooltip.label} 출처</span>
                <span className={`${tooltip.colorClass} opacity-80`}>합계: {typeof tooltip.value === 'number' ? tooltip.value.toLocaleString() : tooltip.value}</span>
            </div>
            <div className="space-y-1">
                {tooltip.sources && tooltip.sources.length > 0 ? tooltip.sources.map((s, i) => (
                    <div key={i} className="flex justify-between text-[10px] items-start gap-2">
                        <span className="text-slate-400 text-left break-words leading-tight">{s.name}</span>
                        <span className={`${tooltip.colorClass} shrink-0`}>+{s.value.toLocaleString()}{tooltip.suffix}</span>
                    </div>
                )) : <div className="text-center text-slate-600 text-[10px]">출처 없음</div>}
            </div>
          </div>
        )}
    </div>
  );
};

export default UnifiedEquipmentList;