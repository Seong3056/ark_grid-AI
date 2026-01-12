import {
  ArmoryEquipment,
  ArmoryProfile,
  ArkPassive,
  ArkPassiveEffect,
  ArkPassivePoint,
  Engraving,
  EngravingEffect,
  ArmoryGem,
  Gem
} from './types/lostark';
import { CharStats, StatSource } from './types';

// 실 효율 계산용 제외 목록 (단독 이득 및 UI 상세 합산에서 제외)
const EXCLUDE_FROM_INTRINSIC = [
  "달인", "아드레날린", "선각자", "진군",
  "입식 타격가", "마나용광로", "안정된 관리자"
];

interface RawArmoryData {
  ArmoryProfile: ArmoryProfile;
  ArmoryEquipment: ArmoryEquipment[];
  ArkPassive: ArkPassive | null;
  ArmoryEngraving: Engraving | null;
  ArmoryGem: ArmoryGem | null;
}

interface ParsedCharacterData {
  charStats: CharStats;
  equipment: ArmoryEquipment[];
  arkPassive: ArkPassive | null;
  adrenalineBuff: StatSource | null;
}

export function parseCharacterData(data: RawArmoryData): ParsedCharacterData {
  const {
    ArmoryProfile: profile,
    ArmoryEquipment: equipmentData,
    ArkPassive: arkPassiveData,
    ArmoryEngraving: engravingData,
    ArmoryGem: gemData,
  } = data;

  if (!profile) {
    throw new Error("ArmoryProfile is missing in the API response.");
  }

  const arkPassivePoints: ArkPassivePoint[] = arkPassiveData?.Points || [];
  const engravings = engravingData?.Engravings || [];
  const arkPassiveEngravings = engravingData?.ArkPassiveEffects || [];

  let adrenalineBuff: StatSource | null = null;

  const breakdown = {
    attackPower: [] as StatSource[],
    weaponAtkPower: [] as StatSource[],
    baseAtkPower: [] as StatSource[],
    additionalDamage: [] as StatSource[],
    critDamage: [{ name: '기본', value: 200 }] as StatSource[],
    branding: [] as StatSource[],
    atkBuff: [] as StatSource[],
    dmgBuff: [] as StatSource[],
    flatDex: [] as StatSource[],
    flatWeaponAtk: [] as StatSource[],
  };

  // 1. 장비 툴팁 파싱
  (equipmentData || []).forEach((item: ArmoryEquipment) => {
    if (!item.Tooltip) return;
    const name = item.Name;
    const tooltip = item.Tooltip;

    const lines = tooltip.split(/<BR>|\n/i);
    lines.forEach((line: string) => {
      const cleanLine = line.replace(/<[^>]*>/g, '');
      
      
      if (cleanLine.includes("공격력") && !cleanLine.includes("무기") && !cleanLine.includes("아군")) {
        if (name.includes("위대한 비상의 돌")) return;
        const matches = cleanLine.matchAll(/\+([0-9.]+)/g);
        for (const match of matches) {
          const val = parseFloat(match[1]);
          if (val < 50) breakdown.attackPower.push({ name: `[${item.Type}] ${name} (효과)`, value: val });
        }
      }
      // 액세서리의 무기 공격력 %는 무기 공격력 %로 간주
      if (item.Type !== '무기' && cleanLine.includes("무기 공격력") && cleanLine.includes("%")) {
        const match = cleanLine.match(/\+([0-9.]+)%/);
        if (match) {
          const val = parseFloat(match[1]);
          breakdown.weaponAtkPower.push({ name: `${name} (효과)`, value: val });
        }
      }

      // 무기 자체의 추가 피해
      if (item.Type === '무기' && cleanLine.includes("추가 피해")) {
        const match = cleanLine.match(/추가 피해\s*\+([0-9.]+)%/);
        if (match) {
          const val = parseFloat(match[1]);
          breakdown.additionalDamage.push({ name: `${name} (기본 효과)`, value: val });
        }
      }
      const dexMatch = cleanLine.match(/민첩 \+(\d+)/);
      if (dexMatch) breakdown.flatDex.push({ name: item.Name, value: parseInt(dexMatch[1], 10) });

      const weaponAtkMatch = cleanLine.match(/무기 공격력 \+(\d+)/);
      if (weaponAtkMatch) breakdown.flatWeaponAtk.push({ name: item.Name, value: parseInt(weaponAtkMatch[1], 10) });
    });

    const critDmgRegex = /치명타 피해(?:가)?\s*(?:<[^>]+>)*\+?([0-9.]+)%/gi;
    const critDmgMatches = Array.from(tooltip.matchAll(critDmgRegex));
    critDmgMatches.forEach(m => breakdown.critDamage.push({ name, value: parseFloat(m[1]) }));

    const brandingRegex = /낙인력\s*(?:<[^>]+>)*\+([0-9.]+)/gi;
    const brandingMatches = Array.from(tooltip.matchAll(brandingRegex));
    brandingMatches.forEach(m => breakdown.branding.push({ name, value: parseFloat(m[1]) }));

    const atkBuffRegex = /아군 공격(?:력)? 강화(?:\s*효과(?:가)?)?\s*(?:<[^>]+>)*\+?([0-9.]+)/gi;
    const atkBuffMatches = Array.from(tooltip.matchAll(atkBuffRegex));
    atkBuffMatches.forEach(m => {
      breakdown.atkBuff.push({ name: `${name} (효과)`, value: parseFloat(m[1]) });
    });

    const dmgBuffRegex = /아군 피해(?:량)? 강화(?:\s*효과(?:가)?)?\s*(?:<[^>]+>)*\+?([0-9.]+)/gi;
    const dmgBuffMatches = Array.from(tooltip.matchAll(dmgBuffRegex));
    dmgBuffMatches.forEach(m => {
      breakdown.dmgBuff.push({ name: `${name} (효과)`, value: parseFloat(m[1]) });
    });
  });

  // 2. 아크 패시브 진화 랭크 (기본 낙인력)
  if (arkPassivePoints.length > 0) {
    const evoPoint = arkPassivePoints[0];
    if (evoPoint.Name === "진화" || evoPoint.Description.includes("랭크")) {
      const rankMatch = evoPoint.Description.match(/(\d+)랭크/);
      if (rankMatch) {
        const rankVal = parseInt(rankMatch[1], 10);
        breakdown.branding.push({ name: "아크 패시브: 진화 랭크", value: rankVal });
      }      
    }
    const EnlightenmentPoint = arkPassivePoints[1];
    if (EnlightenmentPoint.Name === "깨달음" || EnlightenmentPoint.Description.includes("레벨")) {
      const rankMatch = EnlightenmentPoint.Description.match(/(\d+)레벨/);
      if (rankMatch) {
        const rankVal = parseInt(rankMatch[1], 10) * 0.1;
        breakdown.weaponAtkPower.push({ name: "아크 패시브: 깨달음 랭크", value: rankVal });
      }
      
    }

  }

  // 3. 아크 패시브 노드 효과 파싱
  (arkPassiveData?.Effects || []).forEach((e: ArkPassiveEffect) => {
    const rawDesc = e.Description || "";
    const rawName = e.Name || "";
    const desc = rawDesc.replace(/<[^>]*>/g, ""); // HTML 태그 제거
    const name = rawName.replace(/<[^>]*>/g, "");

    if (name.includes("달인") || desc.includes("달인")) {
      const valMatch = desc.match(/([0-9.]+)\s*%/);
      const val = valMatch ? parseFloat(valMatch[1]) : 8.5;
      breakdown.additionalDamage.push({ name: "아크 패시브: 달인", value: val });
      return;
    }

    if (desc.includes("기원") || name.includes("기원")) {
      breakdown.atkBuff.push({ name: "아크 패시브: 기원", value: 22 });
      return;
    }
    if (desc.includes("선각자") || name.includes("선각자")) {
      breakdown.atkBuff.push({ name: "아크 패시브: 선각자", value: 22 });
      return;
    }
    if (desc.includes("진군") || name.includes("진군")) {
      breakdown.dmgBuff.push({ name: "아크 패시브: 진군", value: 24 });
      return;
    }

    const brandingNodes = ["입식 타격가", "마나용광로", "안정된 관리자"];
    for (const nodeName of brandingNodes) {
      if (desc.includes(nodeName) || name.includes(nodeName)) {
        const lvMatch = desc.match(/Lv\.(\d+)/i);
        if (lvMatch) {
          const level = parseInt(lvMatch[1], 10);
          breakdown.branding.push({ name: `아크 패시브: ${nodeName}`, value: level * 10 });
        }
        return;
      }
    }

    const valueMatch = desc.match(/([0-9.]+)\s*%/);
    const value = valueMatch ? parseFloat(valueMatch[1]) : 0;

    if (value > 0) {
      if (name.includes("공격력") && !name.includes("무기") && !name.includes("아군")) {
        breakdown.attackPower.push({ name: `아크 패시브: ${name}`, value });
      } else if (name.includes("추가 피해")) {
        breakdown.additionalDamage.push({ name: `아크 패시브: ${name}`, value });
      } else if (name.includes("치명타 피해")) {
        breakdown.critDamage.push({ name: `아크 패시브: ${name}`, value });
      } else if (name.includes("낙인력")) {
        breakdown.branding.push({ name: `아크 패시브: ${name}`, value });
      } else if (name.includes("아군 공격")) {
        breakdown.atkBuff.push({ name: `아크 패시브: ${name}`, value });
      } else if (name.includes("아군 피해")) {
        breakdown.dmgBuff.push({ name: `아크 패시브: ${name}`, value });
      }
    }
  });

  // 4. 각인 효과
  const allEngravings = [...(engravings || []), ...(arkPassiveEngravings || [])];
  allEngravings.forEach((e: EngravingEffect) => {
    const name = e.Name || "";
    const desc = e.Description || "";

    if (name.includes("아드레날린")) {
      const match = desc.match(/공격력이\s*(?:<[^>]+>)*([0-9.]+)/i);
      if (match) {
        const stackVal = parseFloat(match[1]);
        const finalVal = stackVal * 6; // Always multiply by 6 for max stacks
        if (finalVal > 0 && !adrenalineBuff) {
          adrenalineBuff = { name: `${name} (6중첩)`, value: finalVal };
        }
      }
    }

    if (name.includes("예리한 둔기")) {
      const match = desc.match(/치명타 피해량이\s*(?:<[^>]+>)*([0-9.]+)%/i);
      if (match) {
        breakdown.critDamage.push({ name: `각인: ${name}`, value: parseFloat(match[1]) });
      }
    }
  });

  // 5. 보석 효과
  (gemData?.Gems || []).forEach((gem: Gem) => {
    if (!gem.Tooltip) return;
    try {
        const tooltip = JSON.parse(gem.Tooltip);
        for (const key in tooltip) {
            const el = tooltip[key];
            if (el && el.type === 'ItemPartBox' && el.value?.Element_000?.includes('효과')) {
                const content = el.value.Element_001 || '';
                const match = content.match(/기본 공격력 ([\d.]+)% 증가/);
                if (match) {
                    breakdown.baseAtkPower.push({ name: gem.Name.replace(/<[^>]*>/g, '') + ' (기본 공격력)', value: parseFloat(match[1]) });
                }
            }
        }
    } catch(e) {
        console.error("Failed to parse gem tooltip", e);
    }
  });


  const finalBreakdown = { ...breakdown };
  if (adrenalineBuff) {
    finalBreakdown.attackPower = [...finalBreakdown.attackPower, adrenalineBuff];
  }

  const sum = (list: StatSource[]) => list.reduce((a, b) => a + b.value, 0);

  const sumAccessoriesOnly = (list: StatSource[]) => list.filter(s => {
    const n = s.name;
    return n.startsWith('[목걸이]') || n.startsWith('[귀걸이]') || n.startsWith('[반지]');
  }).reduce((a, b) => a + b.value, 0);

  const sumExcludingCombat = (list: StatSource[]) => list.filter(s => {
    const n = s.name;
    return !EXCLUDE_FROM_INTRINSIC.some(ex => n.includes(ex));
  }).reduce((a, b) => a + b.value, 0);

  const charStats: CharStats = {
    combatPower: (profile?.CombatPower || 0).toLocaleString(),
    attackPower: sumAccessoriesOnly(finalBreakdown.attackPower).toFixed(2) + "%",
    weaponAtkPower: sum(finalBreakdown.weaponAtkPower).toFixed(2) + "%",
    additionalDamage: sumExcludingCombat(finalBreakdown.additionalDamage).toFixed(2) + "%",
    critRate: '0.00%', // Dummy value, can be calculated if needed
    branding: sum(finalBreakdown.branding).toFixed(2) + "%",
    atkBuff: sum(finalBreakdown.atkBuff).toFixed(2) + "%",
    dmgBuff: sum(finalBreakdown.dmgBuff).toFixed(2) + "%",
    breakdown: finalBreakdown
  };

  return {
    charStats,
    equipment: equipmentData || [],
    arkPassive: arkPassiveData || null,
    adrenalineBuff,
  };
}
