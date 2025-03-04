// Constants for unit conversion
export const METERS_TO_FEET = 3.28084; // length conversion
export const SQ_METERS_TO_SQ_FEET = 10.7639; // area conversion

// Unit system type (imported from context for convenience)
import type { UnitSystem } from "@/context/UnitSystemContext";

/**
 * Convert a length in meters to the user's chosen unit, returning a numeric value.
 */
export function convertLength(meters: number, system: UnitSystem): number {
	return system === "imperial" ? meters * METERS_TO_FEET : meters;
}

/**
 * Convert an area in square meters to the user's chosen unit, returning a numeric value.
 */
export function convertArea(squareMeters: number, system: UnitSystem): number {
	return system === "imperial"
		? squareMeters * SQ_METERS_TO_SQ_FEET
		: squareMeters;
}

/**
 * Format a length with appropriate unit labels and decimal logic.
 * E.g. "3,2 m" for metric or "10.5 ft" for imperial.
 */
export function formatLength(meters: number, system: UnitSystem): string {
	const value = convertLength(meters, system);
	// Vietnamese format with commas for metric
	const formatted =
		system === "metric" ? value.toFixed(1).replace(".", ",") : value.toFixed(1);

	return system === "imperial" ? `${formatted} ft` : `${formatted} m`;
}

/**
 * Format an area with appropriate unit labels and decimal logic.
 * E.g. "15,5 m²" for metric or "166.8 sq ft" for imperial.
 */
export function formatArea(squareMeters: number, system: UnitSystem): string {
	const value = convertArea(squareMeters, system);
	// Vietnamese format with commas for metric
	const formatted =
		system === "metric" ? value.toFixed(1).replace(".", ",") : value.toFixed(1);

	return system === "imperial" ? `${formatted} sq ft` : `${formatted} m²`;
}
