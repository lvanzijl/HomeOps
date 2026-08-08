import {
  ApiException,
  HomeOpsApiClient,
  type FloorPlanAssetDto,
} from "../api/homeOpsApiClient";

export const maxFloorPlanUploadBytes = 10 * 1024 * 1024;
export const acceptedFloorPlanExtensions = [".svg", ".png", ".jpg", ".jpeg"] as const;

function client() {
  return new HomeOpsApiClient();
}

export function validateFloorPlanFile(file: File): string[] {
  const errors: string[] = [];
  const lowerName = file.name.toLowerCase();
  if (file.size === 0) errors.push("Het bestand is leeg.");
  if (file.size > maxFloorPlanUploadBytes) errors.push("Het bestand is groter dan 10 MiB.");
  if (!acceptedFloorPlanExtensions.some((extension) => lowerName.endsWith(extension))) {
    errors.push("Kies een SVG-, PNG-, JPG- of JPEG-bestand.");
  }
  return errors;
}

export async function uploadFloorPlan(floorId: string, file: File): Promise<FloorPlanAssetDto> {
  const result = await client().uploadFloorPlanAsset(floorId, { data: file, fileName: file.name });
  return result.asset!;
}

export function activateFloorPlan(floorId: string, assetId: string) {
  return client().activateFloorPlanAsset(floorId, assetId);
}

export function friendlyFloorPlanUploadError(error: unknown, fallback: string) {
  if (error instanceof ApiException) {
    const result = error.result as { errors?: Record<string, string[]> } | undefined;
    const first = result?.errors && Object.values(result.errors).flat().find(Boolean);
    if (first) return first;
    if (error.status === 404) return "De geselecteerde verdieping bestaat niet meer. Vernieuw het overzicht.";
  }
  return fallback;
}
