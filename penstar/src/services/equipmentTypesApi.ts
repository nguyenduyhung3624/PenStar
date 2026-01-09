import { getMasterEquipments } from "./masterEquipmentsApi";
export const getEquipmentTypes = async (): Promise<string[]> => {
  try {
    const equipments = await getMasterEquipments();
    const types = Array.from(
      new Set((equipments || []).map((eq: { type: string }) => String(eq.type)))
    );
    return types as string[];
  } catch (error) {
    console.error("Error fetching equipment types:", error);
    return [];
  }
};
