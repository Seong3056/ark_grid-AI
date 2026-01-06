
import { GoogleGenAI, Type } from "@google/genai";
import { ArkGridGem, AnalysisResponse, MultiOptimizationResult, CoreGrade, CoreType, SingleOptimization, PlayerRole } from "../types";

const SCALING_DATA = {
  "질서의 해": { "10": 1.5, "14": 4.0, "17": 7.5, "18": 7.67, "19": 7.83, "20": 8.0 },
  "질서의 달": { "10": 1.5, "14": 4.0, "17": 7.5, "18": 7.67, "19": 7.83, "20": 8.0 },
  "질서의 별": { "10": 1.0, "14": 2.5, "17": 4.5, "18": 4.67, "19": 4.83, "20": 5.0 },
  "혼돈의 해": { "10": 0.5, "14": 1.0, "17": 2.5, "18": 2.67, "19": 2.83, "20": 3.0 },
  "혼돈의 달": { "10": 0.5, "14": 1.0, "17": 2.5, "18": 2.67, "19": 2.83, "20": 3.0 },
  "혼돈의 별": { "10": 0.5, "14": 1.0, "17": 2.5, "18": 2.67, "19": 2.83, "20": 3.0 }
};

const WILL_LIMITS = {
  'Hero': 9,
  'Legend': 12,
  'Relic': 15,
  'Ancient': 17
};

const POINT_LIMITS = {
  'Hero': 10,
  'Legend': 14,
  'Relic': 20,
  'Ancient': 20
};

const COMBAT_COEFFICIENTS: Record<string, number> = {
  '공격력': 0.00036666,
  '추가 피해': 0.000807692307692308,
  '보스 피해': 0.00083334,
  '낙인력': 0.0005,
  '아군 공격 강화': 0.0005,
  '아군 피해 강화': 0.0005
};

export const analyzeArkGridFromImage = async (base64Image: string): Promise<AnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    로스트아크 아크그리드 젬 분석 전문가입니다. 스크린샷 우측 젬 리스트를 분석하세요.
    - category: 젬 구체의 색상을 보고 '질서'(붉은색/분홍색 계열) 또는 '혼돈'(푸른색/청색 계열)으로 분류하세요.
    - 의지력(will): 노란색 P 배지 바로 위 숫자 (1~5)
    - 포인트(point): 노란색 P 배지 안의 숫자
    - 옵션: 각 젬마다 두 줄의 효과 명칭과 레벨(Lv.숫자)을 추출하세요.
    
    반드시 JSON 객체로 응답하세요.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{
      parts: [
        { text: prompt },
        { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
      ]
    }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detectedGems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                category: { type: Type.STRING },
                will: { type: Type.INTEGER },
                point: { type: Type.NUMBER },
                option1: { type: Type.OBJECT, properties: { effect: { type: Type.STRING }, level: { type: Type.NUMBER } } },
                option2: { type: Type.OBJECT, properties: { effect: { type: Type.STRING }, level: { type: Type.NUMBER } } }
              },
              required: ["category", "will", "point", "option1", "option2"]
            }
          }
        }
      }
    }
  });

  const data = JSON.parse(response.text?.trim() || '{"detectedGems": []}');
  data.detectedGems = (data.detectedGems || []).map((g: any, i: number) => ({
    ...g,
    id: g.id || `arkgem-${Date.now()}-${i}`
  }));
  return data as AnalysisResponse;
};

export const optimizeAllCores = async (gems: ArkGridGem[], coreConfigs: Record<CoreType, CoreGrade>, role: PlayerRole): Promise<MultiOptimizationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    인벤토리 젬 목록: ${JSON.stringify(gems)}
    코어 설정: ${JSON.stringify(coreConfigs)}
    플레이어 역할: ${role === 'dealer' ? '딜러' : '서폿'}
    의지력 제한: ${JSON.stringify(WILL_LIMITS)}
    포인트 제한: ${JSON.stringify(POINT_LIMITS)}
    포인트 스케일링 데이터: ${JSON.stringify(SCALING_DATA)}
    전투 옵션 계수: ${JSON.stringify(COMBAT_COEFFICIENTS)}
    
    필수 규칙 (절대 준수):
    1. 각 코어당 최대 4개의 젬만 배치할 수 있습니다. 4개를 초과하면 안됩니다.
    2. 코어 등급별 포인트/의지력 합계가 상한선을 넘지 않도록 하세요.
    3. 역할별 유효 옵션만 가치 있게 평가하세요.
    4. 중복 사용 금지.
  `;

  const coreResultSchema = {
    type: Type.OBJECT,
    properties: {
      slots: { 
        type: Type.ARRAY, 
        items: {
          type: Type.OBJECT,
          properties: {
            slotId: { type: Type.INTEGER },
            gem: { 
              type: Type.OBJECT, 
              properties: { 
                id: { type: Type.STRING }, 
                category: { type: Type.STRING }, 
                will: { type: Type.INTEGER }, 
                point: { type: Type.NUMBER }, 
                option1: { type: Type.OBJECT, properties: { effect: { type: Type.STRING }, level: { type: Type.NUMBER } } }, 
                option2: { type: Type.OBJECT, properties: { effect: { type: Type.STRING }, level: { type: Type.NUMBER } } } 
              } 
            },
            isActive: { type: Type.BOOLEAN }
          }
        } 
      },
      summary: {
        type: Type.OBJECT,
        properties: {
          totalPoints: { type: Type.NUMBER },
          totalWill: { type: Type.NUMBER },
          willLimit: { type: Type.NUMBER },
          scalingGain: { type: Type.NUMBER },
          combatOptionGain: { type: Type.NUMBER },
          totalPowerGain: { type: Type.NUMBER },
          effectTotals: { 
            type: Type.OBJECT, 
            properties: {
              '공격력': { type: Type.NUMBER },
              '보스 피해': { type: Type.NUMBER },
              '추가 피해': { type: Type.NUMBER },
              '낙인력': { type: Type.NUMBER },
              '아군 공격 강화': { type: Type.NUMBER },
              '아군 피해 강화': { type: Type.NUMBER }
            } 
          }
        },
        required: ["totalPoints", "totalWill", "willLimit", "scalingGain", "effectTotals"]
      },
      reasoning: { type: Type.STRING }
    },
    required: ["slots", "summary", "reasoning"]
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          results: { 
            type: Type.OBJECT,
            properties: {
              '질서의 해': coreResultSchema,
              '질서의 달': coreResultSchema,
              '질서의 별': coreResultSchema,
              '혼돈의 해': coreResultSchema,
              '혼돈의 달': coreResultSchema,
              '혼돈의 별': coreResultSchema
            },
            required: ['질서의 해', '질서의 달', '질서의 별', '혼돈의 해', '혼돈의 달', '혼돈의 별']
          },
          totalExpectedGain: { type: Type.NUMBER }
        },
        required: ["results", "totalExpectedGain"]
      }
    }
  });

  return JSON.parse(response.text?.trim() || '{"results": {}, "totalExpectedGain": 0}') as MultiOptimizationResult;
};
