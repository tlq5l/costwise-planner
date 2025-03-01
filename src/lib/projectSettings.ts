import type { CalibrationData, ProjectSettings } from "@/types";

// Default settings for new projects
const DEFAULT_SETTINGS: Omit<ProjectSettings, "id" | "createdAt" | "updatedAt"> = {
  measurementUnit: "metric", // Default to metric for Vietnamese users
  scaleFactor: 0.03048, // Default scale factor (same as DEFAULT_PIXELS_TO_METERS)
};

/**
 * Generate a unique ID for settings
 */
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

/**
 * Create new project settings
 */
export function createProjectSettings(): ProjectSettings {
  const now = new Date();
  return {
    ...DEFAULT_SETTINGS,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Calculate scale factor from calibration data
 */
export function calculateScaleFromCalibration(calibrationData: CalibrationData): number {
  const { startPoint, endPoint, referenceLength } = calibrationData;

  // Calculate distance in pixels
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const distanceInPixels = Math.sqrt(dx * dx + dy * dy);

  // Calculate scale factor (meters per pixel)
  if (distanceInPixels <= 0 || referenceLength <= 0) {
    console.warn("Invalid calibration data");
    return DEFAULT_SETTINGS.scaleFactor;
  }

  return referenceLength / distanceInPixels;
}

/**
 * Update project settings with new scale factor
 */
export function updateProjectScale(
  settings: ProjectSettings,
  calibrationData: CalibrationData
): ProjectSettings {
  const scaleFactor = calculateScaleFromCalibration(calibrationData);

  return {
    ...settings,
    scaleFactor,
    referenceLength: calibrationData.referenceLength,
    referencePixels: Math.sqrt(
      (calibrationData.endPoint.x - calibrationData.startPoint.x) ** 2 +
      (calibrationData.endPoint.y - calibrationData.startPoint.y) ** 2
    ),
    updatedAt: new Date(),
  };
}

/**
 * Standard room element sizes in meters for Vietnamese construction
 */
export const STANDARD_VIETNAMESE_SIZES = {
  DOOR_WIDTH: { min: 0.7, typical: 0.8, max: 1.0 },
  WINDOW_WIDTH: { min: 0.6, typical: 1.0, max: 1.5 },
  BATHROOM_WIDTH: { min: 1.2, typical: 1.5, max: 2.5 },
  BEDROOM_WIDTH: { min: 2.4, typical: 3.0, max: 4.0 },
};
