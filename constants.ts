
import { CoreType, CoreGrade } from './types';

export const DEALER_EFFECTS = ['공격력', '보스 피해', '추가 피해'];
export const SUPPORT_EFFECTS = ['낙인력', '아군 공격 강화', '아군 피해 강화'];

export const GEM_COEFFICIENTS: Record<string, number> = {
  '공격력': 0.00036666,
  '추가 피해': 0.000807692307692308,
  '보스 피해': 0.00083334,
  '낙인력': 0.0005,
  '아군 공격 강화': 0.13,
  '아군 피해 강화': 0.0525
};

export const CORE_TYPES: CoreType[] = [
  '질서의 해', '질서의 달', '질서의 별', 
  '혼돈의 해', '혼돈의 달', '혼돈의 별'
];

export interface GradeOption {
  label: string;
  value: CoreGrade;
  will: number;
  point: number;
  slotCount: number;
}

export const GRADE_OPTIONS: GradeOption[] = [
  { label: '영웅', value: 'Hero', will: 9, point: 10, slotCount: 3 },
  { label: '전설', value: 'Legend', will: 12, point: 14, slotCount: 4 },
  { label: '유물', value: 'Relic', will: 15, point: 20, slotCount: 4 },
  { label: '고대', value: 'Ancient', will: 17, point: 20, slotCount: 4 },
];

export const WILL_LIMITS: Record<CoreGrade, number> = {
  'Hero': 9,
  'Legend': 12,
  'Relic': 15,
  'Ancient': 17
};

export const POINT_LIMITS: Record<CoreGrade, number> = {
  'Hero': 10,
  'Legend': 14,
  'Relic': 20,
  'Ancient': 20
};

export const TARGET_POINTS: Record<CoreGrade, number> = {
  'Hero': 10,
  'Legend': 14,
  'Relic': 17,
  'Ancient': 17
};
