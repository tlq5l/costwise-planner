import type { ClassifiedRoom, RoboflowPoint } from "@/types";
import {
  type FurnitureDetectionResponse,
  type FurnitureItem,
  FurnitureType,
} from "@/types";
import axios from "axios";

const API_KEY = "oru2Kv8shKMEebi3jNUk";
const MODEL_ENDPOINT = "https://detect.roboflow.com/floor_plan_detection/3";

// Define interface for raw Roboflow prediction
interface RoboflowFurniturePrediction {
	x: number;
	y: number;
	width: number;
	height: number;
	confidence: number;
	class: string;
	class_id?: number;
	detection_id?: string;
}

// Colors for different furniture types
export const FURNITURE_COLORS: Record<FurnitureType, string> = {
	[FurnitureType.DOOR]: "#FF5733", // Red-orange
	[FurnitureType.WINDOW]: "#33A8FF", // Light blue
	[FurnitureType.TABLE]: "#33FF57", // Light green
	[FurnitureType.CHAIR]: "#FF33F5", // Pink
	[FurnitureType.SOFA]: "#33FFF5", // Cyan
	[FurnitureType.BED]: "#5733FF", // Purple
	[FurnitureType.SINK]: "#33FFE0", // Turquoise
	[FurnitureType.TOILET]: "#F5FF33", // Yellow
	[FurnitureType.BATHTUB]: "#338AFF", // Blue
	[FurnitureType.STOVE]: "#FF3333", // Red
	[FurnitureType.REFRIGERATOR]: "#33FF8A", // Green
	[FurnitureType.CABINET]: "#A833FF", // Purple
	[FurnitureType.COUNTER]: "#FFB833", // Orange
	[FurnitureType.STAIRS]: "#FF5733", // Orange-red
	[FurnitureType.OTHER]: "#AAAAAA", // Gray
};

/**
	* Map Roboflow class to FurnitureType with improved recognition
 */
function mapToFurnitureType(className: string): FurnitureType {
	const lowerClassName = className.toLowerCase().trim();

	// Door recognition
	if (lowerClassName.includes("door")) return FurnitureType.DOOR;
	
	// Window recognition
	if (lowerClassName.includes("window")) return FurnitureType.WINDOW;
	
	// Table recognition
	if (lowerClassName.includes("table") || lowerClassName.includes("desk")) return FurnitureType.TABLE;
	if (lowerClassName.includes("dining_table")) return FurnitureType.TABLE;
	
	// Chair recognition
	if (lowerClassName.includes("chair")) return FurnitureType.CHAIR;
	
	// Sofa recognition
	if (lowerClassName.includes("sofa") || lowerClassName.includes("couch")) return FurnitureType.SOFA;
	if (lowerClassName.includes("outside_sitting")) return FurnitureType.SOFA;
	
	// Bed recognition
	if (lowerClassName.includes("bed")) return FurnitureType.BED;
	
	// Sink recognition
	if (lowerClassName.includes("sink") || lowerClassName.includes("washroom_sink")) return FurnitureType.SINK;
	
	// Toilet recognition
	if (lowerClassName.includes("toilet") || lowerClassName.includes("wc") || lowerClassName.includes("washroom_seat")) return FurnitureType.TOILET;
	
	// Bathtub recognition
	if (lowerClassName.includes("bathtub") || lowerClassName.includes("shower")) return FurnitureType.BATHTUB;
	
	// Stove recognition
	if (lowerClassName.includes("stove") || lowerClassName.includes("oven")) return FurnitureType.STOVE;
	
	// Refrigerator recognition
	if (lowerClassName.includes("refrigerator") || lowerClassName.includes("fridge")) return FurnitureType.REFRIGERATOR;
	
	// Cabinet recognition
	if (lowerClassName.includes("cabinet") || lowerClassName.includes("wardrobe") || lowerClassName.includes("tv_cabinet")) return FurnitureType.CABINET;
	
	// Counter recognition
	if (lowerClassName.includes("counter")) return FurnitureType.COUNTER;
	
	// Stairs recognition
	if (lowerClassName.includes("stair")) return FurnitureType.STAIRS;

	return FurnitureType.OTHER;
}

/**
 * Process a raw prediction to a FurnitureItem
 */
function processFurnitureItem(prediction: RoboflowFurniturePrediction, index: number): FurnitureItem {
	const furnitureType = mapToFurnitureType(prediction.class);

	return {
		x: prediction.x,
		y: prediction.y,
		width: prediction.width,
		height: prediction.height,
		confidence: prediction.confidence,
		class: prediction.class,
		class_id: prediction.class_id || index + 1,
		detection_id: prediction.detection_id || `furniture_${Date.now()}_${index}`,
		furnitureType,
		color: FURNITURE_COLORS[furnitureType],
		isVisible: true,
		isHighlighted: false,
	};
}

/**
 * Detect furniture in an image using base64 encoded image data
 */
export async function detectFurnitureFromBase64(
	imageBase64: string,
): Promise<FurnitureDetectionResponse> {
	try {
		const response = await axios({
			method: "POST",
			url: MODEL_ENDPOINT,
			params: {
				api_key: API_KEY,
				confidence: 0.4,
				overlap: 30,
				format: "json",
			},
			data: imageBase64,
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});

		console.log("Furniture Detection API response:", response.data);

		// Transform the predictions to furniture items
		const transformedData = {
			...response.data,
			predictions: response.data.predictions.map(processFurnitureItem),
		};

		return transformedData;
	} catch (error) {
		console.error("Error in Furniture Detection API call:", error);
		if (error instanceof Error) {
			throw new Error(`Failed to detect furniture: ${error.message}`);
		}
		throw error;
	}
}

/**
 * Detect furniture in an image using a URL
 */
export async function detectFurnitureFromUrl(
	imageUrl: string,
): Promise<FurnitureDetectionResponse> {
	try {
		const response = await axios({
			method: "POST",
			url: MODEL_ENDPOINT,
			params: {
				api_key: API_KEY,
				confidence: 0.4,
				image: imageUrl,
			},
		});

		// Transform the predictions to furniture items
		const transformedData = {
			...response.data,
			predictions: response.data.predictions.map(processFurnitureItem),
		};

		return transformedData;
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Failed to detect furniture from URL: ${error.message}`);
		}
		throw error;
	}
}

/**
 * Process furniture detection with animation support for UI
 */
export async function detectFurnitureWithAnimation(
	imageBase64: string,
): Promise<{
	fullResponse: FurnitureDetectionResponse;
	getNextItem: () => FurnitureItem | null;
	remainingCount: () => number;
}> {
	// Get the full response first
	const fullResponse = await detectFurnitureFromBase64(imageBase64);
	const items = [...fullResponse.predictions];
	let index = 0;

	// Function to get the next item one at a time
	const getNextItem = (): FurnitureItem | null => {
		if (index < items.length) {
			return items[index++];
		}
		return null;
	};

	// Function to get count of remaining items
	const remainingCount = (): number => {
		return items.length - index;
	};

	return {
		fullResponse,
		getNextItem,
		remainingCount,
	};
}

/**
	* Determine which room contains a furniture item with improved accuracy
 */
export function assignFurnitureToRooms(
	furniture: FurnitureItem[],
	rooms: ClassifiedRoom[],
): FurnitureItem[] {
	return furniture.map((item) => {
		// Get the center point of the furniture item
		const centerX = item.x;
		const centerY = item.y;

		// Find the room that contains this point
		const containingRoom = rooms.find((room) => {
			// Check if the point is inside the room polygon
			return isPointInPolygon(centerX, centerY, room.points);
		});

		// Fall back to checking if majority of the furniture is in a room
		// if the center point isn't in any room
		if (!containingRoom) {
			// Check corners of the furniture bounding box
			const corners = [
				{ x: item.x - item.width / 2, y: item.y - item.height / 2 }, // Top-left
				{ x: item.x + item.width / 2, y: item.y - item.height / 2 }, // Top-right
				{ x: item.x - item.width / 2, y: item.y + item.height / 2 }, // Bottom-left
				{ x: item.x + item.width / 2, y: item.y + item.height / 2 }, // Bottom-right
			];
			
			// Count how many corners are in each room
			const roomCounts: Record<string, number> = {};
			let maxCount = 0;
			let bestRoom: ClassifiedRoom | null = null;
			
			for (const corner of corners) {
				for (const room of rooms) {
					if (isPointInPolygon(corner.x, corner.y, room.points)) {
						roomCounts[room.detection_id] = (roomCounts[room.detection_id] || 0) + 1;
						
						if (roomCounts[room.detection_id] > maxCount) {
							maxCount = roomCounts[room.detection_id];
							bestRoom = room;
						}
					}
				}
			}
			
			// If at least 2 corners are in a room, assign it to that room
			if (maxCount >= 2 && bestRoom) {
				return {
					...item,
					room: bestRoom.detection_id,
				};
			}
		}

		return {
			...item,
			room: containingRoom?.detection_id,
		};
	});
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function isPointInPolygon(x: number, y: number, polygon: RoboflowPoint[]): boolean {
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i].x;
		const yi = polygon[i].y;
		const xj = polygon[j].x;
		const yj = polygon[j].y;

		const intersect = ((yi > y) !== (yj > y))
			&& (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
		if (intersect) inside = !inside;
	}
	return inside;
}

/**
 * Count furniture items by type
 */
export function countFurnitureByType(
	furniture: FurnitureItem[],
): Record<FurnitureType, number> {
	return furniture.reduce(
		(acc, item) => {
			const type = item.furnitureType;
			acc[type] = (acc[type] || 0) + 1;
			return acc;
		},
		{} as Record<FurnitureType, number>,
	);
}

/**
 * Count furniture items by room and type
 */
export function countFurnitureByRoom(
	furniture: FurnitureItem[],
): Record<string, Record<FurnitureType, number>> {
	return furniture.reduce(
		(acc, item) => {
			if (item.room) {
				if (!acc[item.room]) {
					acc[item.room] = {} as Record<FurnitureType, number>;
				}

				const type = item.furnitureType;
				acc[item.room][type] = (acc[item.room][type] || 0) + 1;
			}
			return acc;
		},
		{} as Record<string, Record<FurnitureType, number>>,
	);
}