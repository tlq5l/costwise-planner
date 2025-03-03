import {
  type ClassifiedRoom,
  type FurnitureDetectionResponse,
  type FurnitureItem,
  type ProcessedRoboflowResponse,
  RoomType
} from "@/types";

/**
 * Interface describing the final, merged, validated, and enhanced floor plan data
 * produced by our Data Orchestration Layer for use by the Gemini Reasoning.
 */
export interface OrchestratedFloorPlanData {
	/**
	 * Rooms after validation and enhancement.
	 * Typically includes a cleaned-up type, computed area, etc.
	 */
	rooms: OrchestratedRoom[];

	/**
	 * Furniture after assignment/validation.
	 * If we are not using furniture data, can remain empty.
	 */
	furniture: OrchestratedFurniture[];

	/**
	 * The total area (in square meters or consistent unit)
	 * after applying scale factor or user project settings.
	 */
	totalArea: number;

	/**
	 * Number of rooms. Could be computed from rooms.length,
	 * but included explicitly for clarity if needed by Gemini.
	 */
	roomCount: number;

	/**
	 * Any warnings or notes generated during validation.
	 * For example, if a room had zero or negative area,
	 * or if we had to clamp an out-of-bounds value.
	 */
	validationWarnings: string[];
}

/**
 * Represents a single room with relevant fields for AI analysis:
 * - type: e.g. "Bedroom", "Kitchen", "Living Room", ...
 * - area: computed area in the chosen unit (e.g., m²).
 * - raw?: optional reference to raw classification data for debug
 */
export interface OrchestratedRoom {
	type: string;
	area: number;
	// Additional fields for debugging or referencing original data
	raw?: Omit<ClassifiedRoom, "points">;
}

/**
 * Represents a single furniture item with relevant fields for AI analysis:
 * - type: e.g. "Chair", "Table", ...
 * - assignedRoom?: ID or name if assigned to a room
 * - raw?: optional reference to raw furniture item data
 */
export interface OrchestratedFurniture {
	type: string;
	assignedRoom?: string;
	raw?: Omit<FurnitureItem, "points">;
}

/**
 * This service orchestrates data from various detection services into a
 * coherent, validated representation of a floor plan.
 *
 * Main responsibilities:
 * 1) Validating room types
 * 2) Computing areas using scale factors
 * 3) Handling furniture assignments (if any)
 * 4) Returning a consistent OrchestratedFloorPlanData that can be fed to Gemini
 */
/**
 * Orchestrate the final floor plan data from room & furniture detection.
 * @param roomDetection - The processed detection for rooms (post-classification).
 * @param furnitureDetection - The detection for furniture items.
 * @param scaleFactor - The number of real-world meters represented by 1 pixel^1
 *                      or any consistent ratio to compute area. If user is using
 *                      imperial, a different scale factor or conversion is possible.
 * @returns A fully validated & enhanced OrchestratedFloorPlanData object.
 */
export function orchestrateFloorPlan(
	roomDetection: ProcessedRoboflowResponse,
	furnitureDetection?: FurnitureDetectionResponse,
	scaleFactor = 1,
): OrchestratedFloorPlanData {
	const warnings: string[] = [];

	// 1) Validate & format rooms
	const rooms: OrchestratedRoom[] = validateAndFormatRooms(
		roomDetection,
		scaleFactor,
		warnings,
	);

	// 2) Validate & format furniture (if available)
	const furniture: OrchestratedFurniture[] = [];
	if (furnitureDetection) {
		const formattedFurniture = validateAndFormatFurniture(
			furnitureDetection,
			warnings,
		);
		furniture.push(...formattedFurniture);
	}

	// 3) Summation & final pass
	// totalArea is the sum of all validated room areas
	const totalArea = rooms.reduce((sum, room) => sum + room.area, 0);

	return {
		rooms,
		furniture,
		totalArea: Number.parseFloat(totalArea.toFixed(2)),
		roomCount: rooms.length,
		validationWarnings: warnings,
	};
}

/**
 * Validates & normalizes an array of classified rooms from Roboflow,
 * converting bounding box or polygon area to final "area" in real-world units
 * using the provided scaleFactor if needed.
 *
 * @param roomData The processed detection data for rooms (ProcesssedRoboflowResponse)
 * @param scaleFactor The scale factor to convert from raw area to real-world area.
 * @param warnings A string array to which we can push warnings for unusual data.
 * @returns An array of OrchestratedRoom
 */
function validateAndFormatRooms(
	roomData: ProcessedRoboflowResponse,
	scaleFactor: number,
	warnings: string[],
): OrchestratedRoom[] {
	const result: OrchestratedRoom[] = [];

	// Defensive check: roomData might have no predictions
	if (!roomData.predictions || roomData.predictions.length === 0) {
		warnings.push("No rooms detected in the floor plan.");
		return result;
	}

	for (const rawRoom of roomData.predictions) {
		// We assume rawRoom.dimensions.area is the polygon area in pixel^2
		// or some intermediate unit.
		// Or we might do: area = rawRoom.width * rawRoom.height (in pixel^2).
		// Then multiply by scaleFactor^2 to get real area if scaleFactor is in "meters/pixel"

		// If scaleFactor is representing 'meters per pixel', area in m^2 is:
		// rawRoom.dimensions.area * (scaleFactor * scaleFactor).
		const pixelArea = rawRoom.dimensions.area; // from the library
		let computedArea = pixelArea * scaleFactor * scaleFactor;

		// Basic validation
		if (computedArea <= 0) {
			warnings.push(
				`Room with detection_id=${rawRoom.detection_id} has non-positive area (${computedArea}).`,
			);
			// We can skip or set to a small positive fallback
			computedArea = 0;
		}

		// Additionally, check the assigned room type
		const roomType =
			rawRoom.roomType && rawRoom.roomType.length > 0
				? rawRoom.roomType
				: "UnknownRoom";

		// Convert string to RoomType enum value
		const enumValues = Object.values(RoomType) as string[];
		const validRoomType = enumValues.includes(roomType)
			? (roomType as RoomType)
			: RoomType.UNKNOWN;

		result.push({
			type: validRoomType,
			area: Number.parseFloat(computedArea.toFixed(2)),
			raw: {
				...rawRoom,
				// Don't include points as it's omitted in the type
			},
		});
	}

	return result;
}

/**
 * Validates & normalizes furniture data from Roboflow,
 * storing relevant info (type & assigned room if present).
 *
 * @param furnitureData The raw furniture detection from Roboflow
 * @param warnings Array to accumulate warnings
 */
function validateAndFormatFurniture(
	furnitureData: FurnitureDetectionResponse,
	warnings: string[],
): OrchestratedFurniture[] {
	const result: OrchestratedFurniture[] = [];

	if (!furnitureData.predictions || furnitureData.predictions.length === 0) {
		warnings.push("No furniture detected, or furniture detection not run.");
		return result;
	}

	for (const rawItem of furnitureData.predictions) {
		const ft = rawItem.furnitureType || "UnknownFurniture";
		// Optionally see if it was assigned to a room in rawItem.room
		const assignedRoom = rawItem.room || undefined;

		result.push({
			type: ft,
			assignedRoom,
			raw: {
				...rawItem,
			},
		});
	}

	return result;
}

/**
 * Example usage:
 *
 * import { orchestrateFloorPlan } from "./DataOrchestrationService";
 *
 * function handleAnalysis(
 *   roomDetection: ProcessedRoboflowResponse,
 *   furnitureDetection?: FurnitureDetectionResponse
 * ) {
 *   const scaleFactor = 0.03048; // e.g., if 1 pixel ~ 3 cm
 *
 *   const orchestrated = orchestrateFloorPlan(
 *     roomDetection,
 *     furnitureDetection,
 *     scaleFactor
 *   );
 *
 *   console.log("Orchestrated data:", orchestrated);
 *   // => { rooms: [...], furniture: [...], totalArea: #, roomCount: #, validationWarnings: [...] }
 * }
 */
