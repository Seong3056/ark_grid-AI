
export interface ArmoryProfile {
  CharacterImage: string;
  ExpeditionLevel: number;
  TownLevel: number;
  TownName: string;
  Title: string | null;
  GuildMemberGrade: string;
  GuildName: string;
  UsingSkillPoint: number;
  TotalSkillPoint: number;
  Stats: Stat[];
  Tendencies: Tendency[];
  CombatPower: string;
  Decorations: any; // Simplified for now
  HonorPoint: number;
  ServerName: string;
  CharacterName: string;
  CharacterLevel: number;
  CharacterClassName: string;
  ItemAvgLevel: string;
}

export interface Stat {
  Type: string;
  Value: string;
  Tooltip: string[];
}

export interface Tendency {
  Type: string;
  Point: number;
  MaxPoint: number;
}

export interface ArmoryEquipment {
  Type: string;
  Name: string;
  Icon: string;
  Grade: string;
  Tooltip: string;
}

export interface ArkPassiveEffect {
    Name: string;
    Description: string;
}

export interface ArkPassive {
    Effects: ArkPassiveEffect[];
    Points: any[]; // Define more strictly if needed
}

export interface Engraving {
    Engravings: any[]; // Define more strictly if needed
    Effects: any[]; // Define more strictly if needed
    ArkPassiveEffects: any[]; // Define more strictly if needed
}

// You can expand these types as needed based on what you use from the API.
