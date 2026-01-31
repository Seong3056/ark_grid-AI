import arkGridCoreData from "../meta/arkgrid_core.json";

export const DEALER_SCALING_TABLE: Record<string, Record<number, number>> = arkGridCoreData.dealer as unknown as Record<string, Record<number, number>>;
export const SUPPORT_SCALING_TABLE: Record<string, Record<number, number>> = arkGridCoreData.support as unknown as Record<string, Record<number, number>>;