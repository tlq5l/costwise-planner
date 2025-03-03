import type {
    ProcessedRoboflowResponse,
    RoboflowPoint,
    RoboflowResponse
} from "@/types";
import axios from "axios";
import { classifyRooms } from "./roomClassifier";

const API_KEY = "oru2Kv8shKMEebi3jNUk";
const MODEL_ENDPOINT = "https://outline.roboflow.com/room-detection-6nzte/1";

interface RawPrediction {
	x: number;
	y: number;
	width: number;
	height: number;
	confidence: number;
	class: string;
	points?: RoboflowPoint[];
}

/**
 * Transform raw prediction data to include required properties
 */
function transformPrediction(prediction: RawPrediction, index: number) {
	// Use API-provided polygon points if available, otherwise generate from bounding box
	let points = prediction.points || generatePointsFromBoundingBox(prediction);

	// If we have many points (complex polygon from segmentation), simplify it
	if (points.length > 10) {
		points = simplifyPolygon(points, 2);
	}

	return {
		...prediction,
		// Ensure points are included
		points,
		// Generate unique class_id and detection_id if not provided by API
		class_id: index + 1,
		detection_id: `detection_${Date.now()}_${index}`
	};
}

/**
 * Generate polygon points from a bounding box
 */
function generatePointsFromBoundingBox(box: {
	x: number;
	y: number;
	width: number;
	height: number;
}): RoboflowPoint[] {
	return [
		{ x: box.x - box.width / 2, y: box.y - box.height / 2 },
		{ x: box.x + box.width / 2, y: box.y - box.height / 2 },
		{ x: box.x + box.width / 2, y: box.y + box.height / 2 },
		{ x: box.x - box.width / 2, y: box.y + box.height / 2 },
	];
}

/**
 * Detect rooms in an image using base64 encoded image data
 */
export async function detectRoomsFromBase64(
	imageBase64: string,
): Promise<RoboflowResponse> {
	try {
		const response = await axios({
			method: "POST",
			url: MODEL_ENDPOINT,
			params: {
				api_key: API_KEY,
				confidence: 0.4, // Higher confidence for better detection
				overlap: 30, // Add overlap parameter for better detection
				stroke: 2, // Outline thickness for visualization
				labels: true, // Show labels on detected rooms
				format: "json", // Ensure JSON response
				mask: true, // Request polygon masks when available
			},
			data: imageBase64,
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});

		console.log("Roboflow API response:", response.data);

		// Transform the predictions to include all required properties
		const transformedData = {
			...response.data,
			predictions: response.data.predictions.map(transformPrediction),
		};

		return transformedData;
	} catch (error) {
		console.error("Error in Roboflow API call:", error);
		if (error instanceof Error) {
			throw new Error(`Failed to detect rooms: ${error.message}`);
		}
		throw error;
	}
}

/**
 * Process and simplify polygon points to reduce complexity while maintaining shape
 * This is useful for complex polygons returned by segmentation models
 */
export function simplifyPolygon(
	points: RoboflowPoint[],
	tolerance = 2,
): RoboflowPoint[] {
	if (points.length <= 4) return points;

	// Simple Douglas-Peucker-like algorithm to reduce points
	const result: RoboflowPoint[] = [points[0]];

	for (let i = 1; i < points.length - 1; i++) {
		const prev = points[i - 1];
		const current = points[i];
		const next = points[i + 1];

		// Calculate distance between current point and line formed by prev-next
		const dx = next.x - prev.x;
		const dy = next.y - prev.y;
		const length = Math.sqrt(dx * dx + dy * dy);

		if (length < 0.0001) continue; // Skip if points are too close

		const distance = Math.abs(
			(dy * current.x - dx * current.y + next.x * prev.y - next.y * prev.x) /
				length,
		);

		if (distance > tolerance) {
			result.push(current);
		}
	}

	result.push(points[points.length - 1]);
	return result;
}

/**
 * Enhanced room detection that includes classification
 */
export async function detectAndClassifyRoomsFromBase64(
	imageBase64: string,
): Promise<ProcessedRoboflowResponse> {
	try {
		const detection = await detectRoomsFromBase64(imageBase64);

		// Classify the rooms based on dimensions
		const classifiedRooms = classifyRooms(detection.predictions);

		return {
			...detection,
			predictions: classifiedRooms,
		};
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Failed to classify rooms: ${error.message}`);
		}
		throw error;
	}
}

/**
 * Detect rooms in an image using a URL
 */
export async function detectRoomsFromUrl(
	imageUrl: string,
): Promise<RoboflowResponse> {
	try {
		const response = await axios({
			method: "POST",
			url: MODEL_ENDPOINT,
			params: {
				api_key: API_KEY,
				confidence: 0.2,
				iou_threshold: 0.5,
				image: imageUrl,
			},
		});

		// Transform the predictions to include all required properties
		const transformedData = {
			...response.data,
			predictions: response.data.predictions.map(transformPrediction),
		};

		return transformedData;
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Failed to detect rooms from URL: ${error.message}`);
		}
		throw error;
	}
}
