
import React from 'react';
import { ArmoryEquipment } from '../types/lostark';

interface EquipmentProps {
  equipment: ArmoryEquipment[] | null;
  onEnhancementChange: (itemType: string, newLevel: number) => void;
}

const Equipment: React.FC<EquipmentProps> = ({ equipment, onEnhancementChange }) => {
  if (!equipment) {
    return <div className="text-center p-8">캐릭터를 검색해주세요.</div>;
  }

  const equipmentMap: Record<string, ArmoryEquipment[]> = {};
  equipment.forEach(item => {
    if (!equipmentMap[item.Type]) {
      equipmentMap[item.Type] = [];
    }
    equipmentMap[item.Type].push(item);
  });

  const armorTypes = ['무기', '투구', '상의', '하의', '장갑', '어깨'];
  const accessoryTypes = ['목걸이', '귀걸이', '반지', '팔찌', '어빌리티 스톤'];
  
  const renderItem = (item: ArmoryEquipment | undefined, isArmor: boolean) => {
    if (!item) {
      return <div className="h-24"></div>;
    }

    const enhancementLevelStr = isArmor && item.Name.startsWith('+') ? item.Name.split(' ')[0] : '';
    const enhancementLevel = parseInt(enhancementLevelStr.replace('+', ''), 10);

    const stats: Record<string, number> = {};
    let honingOptions: string[] = [];
    let braceletOptions: string[] = [];
    let mainStatValue: number | null = null;

    try {
        const tooltipData = JSON.parse(item.Tooltip);
        for (const key in tooltipData) {
            const el = tooltipData[key];
            if (el && el.type === 'ItemPartBox') {
                const title = el.value?.Element_000 || '';
                let content = el.value.Element_001 || '';

                if (title.includes('기본 효과')) {
                    const lines = content.split(/<BR>/i);
                    lines.forEach(line => {
                        const cleanLine = line.replace(/<[^>]*>/g, '');
                        const atkMatch = cleanLine.match(/무기 공격력 \+(\d+)/);
                        const strMatch = cleanLine.match(/힘 \+(\d+)/);
                        const dexMatch = cleanLine.match(/민첩 \+(\d+)/);
                        const intMatch = cleanLine.match(/지능 \+(\d+)/);

                        if (atkMatch) stats['atk'] = parseInt(atkMatch[1], 10);
                        if (strMatch) stats['str'] = parseInt(strMatch[1], 10);
                        if (dexMatch) stats['dex'] = parseInt(dexMatch[1], 10);
                        if (intMatch) stats['int'] = parseInt(intMatch[1], 10);
                        
                        if (!isArmor) {
                            if (line.includes('힘') && !line.includes('COLOR')) mainStatValue = stats.str;
                            else if (line.includes('민첩') && !line.includes('COLOR')) mainStatValue = stats.dex;
                            else if (line.includes('지능') && !line.includes('COLOR')) mainStatValue = stats.int;
                        }
                    });
                } else if (title.includes('연마 효과')) {
                    honingOptions = content
                        .split(/<BR>/i)
                        .map(line => line.replace(/<img[^>]*>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
                        .filter(line => line.length > 0);
                } else if (title.includes('팔찌 효과')) {
                    braceletOptions = content
                        .split(/<BR>/i)
                        .map(line => line.replace(/<img[^>]*>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
                        .filter(line => line.length > 0);
                }
            }
        }
    } catch (e) {
        // console.error("Failed to parse tooltip for item:", item.Name, e);
    }
    
    return (
      <div className="flex flex-row items-start gap-3 p-2 w-full">
        <div className="relative flex-shrink-0">
          <img src={item.Icon} alt={item.Name} className="w-12 h-12 rounded-md" />
          {enhancementLevelStr && (
            <span className="absolute -top-1 -right-1 bg-black bg-opacity-70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {enhancementLevelStr}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1 items-start">
          {isArmor && (
            <select
              className="bg-slate-700 text-white text-xs rounded-md px-1 w-fit"
              value={isNaN(enhancementLevel) ? '' : enhancementLevel}
              onChange={(e) => onEnhancementChange(item.Type, parseInt(e.target.value, 10))}
            >
              {Array.from({ length: 26 }, (_, i) => (
                <option key={i} value={i}>+{i}</option>
              ))}
            </select>
          )}
          <div className="text-[10px] text-slate-400">
              {stats.atk && <span>{`공격력 +${stats.atk}`}</span>}
              {mainStatValue ? (
                <span className="ml-2">{`+${mainStatValue}`}</span>
              ) : (
                <>
                  {stats.str && <span className="ml-2">{`힘 +${stats.str}`}</span>}
                  {stats.dex && <span className="ml-2">{`민첩 +${stats.dex}`}</span>}
                  {stats.int && <span className="ml-2">{`지능 +${stats.int}`}</span>}
                </>
              )}
          </div>
          {honingOptions.length > 0 && (
            <div className="text-[10px] text-cyan-400 flex flex-col items-start">
              {honingOptions.map((opt, i) => <div key={i}>{opt}</div>)}
            </div>
          )}
          {braceletOptions.length > 0 && (
            <div className="text-[10px] text-yellow-400 flex flex-col items-start">
              {braceletOptions.map((opt, i) => <div key={i}>{opt}</div>)}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const renderItems = (types: string[], isArmor: boolean, alignment: 'center' | 'start' = 'center') => (
    <div className={`flex flex-col justify-start items-${alignment} gap-4 p-4 bg-slate-800/50 rounded-xl h-full`}>
      {types.map(type => {
        if (type === '귀걸이' || type === '반지') {
          return (
            <React.Fragment key={type}>
              {renderItem(equipmentMap[type]?.[0], isArmor)}
              {renderItem(equipmentMap[type]?.[1], isArmor)}
            </React.Fragment>
          );
        }
        return <div key={type} className="w-full">{renderItem(equipmentMap[type]?.[0], isArmor)}</div>;
      })}
    </div>
  );

  return (
    <div className="flex flex-row justify-between gap-4">
      {renderItems(armorTypes, true, 'center')}
      {renderItems(accessoryTypes, false, 'start')}
    </div>
  );
};

export default Equipment;
