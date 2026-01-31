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
import evolutionNodes from '../meta/evolution_node.json';
import engravingTable from '../meta/engraving_table.json';

// 실 효율 계산용 제외 목록 (단독 이득 및 UI 상세 합산에서 제외)
const EXCLUDE_FROM_INTRINSIC = [
  "달인", "아드레날린", "선각자", "진군",
  "입식 타격가", "마나용광로", "안정된 관리자"
];

export interface UnifiedEquipment {
  type: string;
  name: string;
  stat: number;
  weapon_atk: number;
  atk: number;
  damage: number;
  additional_damage: number;
  additional_damage_real: number;
  atk_percent: number;
  atk_percent_real: number;
  base_atk_percent: number;
  weapon_atk_percent: number;
  critical_percent: number;
  critical_damage: number;
  critical_hit_damage: number;
  cooldown: number;
  evolution_damage: number;
}

interface RawArmoryData {
  ArmoryProfile: ArmoryProfile;
  ArmoryEquipment: ArmoryEquipment[];
  ArkPassive: ArkPassive | null;
  ArmoryEngraving: Engraving | null;
  ArmoryGem: ArmoryGem | null;
  ArkGrid: any | null;
}

interface ParsedCharacterData {
  charStats: CharStats;
  equipment: ArmoryEquipment[];
  arkPassive: ArkPassive | null;
  adrenalineBuff: StatSource | null;
  unifiedEquipment: UnifiedEquipment[];
}

export function parseCharacterData(data: RawArmoryData): ParsedCharacterData {
  const {
    ArmoryProfile: profile,
    ArmoryEquipment: equipmentData,
    ArkPassive: arkPassiveData,
    ArmoryEngraving: engravingData,
    ArmoryGem: gemData,
    ArkGrid: arkGridData,
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
    critRate: [] as StatSource[],
    damage: [] as StatSource[],
    branding: [] as StatSource[],
    atkBuff: [] as StatSource[],
    dmgBuff: [] as StatSource[],
    flatDex: [] as StatSource[],
    flatWeaponAtk: [] as StatSource[],
  };

  const unifiedEquipment: UnifiedEquipment[] = [];

  const extractStats = (text: string, unifiedItem: UnifiedEquipment) => {
    const cleanText = text.replace(/<[^>]*>/g, ' ');

    const statMatch = cleanText.match(/(?:힘|민첩|지능)\s*\+?(\d+)/);
    if (statMatch) unifiedItem.stat += parseFloat(statMatch[1]);

    const atkRegex = /(무기\s*)?공격력(?:이)?\s*\+?(\d+(?:\.\d+)?)(%?)/g;
    for (const m of cleanText.matchAll(atkRegex)) {
      const prefix = cleanText.substring(Math.max(0, m.index! - 5), m.index!);
      if (prefix.includes("아군")) continue;
      if (prefix.includes("기본")) continue;

      const isWeapon = !!m[1];
      const value = parseFloat(m[2]);
      const isPercent = m[3] === '%';

      if (isWeapon) {
        if (isPercent) unifiedItem.weapon_atk_percent += value;
        else unifiedItem.weapon_atk += value;
      } else {
        if (isPercent) unifiedItem.atk_percent += value;
        else unifiedItem.atk += value;
      }
    }

    const baseAtkMatch = cleanText.match(/기본\s*공격력(?:이)?\s*\+?(\d+(?:\.\d+)?)%/);
    if (baseAtkMatch) unifiedItem.base_atk_percent += parseFloat(baseAtkMatch[1]);

    const damageRegex = /(공격이\s*치명타로\s*적중\s*시\s*)?적에게\s*주는\s*피해(?:가)?\s*\+?(\d+(?:\.\d+)?)%/g;
    for (const m of cleanText.matchAll(damageRegex)) {
      const isCritHit = !!m[1];
      const value = parseFloat(m[2]);
      if (isCritHit) unifiedItem.critical_hit_damage += value;
      else unifiedItem.damage += value;
    }

    const addDmgMatch = cleanText.match(/추가 피해(?:가)?\s*\+?(\d+(?:\.\d+)?)%/);
    if (addDmgMatch) unifiedItem.additional_damage += parseFloat(addDmgMatch[1]);

    const critRateMatch = cleanText.match(/치명타 적중률(?:이)?\s*\+?(\d+(?:\.\d+)?)%/);
    if (critRateMatch) unifiedItem.critical_percent += parseFloat(critRateMatch[1]);

    const critDmgMatch = cleanText.match(/치명타 피해(?:가)?\s*\+?(\d+(?:\.\d+)?)%/);
    if (critDmgMatch) unifiedItem.critical_damage += parseFloat(critDmgMatch[1]);

    const cooldownRegex = /(?:스킬\s*)?재사용 대기시간(?:이)?\s*(?:(감소|증가)\s*\+?(\d+(?:\.\d+)?)%|\+?(\d+(?:\.\d+)?)%\s*(감소|증가))/;
    const cooldownMatch = cleanText.match(cooldownRegex);
    if (cooldownMatch) {
      const type = cooldownMatch[1] || cooldownMatch[4];
      const value = parseFloat(cooldownMatch[2] || cooldownMatch[3]);
      if (type === '증가') {
        unifiedItem.cooldown -= value;
      } else {
        unifiedItem.cooldown += value;
      }
    }

    const evoDmgMatch = cleanText.match(/진화형 피해(?:가)?\s*\+?(\d+(?:\.\d+)?)%/);
    if (evoDmgMatch) unifiedItem.evolution_damage += parseFloat(evoDmgMatch[1]);
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
        const matches = cleanLine.matchAll(/\+(\d*\.\d+|\d+)/g);
        for (const match of matches) {
          const val = parseFloat(match[1]);
          if (val < 50) breakdown.attackPower.push({ name: `[${item.Type}] ${name} (효과)`, value: val });
        }
      }
      
      if (item.Type !== '무기' && cleanLine.includes("무기 공격력") && cleanLine.includes("%")) {
        const match = cleanLine.match(/\+(\d*\.\d+|\d+)%/);
        if (match) {
          const val = parseFloat(match[1]);
          breakdown.weaponAtkPower.push({ name: `${name} (효과)`, value: val });
        }
      }

      if ((item.Type === '무기' || item.Type === '팔찌') && cleanLine.includes("추가 피해")) {
        const match = cleanLine.match(/추가 피해(?:가)?\s*\+(\d*\.\d+|\d+)%/);
        if (match) {
          const val = parseFloat(match[1]);
          breakdown.additionalDamage.push({ name: `${name} (효과)`, value: val });
        }
      }
      const dexMatch = cleanLine.match(/민첩 \+(\d+)/);
      if (dexMatch) breakdown.flatDex.push({ name: item.Name, value: parseInt(dexMatch[1], 10) });

      const weaponAtkMatch = cleanLine.match(/무기 공격력 \+(\d+)/);
      if (weaponAtkMatch) breakdown.flatWeaponAtk.push({ name: item.Name, value: parseInt(weaponAtkMatch[1], 10) });

      if (cleanLine.includes("치명타 적중률")) {
        const match = cleanLine.match(/치명타 적중률이\s*\+?(\d*\.\d+|\d+)%/);
        if (match) {
          breakdown.critRate.push({ name: `${name} (효과)`, value: parseFloat(match[1]) });
        }
      }

      if (cleanLine.includes("적에게 주는 피해")) {
        const match = cleanLine.match(/적에게 주는 피해(?:가)?\s*\+?(\d*\.\d+|\d+)%/);
        if (match) {
          breakdown.damage.push({ name: `${name} (효과)`, value: parseFloat(match[1]) });
        }
      }
    });

    const critDmgRegex = /치명타 피해(?:가)?\s*(?:<[^>]+>)*\+?(\d*\.\d+|\d+)%/gi;
    const critDmgMatches = Array.from(tooltip.matchAll(critDmgRegex));
    critDmgMatches.forEach(m => breakdown.critDamage.push({ name, value: parseFloat(m[1]) }));

    const brandingRegex = /낙인력\s*(?:<[^>]+>)*\+(\d*\.\d+|\d+)/gi;
    const brandingMatches = Array.from(tooltip.matchAll(brandingRegex));
    brandingMatches.forEach(m => breakdown.branding.push({ name, value: parseFloat(m[1]) }));

    const atkBuffRegex = /아군 공격(?:력)? 강화(?:\s*효과(?:가)?)?\s*(?:<[^>]+>)*\+?(\d*\.\d+|\d+)/gi;
    const atkBuffMatches = Array.from(tooltip.matchAll(atkBuffRegex));
    atkBuffMatches.forEach(m => {
      breakdown.atkBuff.push({ name: `${name} (효과)`, value: parseFloat(m[1]) });
    });

    const dmgBuffRegex = /아군 피해(?:량)? 강화(?:\s*효과(?:가)?)?\s*(?:<[^>]+>)*\+?(\d*\.\d+|\d+)/gi;
    const dmgBuffMatches = Array.from(tooltip.matchAll(dmgBuffRegex));
    dmgBuffMatches.forEach(m => {
      breakdown.dmgBuff.push({ name: `${name} (효과)`, value: parseFloat(m[1]) });
    });

    if (item.Type === '팔찌') {
      let effectsString = "";
      try {
        const tooltipObj = JSON.parse(item.Tooltip);
        const findEffects = (obj: any) => {
          for (const key in obj) {
            if (obj[key]?.type === 'ItemPartBox' && obj[key]?.value?.Element_000?.includes('팔찌 효과')) {
              effectsString = obj[key].value.Element_001;
              return;
            }
            if (typeof obj[key] === 'object' && obj[key] !== null) findEffects(obj[key]);
          }
        };
        findEffects(tooltipObj);
      } catch (e) {}

      if (effectsString) {
        const effects = effectsString.split(/<BR>/i);
        effects.forEach((effect, index) => {
          const cleanEffect = effect.replace(/<[^>]*>/g, ' ').trim();
          if (!cleanEffect) return;

          const braceletOptionItem: UnifiedEquipment = {
            type: '팔찌',
            name: `팔찌 옵션 ${index + 1}`,
            stat: 0, weapon_atk: 0, atk: 0, damage: 0, additional_damage: 0, additional_damage_real: 0,
            atk_percent: 0, atk_percent_real: 0, base_atk_percent: 0, weapon_atk_percent: 0,
            critical_percent: 0, critical_damage: 0, critical_hit_damage: 0,
            cooldown: 0, evolution_damage: 0
          };
          
          extractStats(effect, braceletOptionItem);
          
          const hasStats = Object.entries(braceletOptionItem).some(([k, v]) => k !== 'type' && k !== 'name' && typeof v === 'number' && v !== 0);
          if (hasStats) unifiedEquipment.push(braceletOptionItem);
        });
        return;
      }
    }

    const unifiedItem: UnifiedEquipment = {
      type: item.Type,
      name: item.Name,
      stat: 0,
      weapon_atk: 0,
      atk: 0,
      damage: 0,
      additional_damage: 0,
      additional_damage_real: 0,
      atk_percent: 0,
      atk_percent_real: 0,
      base_atk_percent: 0,
      weapon_atk_percent: 0,
      critical_percent: 0,
      critical_damage: 0,
      critical_hit_damage: 0,
      cooldown: 0,
      evolution_damage: 0
    };

    try {
      const tooltipObj = JSON.parse(item.Tooltip);
      const traverse = (obj: any) => { if (typeof obj === 'string') extractStats(obj, unifiedItem); else if (typeof obj === 'object' && obj !== null) for (const key in obj) traverse(obj[key]); };
      traverse(tooltipObj);
    } catch (e) { extractStats(item.Tooltip, unifiedItem); }
    unifiedEquipment.push(unifiedItem);
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
    if (arkPassivePoints.length > 1) {
      const EnlightenmentPoint = arkPassivePoints[1];
      if (EnlightenmentPoint.Name === "깨달음" || EnlightenmentPoint.Description.includes("레벨")) {
        const rankMatch = EnlightenmentPoint.Description.match(/(\d+)레벨/);
        if (rankMatch) {
          const rankVal = parseInt(rankMatch[1], 10) * 0.1;
          breakdown.weaponAtkPower.push({ name: "아크 패시브: 깨달음 랭크", value: rankVal });
        }
      }
    }
  }

  // 3. 아크 패시브 노드 효과 파싱
  (arkPassiveData?.Effects || []).forEach((e: ArkPassiveEffect) => {
    if (e.Name === '도약' || e.Name === '깨달음') return;
    const rawDesc = e.Description || "";
    const rawName = e.Name || "";
    const desc = rawDesc.replace(/<[^>]*>/g, ""); // HTML 태그 제거
    let name = rawName.replace(/<[^>]*>/g, "");
    
    const originalName = name;
    if (name.includes(":")) {
        name = name.split(":")[1].trim();
    }

    const nodeData = evolutionNodes[name as keyof typeof evolutionNodes];
    if (nodeData) {
        const lvMatch = desc.match(/Lv\.(\d+)/i);
        const level = lvMatch ? parseInt(lvMatch[1], 10) : 1;
        
        let sourceName = `아크 패시브: ${originalName}`;
        if (name === '일격') {
            sourceName = `아크 패시브: ${originalName} (달인)`;
        }

        if (nodeData.critical_pct) {
            const critVal = nodeData.critical_pct * level;
            breakdown.critRate.push({ name: sourceName, value: critVal });
        }
        
        const critDmg = nodeData.critical_damage_pct || nodeData.Node_critical_hit_damage_pct;
        if (critDmg) {
            const critDmgVal = critDmg * level;
            breakdown.critDamage.push({ name: sourceName, value: critDmgVal });
        }
    }

    name = originalName;

    if (name.includes("달인") || desc.includes("달인")) {
      const valMatch = desc.match(/(\d*\.\d+|\d+)\s*%/);
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

    const valueMatch = desc.match(/(\d*\.\d+|\d+)\s*%/);
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

  (arkPassiveData?.Effects || []).forEach((e: ArkPassiveEffect) => {
    if (e.Name === '도약' || e.Name === '깨달음') return;
    const unifiedItem: UnifiedEquipment = {
      type: '아크 패시브',
      name: e.Description.replace(/<[^>]*>/g, ''),
      stat: 0,
      weapon_atk: 0,
      atk: 0,
      damage: 0,
      additional_damage: 0,
      additional_damage_real: 0,
      atk_percent: 0,
      atk_percent_real: 0,
      base_atk_percent: 0,
      weapon_atk_percent: 0,
      critical_percent: 0,
      critical_damage: 0,
      critical_hit_damage: 0,
      cooldown: 0,
      evolution_damage: 0
    };

    const extractStats = (text: string) => {
      const cleanText = text.replace(/<[^>]*>/g, ' ');

      const statMatch = cleanText.match(/(?:힘|민첩|지능)\s*\+?(\d+)/);
      if (statMatch) unifiedItem.stat += parseFloat(statMatch[1]);

      const atkRegex = /(무기\s*)?공격력(?:이)?\s*\+?(\d+(?:\.\d+)?)(%?)/g;
      for (const m of cleanText.matchAll(atkRegex)) {
        const prefix = cleanText.substring(Math.max(0, m.index! - 5), m.index!);
        if (prefix.includes("아군")) continue;
        if (prefix.includes("기본")) continue;

        const isWeapon = !!m[1];
        const value = parseFloat(m[2]);
        const isPercent = m[3] === '%';

        if (isWeapon) {
          if (isPercent) unifiedItem.weapon_atk_percent += value;
          else unifiedItem.weapon_atk += value;
        } else {
          if (isPercent) {
            unifiedItem.atk_percent += value;
          }
          else unifiedItem.atk += value;
        }
      }

      const baseAtkMatch = cleanText.match(/기본\s*공격력(?:이)?\s*\+?(\d+(?:\.\d+)?)%/);
      if (baseAtkMatch) unifiedItem.base_atk_percent += parseFloat(baseAtkMatch[1]);

      const damageRegex = /(공격이\s*치명타로\s*적중\s*시\s*)?적에게\s*주는\s*피해(?:가)?\s*\+?(\d+(?:\.\d+)?)%/g;
      for (const m of cleanText.matchAll(damageRegex)) {
        const isCritHit = !!m[1];
        const value = parseFloat(m[2]);
        if (isCritHit) unifiedItem.critical_hit_damage += value;
        else unifiedItem.damage += value;
      }

      const addDmgMatch = cleanText.match(/추가 피해(?:가)?\s*\+?(\d+(?:\.\d+)?)%/);
      if (addDmgMatch) unifiedItem.additional_damage += parseFloat(addDmgMatch[1]);

      const critRateMatch = cleanText.match(/치명타 적중률(?:이)?\s*\+?(\d+(?:\.\d+)?)%/);
      if (critRateMatch) unifiedItem.critical_percent += parseFloat(critRateMatch[1]);

      const critDmgMatch = cleanText.match(/치명타 피해(?:가)?\s*\+?(\d+(?:\.\d+)?)%/);
      if (critDmgMatch) unifiedItem.critical_damage += parseFloat(critDmgMatch[1]);

      const cooldownRegex = /(?:스킬\s*)?재사용 대기시간(?:이)?\s*(?:감소\s*\+?(\d+(?:\.\d+)?)%|\+?(\d+(?:\.\d+)?)%\s*감소)/;
      const cooldownMatch = cleanText.match(cooldownRegex);
      if (cooldownMatch) {
        unifiedItem.cooldown += parseFloat(cooldownMatch[1] || cooldownMatch[2]);
      }

      const evoDmgMatch = cleanText.match(/진화형 피해(?:가)?\s*\+?(\d+(?:\.\d+)?)%/);
      if (evoDmgMatch) unifiedItem.evolution_damage += parseFloat(evoDmgMatch[1]);
    };

    if (e.ToolTip) {
      try {
        const tooltipObj = JSON.parse(e.ToolTip);
        const traverse = (obj: any) => { if (typeof obj === 'string') extractStats(obj); else if (typeof obj === 'object' && obj !== null) for (const key in obj) traverse(obj[key]); };
        traverse(tooltipObj);
      } catch (err) { extractStats(e.ToolTip); }
    }
    
    const rawDesc = e.Description || "";
    const rawName = e.Name || "";
    const desc = rawDesc.replace(/<[^>]*>/g, "");
    let name = rawName.replace(/<[^>]*>/g, "");
    if (name.includes(":")) {
        name = name.split(":")[1].trim();
    }
    
    let nodeData = evolutionNodes[name as keyof typeof evolutionNodes];
    if (!nodeData) {
        const foundKey = Object.keys(evolutionNodes).find(key => desc.includes(key));
        if (foundKey) {
            nodeData = evolutionNodes[foundKey as keyof typeof evolutionNodes];
            name = foundKey;
        }
    }

    if (nodeData) {
        const lvMatch = desc.match(/Lv\.(\d+)/i);
        const level = lvMatch ? parseInt(lvMatch[1], 10) : 1;
        
        if ((nodeData as any).evolution_damage) {
            unifiedItem.evolution_damage = (nodeData as any).evolution_damage * level;
        }

        if (name.includes('달인') && (nodeData as any).additional_damage) {
            unifiedItem.additional_damage_real = (nodeData as any).additional_damage * level;
            unifiedItem.additional_damage = 0;
        }
    }

    const hasStats = Object.entries(unifiedItem).some(([k, v]) => k !== 'type' && k !== 'name' && typeof v === 'number' && v !== 0);

    // engraving_table.json 기반 damage 값 덮어쓰기 (지정된 각인 제외)
    const EXCLUDED_ENGRAVINGS_FROM_TABLE = ["아드레날린", "예리한 둔기", "정밀 단도", "에테르 포식자"];
    if (engravingTable[name as keyof typeof engravingTable] && !EXCLUDED_ENGRAVINGS_FROM_TABLE.includes(name)) {
        const levelKey = String(e.Level || 0);
        const stoneKey = String(e.AbilityStoneLevel || 0);
        // @ts-ignore
        const tableValue = engravingTable[name]?.[levelKey]?.[stoneKey];
        
        if (typeof tableValue === 'number') {
            unifiedItem.damage = tableValue;
            // 테이블 값을 사용할 경우 중복 합산을 방지하기 위해 기존 파싱된 스탯 초기화
            unifiedItem.atk_percent = 0;
            unifiedItem.atk_percent_real = 0;
            unifiedItem.critical_percent = 0;
            unifiedItem.critical_damage = 0;
        }
    }

    if (hasStats) unifiedEquipment.push(unifiedItem);
  });

  // 아크 그리드 효과
  (arkGridData?.Effects || []).forEach((effect: any) => {
    const unifiedItem: UnifiedEquipment = {
      type: '아크 그리드',
      name: effect.Name,
      stat: 0,
      weapon_atk: 0,
      atk: 0,
      damage: 0,
      additional_damage: 0,
      additional_damage_real: 0,
      atk_percent: 0,
      atk_percent_real: 0,
      base_atk_percent: 0,
      weapon_atk_percent: 0,
      critical_percent: 0,
      critical_damage: 0,
      critical_hit_damage: 0,
      cooldown: 0,
      evolution_damage: 0
    };

    extractStats(effect.Tooltip, unifiedItem);

    if (effect.Name === '보스 피해') {
        const cleanText = effect.Tooltip.replace(/<[^>]*>/g, ' ');
        const match = cleanText.match(/보스.*?피해\s*\+?(\d+(?:\.\d+)?)%/);
        if (match) {
            unifiedItem.damage += parseFloat(match[1]);
        }
    }

    const hasStats = Object.entries(unifiedItem).some(([k, v]) => k !== 'type' && k !== 'name' && typeof v === 'number' && v !== 0);
    if (hasStats) unifiedEquipment.push(unifiedItem);
  });

  // 4. 각인 효과
  const allEngravings = [...(engravings || []), ...(arkPassiveEngravings || [])];
  allEngravings.forEach((e: EngravingEffect) => {
    const name = e.Name || "";
    const desc = e.Description || "";

    if (name.includes("아드레날린")) {
      const atkMatch = desc.match(/공격력이\s*(?:<[^>]+>)*(\d*\.\d+|\d+)%/i);
      if (atkMatch) {
          const stackVal = parseFloat(atkMatch[1]);
          const finalVal = stackVal * 6; // Always multiply by 6 for max stacks
          if (finalVal > 0 && !adrenalineBuff) {
              adrenalineBuff = { name: `각인: ${name} (6중첩)`, value: finalVal };
          }
      }
      const critMatch = desc.match(/치명타 적중률이\s*(?:<[^>]+>)*(\d*\.\d+|\d+)%/i);
      if (critMatch) {
        const critVal = parseFloat(critMatch[1]);
        breakdown.critRate.push({ name: `각인: ${name}`, value: critVal });
      }
    }

    if (name.includes("예리한 둔기")) {
      const match = desc.match(/치명타 피해량이\s*(?:<[^>]+>)*(\d*\.\d+|\d+)%/i);
      if (match) {
        breakdown.critDamage.push({ name: `각인: ${name}`, value: parseFloat(match[1]) });
      }
    }

    const unifiedItem: UnifiedEquipment = {
      type: '각인',
      name: name,
      stat: 0,
      weapon_atk: 0,
      atk: 0,
      damage: 0,
      additional_damage: 0,
      additional_damage_real: 0,
      atk_percent: 0,
      atk_percent_real: 0,
      base_atk_percent: 0,
      weapon_atk_percent: 0,
      critical_percent: 0,
      critical_damage: 0,
      critical_hit_damage: 0,
      cooldown: 0,
      evolution_damage: 0
    };

    extractStats(desc, unifiedItem);

    if (name.includes("아드레날린")) {
        const atkMatch = desc.match(/공격력이\s*(?:<[^>]+>)*(\d*\.\d+|\d+)%/i);
        if (atkMatch) {
            const stackVal = parseFloat(atkMatch[1]);
            unifiedItem.atk_percent_real = stackVal * 6;
        }
        const critMatch = desc.match(/치명타 적중률이\s*(?:추가로)?\s*(?:<[^>]+>)*\s*(\d*\.\d+|\d+)%/i);
        if (critMatch) {
             unifiedItem.critical_percent = parseFloat(critMatch[1]);
        }
    }

    const hasStats = Object.entries(unifiedItem).some(([k, v]) => k !== 'type' && k !== 'name' && typeof v === 'number' && v !== 0);
    if (hasStats) unifiedEquipment.push(unifiedItem);
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

    const unifiedItem: UnifiedEquipment = {
      type: '보석',
      name: gem.Name.replace(/<[^>]*>/g, ''),
      stat: 0,
      weapon_atk: 0,
      atk: 0,
      damage: 0,
      additional_damage: 0,
      additional_damage_real: 0,
      atk_percent: 0,
      atk_percent_real: 0,
      base_atk_percent: 0,
      weapon_atk_percent: 0,
      critical_percent: 0,
      critical_damage: 0,
      critical_hit_damage: 0,
      cooldown: 0,
      evolution_damage: 0
    };

    const parseGemTooltip = (text: string) => {
        extractStats(text, unifiedItem);
        const cleanText = text.replace(/<[^>]*>/g, ' ');
        const dmgMatch = cleanText.match(/피해\s*(\d+(?:\.\d+)?)%\s*증가/);
        if (dmgMatch && !cleanText.includes("적에게 주는")) {
             unifiedItem.damage += parseFloat(dmgMatch[1]);
        }
    };

    try {
      const tooltipObj = JSON.parse(gem.Tooltip);
      const traverse = (obj: any) => { 
          if (typeof obj === 'string') parseGemTooltip(obj); 
          else if (typeof obj === 'object' && obj !== null) for (const key in obj) traverse(obj[key]); 
      };
      traverse(tooltipObj);
    } catch (e) { 
        parseGemTooltip(gem.Tooltip); 
    }

    const hasStats = Object.entries(unifiedItem).some(([k, v]) => k !== 'type' && k !== 'name' && typeof v === 'number' && v !== 0);
    if (hasStats) unifiedEquipment.push(unifiedItem);
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

  const critStat = profile.Stats.find(s => s.Type === '치명')?.Value || '0';
  const critFromStat = (parseInt(critStat, 10) * 0.035776614310645724);
  if (critFromStat > 0) {
    breakdown.critRate.push({ name: '기본 치명 스탯', value: critFromStat });
  }
  const totalCritRate = sum(breakdown.critRate);
  const totalCritDamage = sum(breakdown.critDamage.filter(s => !s.name.includes("일격")));
  const totalDamage = breakdown.damage.reduce((acc, source) => acc * (1 + source.value / 100), 1);
  const totalDamagePercent = (totalDamage - 1) * 100;

  const charStats: CharStats = {
    combatPower: (profile?.CombatPower || 0).toLocaleString(),
    attackPower: sumAccessoriesOnly(finalBreakdown.attackPower).toFixed(2) + "%",
    weaponAtkPower: sum(finalBreakdown.weaponAtkPower).toFixed(2) + "%",
    additionalDamage: sumExcludingCombat(finalBreakdown.additionalDamage).toFixed(2) + "%",
    critRate: totalCritRate.toFixed(2) + "%",
    critDamage: totalCritDamage.toFixed(2) + "%",
    damage: totalDamagePercent.toFixed(2) + "%",
    branding: sum(finalBreakdown.branding).toFixed(2) + "%",
    atkBuff: sum(finalBreakdown.atkBuff).toFixed(2) + "%",
    dmgBuff: sum(finalBreakdown.dmgBuff).toFixed(2) + "%",
    breakdown: finalBreakdown
  };

  console.log('Unified Equipment:', unifiedEquipment);

  const unifiedEquipmentTotals = unifiedEquipment.reduce((acc, curr) => ({
    stat: acc.stat + curr.stat,
    weapon_atk: acc.weapon_atk + curr.weapon_atk,
    atk: acc.atk + curr.atk,
    damage: curr.type === '보석' ? acc.damage : ((1 + acc.damage / 100) * (1 + curr.damage / 100) - 1) * 100,
    additional_damage: acc.additional_damage + curr.additional_damage,
    additional_damage_real: acc.additional_damage_real + curr.additional_damage_real,
    atk_percent: acc.atk_percent + curr.atk_percent,
    atk_percent_real: acc.atk_percent_real + curr.atk_percent_real,
    base_atk_percent: acc.base_atk_percent + curr.base_atk_percent,
    weapon_atk_percent: acc.weapon_atk_percent + curr.weapon_atk_percent,
    critical_percent: acc.critical_percent + curr.critical_percent,
    critical_damage: acc.critical_damage + curr.critical_damage,
    critical_hit_damage: acc.critical_hit_damage + curr.critical_hit_damage,
    cooldown: curr.type === '보석' ? acc.cooldown : acc.cooldown + curr.cooldown,
    evolution_damage: acc.evolution_damage + curr.evolution_damage,
  }), { stat: 0, weapon_atk: 0, atk: 0, damage: 0, additional_damage: 0, additional_damage_real: 0, atk_percent: 0, atk_percent_real: 0, base_atk_percent: 0, weapon_atk_percent: 0, critical_percent: 0, critical_damage: 200, critical_hit_damage: 0, cooldown: 0, evolution_damage: 0 });

  console.log('Unified Equipment Totals:', unifiedEquipmentTotals);

  return {
    charStats,
    equipment: equipmentData || [],
    arkPassive: arkPassiveData || null,
    adrenalineBuff,
    unifiedEquipment,
  };
}